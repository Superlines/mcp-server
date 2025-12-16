/**
 * Superlines MCP Server
 *
 * Model Context Protocol (MCP) server for accessing Superlines AI visibility analytics.
 *
 * @module @superlines/mcp-server
 * @see https://superlines.io/integrations/mcp
 * @see https://modelcontextprotocol.io
 */

export const VERSION = "1.0.0-beta.3";

export const DEFAULT_SERVER_URL =
  "https://europe-west1-superlines-platform-prod.cloudfunctions.net/mcp";

/**
 * Available MCP tools provided by Superlines
 */
export const AVAILABLE_TOOLS = {
  // Brand Analytics
  list_brands: "List all brands available to the user",
  get_brand_details: "Get detailed brand configuration and competitors",
  analyze_metrics: "Core metrics: visibility, citations, share of voice",
  get_weekly_performance: "Weekly trend analysis",
  get_period_comparison: "Compare current vs previous period",

  // Citations
  get_citation_data: "Domain and URL citation analysis",
  get_top_cited_url_per_prompt: "Top cited URLs per query",

  // Competitor Analysis
  analyze_brand_mentions: "Competitor mentions with sentiment",
  get_competitive_gap: "Find competitive opportunities",
  get_competitor_insights: "Comprehensive competitor overview",
  get_best_performing_prompt: "Best performing prompts",

  // Content Strategy
  get_query_data: "Query analysis with search volumes",
  find_content_opportunities: "Topics with improvement potential",
  get_fanout_query_insights: "LLM source query analysis",
  get_analytics_summary: "High-level analytics overview",
  analyze_sentiment: "Sentiment analysis of AI responses",

  // Webpage Analysis
  webpage_crawl: "Fetch and parse webpage content",
  webpage_audit: "Full LLM-friendliness audit",
  webpage_analyze_technical: "Technical SEO analysis",
  webpage_analyze_content: "Content quality analysis",
  schema_optimizer: "Optimize Schema.org markup",
  analyze_competitor_url: "Deep-dive analysis of competitor URLs",
} as const;

export type ToolName = keyof typeof AVAILABLE_TOOLS;

/**
 * Configuration options for the MCP client
 */
export interface MCPClientConfig {
  /** Superlines API key (starts with sl_live_) */
  apiKey: string;
  /** Optional: Override the default server URL */
  serverUrl?: string;
  /** Optional: Enable debug logging */
  debug?: boolean;
}

/**
 * JSON-RPC request type
 */
export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: unknown;
}

/**
 * JSON-RPC response type
 */
export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id?: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/**
 * Simple MCP client for programmatic usage
 *
 * @example
 * ```typescript
 * import { SuperlinesMCPClient } from '@superlines/mcp-server';
 *
 * const client = new SuperlinesMCPClient({
 *   apiKey: 'sl_live_YOUR_KEY'
 * });
 *
 * const tools = await client.listTools();
 * const result = await client.callTool('list_brands', {});
 * ```
 */
export class SuperlinesMCPClient {
  private config: Required<MCPClientConfig>;

  constructor(options: MCPClientConfig) {
    this.config = {
      apiKey: options.apiKey,
      serverUrl: options.serverUrl || DEFAULT_SERVER_URL,
      debug: options.debug || false,
    };
  }

  /**
   * Send a JSON-RPC request to the MCP server
   */
  async request(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const response = await fetch(this.config.serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<JsonRpcResponse>;
  }

  /**
   * Initialize the MCP connection
   */
  async initialize(): Promise<JsonRpcResponse> {
    return this.request({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
    });
  }

  /**
   * List all available tools
   */
  async listTools(): Promise<JsonRpcResponse> {
    return this.request({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
    });
  }

  /**
   * Call a specific tool with arguments
   */
  async callTool(
    name: ToolName | string,
    args: Record<string, unknown>
  ): Promise<JsonRpcResponse> {
    return this.request({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name,
        arguments: args,
      },
    });
  }
}

// Default export for convenience
export default SuperlinesMCPClient;

