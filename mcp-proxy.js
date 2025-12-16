#!/usr/bin/env node

/**
 * Superlines MCP Proxy
 * 
 * A lightweight proxy script that connects Claude Desktop (or other MCP clients)
 * to the Superlines MCP server. This script handles the stdio transport and
 * forwards requests to the remote Superlines API.
 * 
 * Usage:
 *   1. Save this file locally (e.g., ~/superlines-mcp/mcp-proxy.js)
 *   2. Configure Claude Desktop to use it (see README.md)
 *   3. Set SUPERLINES_API_KEY environment variable
 * 
 * @see https://github.com/Superlines/mcp-server
 * @see https://superlines.io/integrations/mcp
 */

const https = require('https');
const readline = require('readline');

// Configuration
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://europe-west1-superlines-platform-prod.cloudfunctions.net/mcp';
const API_KEY = process.env.SUPERLINES_API_KEY;

// Validate API key
if (!API_KEY) {
  console.error(JSON.stringify({
    jsonrpc: '2.0',
    error: { 
      code: -32600, 
      message: 'SUPERLINES_API_KEY environment variable not set. Get your API key at https://analytics.superlines.io/settings/api-keys' 
    },
    id: null
  }));
  process.exit(1);
}

// Create readline interface for stdin/stdout
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Handle incoming JSON-RPC messages
rl.on('line', async (line) => {
  try {
    const message = JSON.parse(line);
    
    // Check if this is a notification (no id field)
    const isNotification = !('id' in message) || message.id === undefined;
    
    // Forward request to remote MCP server
    const data = JSON.stringify(message);
    
    const url = new URL(MCP_SERVER_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${API_KEY}`
      },
      timeout: 90000 // 90 seconds to handle cold starts
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        // For notifications, don't send a response
        if (isNotification) return;
        
        try {
          const parsed = JSON.parse(responseData);
          
          // Ensure required JSON-RPC fields
          if (!parsed.jsonrpc) parsed.jsonrpc = '2.0';
          if (parsed.error && !parsed.id && message.id) parsed.id = message.id;
          
          console.log(JSON.stringify(parsed));
        } catch (error) {
          console.log(JSON.stringify({
            jsonrpc: '2.0',
            id: message.id || null,
            error: { 
              code: -32603, 
              message: 'Failed to parse server response' 
            }
          }));
        }
      });
    });

    req.on('error', (error) => {
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: message.id,
        error: { 
          code: -32603, 
          message: `Connection error: ${error.message}` 
        }
      }));
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: message.id,
        error: { 
          code: -32603, 
          message: 'Request timeout - server may be experiencing cold start. Please retry.' 
        }
      }));
    });

    req.write(data);
    req.end();
    
  } catch (error) {
    console.log(JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32700, message: 'Parse error' },
      id: null
    }));
  }
});

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (error) => {
  console.log(JSON.stringify({
    jsonrpc: '2.0',
    error: { 
      code: -32603, 
      message: `Internal error: ${error.message}` 
    },
    id: null
  }));
});

// Handle stdin close
rl.on('close', () => {
  process.exit(0);
});

