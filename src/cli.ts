#!/usr/bin/env node

/**
 * Superlines MCP Server CLI
 *
 * A Model Context Protocol (MCP) server for accessing Superlines AI visibility analytics.
 * Supports both local (stdio) and remote (HTTP) transport modes.
 *
 * Usage:
 *   npx @superlines/mcp-server              # Local mode (stdio) - default
 *   npx @superlines/mcp-server local        # Local mode (stdio)
 *   npx @superlines/mcp-server http         # Remote HTTP server mode
 *   npx @superlines/mcp-server --help       # Show help
 *
 * Environment Variables:
 *   SUPERLINES_API_KEY    - Required. Your Superlines API key (starts with sl_live_)
 *   MCP_SERVER_URL        - Optional. Override the default MCP server URL
 *   DEBUG                 - Optional. Set to 'true' for debug logging
 *
 * @see https://www.superlines.io/platform/mcp-api
 * @see https://modelcontextprotocol.io
 */

import * as https from "https";
import * as http from "http";
import * as readline from "readline";
import * as fs from "fs";

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_SERVER_URL = "https://mcp.superlines.io";

const config = {
  serverUrl: process.env.MCP_SERVER_URL || DEFAULT_SERVER_URL,
  apiKey: process.env.SUPERLINES_API_KEY,
  debug: process.env.DEBUG === "true",
  httpPort: parseInt(process.env.PORT || "3000", 10),
};

// ============================================================================
// Debug Logging
// ============================================================================

const logFile = config.debug
  ? fs.createWriteStream("/tmp/superlines-mcp-debug.log", { flags: "a" })
  : null;

function debug(...args: unknown[]): void {
  if (config.debug && logFile) {
    logFile.write(`[${new Date().toISOString()}] ${args.join(" ")}\n`);
  }
}

function logError(...args: unknown[]): void {
  if (logFile) {
    logFile.write(
      `[${new Date().toISOString()}] [ERROR] ${args.join(" ")}\n`
    );
  }
}

// ============================================================================
// JSON-RPC Types
// ============================================================================

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id?: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// ============================================================================
// Error Codes (JSON-RPC 2.0 standard)
// ============================================================================

const ErrorCode = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;

// ============================================================================
// Response Helpers
// ============================================================================

function createError(
  id: string | number | null,
  code: number,
  message: string
): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    error: { code, message },
  };
}

function outputResponse(response: JsonRpcResponse): void {
  console.log(JSON.stringify(response));
}

// ============================================================================
// HTTP Client for Remote MCP Server
// ============================================================================

async function forwardToServer(
  message: JsonRpcRequest
): Promise<JsonRpcResponse> {
  return new Promise((resolve) => {
    const data = JSON.stringify(message);
    const url = new URL(config.serverUrl);

    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        Authorization: `Bearer ${config.apiKey}`,
      },
      timeout: 90000, // 90s to handle cold starts
    };

    debug("Forwarding to server:", config.serverUrl);
    debug("Request:", data);

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        debug("Response status:", res.statusCode);
        debug("Response body:", responseData);

        try {
          const parsed = JSON.parse(responseData) as JsonRpcResponse;

          // Ensure required fields
          if (!parsed.jsonrpc) {
            parsed.jsonrpc = "2.0";
          }
          if (parsed.error && !parsed.id && message.id) {
            parsed.id = message.id;
          }

          resolve(parsed);
        } catch (error) {
          logError("Failed to parse server response:", responseData);
          resolve(
            createError(
              message.id ?? null,
              ErrorCode.INTERNAL_ERROR,
              `Failed to parse server response: ${responseData.substring(0, 200)}`
            )
          );
        }
      });
    });

    req.on("error", (error) => {
      logError("Connection error:", error.message);
      resolve(
        createError(
          message.id ?? null,
          ErrorCode.INTERNAL_ERROR,
          `Connection error: ${error.message}`
        )
      );
    });

    req.on("timeout", () => {
      req.destroy();
      resolve(
        createError(
          message.id ?? null,
          ErrorCode.INTERNAL_ERROR,
          "Request timeout - server may be experiencing cold start. Please retry."
        )
      );
    });

    req.write(data);
    req.end();
  });
}

// ============================================================================
// Local Mode (stdio transport)
// ============================================================================

function runLocalMode(): void {
  debug("Starting Superlines MCP in local (stdio) mode");
  debug("Server URL:", config.serverUrl);
  debug(
    "API Key:",
    config.apiKey ? `${config.apiKey.substring(0, 15)}...` : "NOT SET"
  );

  if (!config.apiKey) {
    outputResponse(
      createError(
        null,
        ErrorCode.INVALID_REQUEST,
        "SUPERLINES_API_KEY environment variable not set. Get your API key at https://analytics.superlines.io/settings/api-keys"
      )
    );
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on("line", async (line) => {
    try {
      debug("Received:", line);
      const message = JSON.parse(line) as JsonRpcRequest;

      // Check if this is a notification (no id field)
      const isNotification = !("id" in message) || message.id === undefined;
      debug("Is notification:", isNotification);

      const response = await forwardToServer(message);

      // Notifications don't need responses
      if (!isNotification) {
        outputResponse(response);
      }
    } catch (error) {
      debug("Parse error:", (error as Error).message);
      outputResponse(createError(null, ErrorCode.PARSE_ERROR, "Parse error"));
    }
  });

  rl.on("close", () => {
    debug("stdin closed, exiting");
    process.exit(0);
  });

  // Handle uncaught exceptions gracefully
  process.on("uncaughtException", (error) => {
    logError("Uncaught exception:", error.message);
    outputResponse(
      createError(
        null,
        ErrorCode.INTERNAL_ERROR,
        `Internal error: ${error.message}`
      )
    );
  });
}

// ============================================================================
// HTTP Server Mode
// ============================================================================

function runHttpMode(): void {
  debug("Starting Superlines MCP in HTTP server mode");
  debug("Port:", config.httpPort);

  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    // Handle preflight
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Only allow POST
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          createError(null, ErrorCode.INVALID_REQUEST, "Method not allowed")
        )
      );
      return;
    }

    // Collect body
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        const message = JSON.parse(body) as JsonRpcRequest;

        // Use API key from Authorization header if provided
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
          config.apiKey = authHeader.substring(7);
        }

        if (!config.apiKey) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify(
              createError(
                message.id ?? null,
                ErrorCode.INVALID_REQUEST,
                "API key required. Set SUPERLINES_API_KEY or pass Authorization header."
              )
            )
          );
          return;
        }

        const response = await forwardToServer(message);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify(createError(null, ErrorCode.PARSE_ERROR, "Parse error"))
        );
      }
    });
  });

  server.listen(config.httpPort, () => {
    console.log(`🚀 Superlines MCP Server running on http://localhost:${config.httpPort}`);
    console.log("");
    console.log("Endpoints:");
    console.log(`  POST http://localhost:${config.httpPort}/`);
    console.log("");
    console.log("Usage:");
    console.log('  curl -X POST http://localhost:' + config.httpPort + ' \\');
    console.log('    -H "Content-Type: application/json" \\');
    console.log('    -H "Authorization: Bearer YOUR_API_KEY" \\');
    console.log('    -d \'{"jsonrpc":"2.0","method":"tools/list","id":1}\'');
    console.log("");
    console.log("Press Ctrl+C to stop.");
  });
}

// ============================================================================
// Help Text
// ============================================================================

function showHelp(): void {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                         Superlines MCP Server                             ║
║               AI Visibility Analytics for Claude & Cursor                 ║
╚═══════════════════════════════════════════════════════════════════════════╝

USAGE
  npx @superlines/mcp-server [command] [options]

COMMANDS
  local     Run in local mode (stdio transport) - DEFAULT
  http      Run as HTTP server for remote access
  --help    Show this help message
  --version Show version

ENVIRONMENT VARIABLES
  SUPERLINES_API_KEY    Required. Your API key from Superlines
                        Get it at: https://analytics.superlines.io/settings/api-keys

  MCP_SERVER_URL        Optional. Override the default server URL
                        Default: https://mcp.superlines.io

  DEBUG                 Optional. Set to 'true' for debug logging
                        Logs to: /tmp/superlines-mcp-debug.log

  PORT                  Optional. Port for HTTP mode (default: 3000)

QUICK START
  1. Get your API key:
     https://analytics.superlines.io/settings/api-keys

  2. Configure Claude Desktop:
     Edit ~/Library/Application Support/Claude/claude_desktop_config.json

     {
       "mcpServers": {
         "superlines": {
           "command": "npx",
           "args": ["-y", "@superlines/mcp-server"],
           "env": {
             "SUPERLINES_API_KEY": "sl_live_YOUR_API_KEY"
           }
         }
       }
     }

  3. Restart Claude Desktop and start asking questions!

EXAMPLES
  # Local mode (for Claude Desktop, Cursor)
  SUPERLINES_API_KEY=sl_live_xxx npx @superlines/mcp-server

  # HTTP server mode
  SUPERLINES_API_KEY=sl_live_xxx npx @superlines/mcp-server http

  # With debug logging
  DEBUG=true SUPERLINES_API_KEY=sl_live_xxx npx @superlines/mcp-server

AVAILABLE TOOLS
  Once connected, Claude has access to these tools:

  Brand Analytics:
    • list_brands              - List all brands you have access to
    • get_brand_details        - Get brand configuration and competitors
    • analyze_metrics          - Brand visibility, citations, share of voice
    • get_weekly_performance   - Weekly trend analysis

  Citations:
    • get_citation_data        - Domain and URL citation analysis
    • get_top_cited_url_per_prompt - Top cited URLs per query

  Competitor Analysis:
    • analyze_brand_mentions   - Competitor mentions with sentiment
    • get_competitive_gap      - Find competitive opportunities
    • get_competitor_insights  - Comprehensive competitor overview

  Content Strategy:
    • get_query_data           - Query analysis with search volumes
    • find_content_opportunities - Topics with improvement potential
    • get_fanout_query_insights - LLM source query analysis

  Webpage Analysis:
    • webpage_crawl            - Fetch and parse webpage content
    • webpage_audit            - Full LLM-friendliness audit
    • webpage_analyze_technical - Technical SEO analysis
    • webpage_analyze_content  - Content quality analysis
    • schema_optimizer         - Optimize Schema.org markup

DOCUMENTATION
  https://www.superlines.io/platform/mcp-api
  https://github.com/Superlines/mcp-server

SUPPORT
  support@superlines.io
`);
}

// ============================================================================
// Version
// ============================================================================

function showVersion(): void {
  console.log("@superlines/mcp-server v1.0.0-beta.5");
}

// ============================================================================
// Main Entry Point
// ============================================================================

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  switch (command) {
    case "--help":
    case "-h":
    case "help":
      showHelp();
      break;

    case "--version":
    case "-v":
    case "version":
      showVersion();
      break;

    case "http":
      runHttpMode();
      break;

    case "local":
    case undefined:
    default:
      runLocalMode();
      break;
  }
}

main();

