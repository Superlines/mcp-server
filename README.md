# Superlines MCP Server

<p align="center">
  <img src="https://superlines.io/logos/superlines_logo.svg" alt="Superlines" width="200" />
</p>

<p align="center">
  <strong>Model Context Protocol (MCP) server for Superlines AI visibility analytics.</strong>
</p>

<p align="center">
  Connect Claude Desktop, Cursor, or any MCP-compatible client to your Superlines data.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@superlines/mcp-server"><img src="https://img.shields.io/npm/v/@superlines/mcp-server.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@superlines/mcp-server"><img src="https://img.shields.io/npm/dm/@superlines/mcp-server.svg" alt="npm downloads"></a>
  <a href="https://github.com/Superlines/mcp-server/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@superlines/mcp-server.svg" alt="license"></a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#available-tools">Available Tools</a> •
  <a href="#troubleshooting">Troubleshooting</a>
</p>

---

## What is this?

Superlines tracks how your brand appears in AI-powered search engines like ChatGPT, Perplexity, Gemini, and Claude. This MCP server lets you query your Superlines analytics data directly from AI assistants.

**Ask questions like:**
- "What's my brand visibility this month vs last month?"
- "Which domains are getting cited most in AI responses?"
- "Show me my top competitors by share of voice"
- "Audit my website for LLM-friendliness"

## Features

- 📊 **Brand Analytics** — Visibility metrics, citations, share of voice
- 🏆 **Competitor Analysis** — Benchmark against competitors with sentiment analysis
- 🔗 **Citation Tracking** — See which URLs are cited in AI responses
- 📈 **Trend Analysis** — Weekly and monthly performance trends
- 🔍 **Webpage Auditing** — LLM-friendliness analysis for any URL
- 🛠️ **Schema Optimization** — Generate optimized Schema.org markup

## Prerequisites

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **Superlines account** with **Enterprise plan** (MCP access is Enterprise-only)
- **API Key** from your [Superlines dashboard](https://analytics.superlines.io/settings/api-keys)

---

## Quick Start

### Step 1: Get Your API Key

1. Log in to [analytics.superlines.io](https://analytics.superlines.io)
2. Go to **Organization Settings** → **API Keys**
3. Click **"Create New API Key"**
4. Copy the key (starts with `sl_live_`) — it's only shown once!

### Step 2: Create the MCP Proxy Script

Create a directory and download the proxy script:

**macOS / Linux:**
```bash
mkdir -p ~/superlines-mcp
curl -o ~/superlines-mcp/mcp-proxy.js https://raw.githubusercontent.com/Superlines/mcp-server/main/mcp-proxy.js
chmod +x ~/superlines-mcp/mcp-proxy.js
```

**Windows (PowerShell):**
```powershell
mkdir $env:USERPROFILE\superlines-mcp
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/Superlines/mcp-server/main/mcp-proxy.js" -OutFile "$env:USERPROFILE\superlines-mcp\mcp-proxy.js"
```

Or manually create the file — see [mcp-proxy.js](#mcp-proxyjs-source) below.

### Step 3: Configure Claude Desktop

Edit your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

**macOS Configuration:**
```json
{
  "mcpServers": {
    "superlines": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/superlines-mcp/mcp-proxy.js"],
      "env": {
        "SUPERLINES_API_KEY": "sl_live_YOUR_API_KEY"
      }
    }
  }
}
```

**Windows Configuration:**
```json
{
  "mcpServers": {
    "superlines": {
      "command": "node",
      "args": ["C:\\Users\\YOUR_USERNAME\\superlines-mcp\\mcp-proxy.js"],
      "env": {
        "SUPERLINES_API_KEY": "sl_live_YOUR_API_KEY"
      }
    }
  }
}
```

> **Important:** Replace `YOUR_USERNAME` with your actual username and `sl_live_YOUR_API_KEY` with your actual API key.

**Find your username:**
- **macOS:** Run `echo $USER` in Terminal
- **Windows:** Run `echo %USERNAME%` in Command Prompt

### Step 4: Restart Claude Desktop

1. **Quit completely:** ⌘+Q on Mac, or right-click taskbar icon → Exit on Windows
2. **Reopen** Claude Desktop
3. **Verify:** Look for the hammer icon (🔨) indicating MCP tools are available

### Step 5: Start Asking Questions!

```
What brands do I have access to in Superlines?
```

```
Show me my brand visibility for the last 30 days
```

```
Audit https://example.com for LLM-friendliness
```

---

## mcp-proxy.js Source

If you prefer to create the file manually, save this as `mcp-proxy.js`:

```javascript
#!/usr/bin/env node

const https = require('https');
const readline = require('readline');

// Configuration
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://europe-west1-superlines-platform-prod.cloudfunctions.net/mcp';
const API_KEY = process.env.SUPERLINES_API_KEY;

if (!API_KEY) {
  console.error(JSON.stringify({
    jsonrpc: '2.0',
    error: { code: -32600, message: 'SUPERLINES_API_KEY environment variable not set' },
    id: null
  }));
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  try {
    const message = JSON.parse(line);
    const isNotification = !('id' in message) || message.id === undefined;
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
      timeout: 90000
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        if (isNotification) return;
        try {
          const parsed = JSON.parse(responseData);
          if (!parsed.jsonrpc) parsed.jsonrpc = '2.0';
          if (parsed.error && !parsed.id && message.id) parsed.id = message.id;
          console.log(JSON.stringify(parsed));
        } catch (error) {
          console.log(JSON.stringify({
            jsonrpc: '2.0',
            id: message.id || null,
            error: { code: -32603, message: 'Failed to parse server response' }
          }));
        }
      });
    });

    req.on('error', (error) => {
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: message.id,
        error: { code: -32603, message: `Connection error: ${error.message}` }
      }));
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: message.id,
        error: { code: -32603, message: 'Request timeout - please retry' }
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

process.on('uncaughtException', (error) => {
  console.log(JSON.stringify({
    jsonrpc: '2.0',
    error: { code: -32603, message: `Internal error: ${error.message}` },
    id: null
  }));
});
```

---

## Configuration for Other MCP Clients

### Cursor

Add to `.cursor/mcp.json` in your project or globally:

```json
{
  "mcpServers": {
    "superlines": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/superlines-mcp/mcp-proxy.js"],
      "env": {
        "SUPERLINES_API_KEY": "sl_live_YOUR_API_KEY"
      }
    }
  }
}
```

### VS Code with Continue

Add to your Continue configuration:

```json
{
  "mcpServers": [
    {
      "name": "superlines",
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/superlines-mcp/mcp-proxy.js"],
      "env": {
        "SUPERLINES_API_KEY": "sl_live_YOUR_API_KEY"
      }
    }
  ]
}
```

---

## Available Tools

### Brand Analytics

| Tool | Description |
|------|-------------|
| `list_brands` | List all brands you have access to |
| `get_brand_details` | Get brand configuration, competitors, and industry |
| `analyze_metrics` | Brand visibility, citation rate, mentions, share of voice |
| `get_weekly_performance` | Weekly performance trends |
| `get_period_comparison` | Compare current vs previous period |
| `get_analytics_summary` | High-level analytics overview |

### Citations

| Tool | Description |
|------|-------------|
| `get_citation_data` | Domain and URL citation analysis |
| `get_top_cited_url_per_prompt` | Top cited URLs per query |

### Competitor Analysis

| Tool | Description |
|------|-------------|
| `analyze_brand_mentions` | Competitor mentions with sentiment scores |
| `get_competitive_gap` | Find competitive opportunities |
| `get_competitor_insights` | Comprehensive competitor overview |
| `get_best_performing_prompt` | Best performing prompts |

### Content Strategy

| Tool | Description |
|------|-------------|
| `get_query_data` | Query analysis with search volumes |
| `find_content_opportunities` | Topics with improvement potential |
| `get_fanout_query_insights` | LLM source query analysis |
| `analyze_sentiment` | Sentiment analysis of AI responses |

### Webpage Analysis

| Tool | Description |
|------|-------------|
| `webpage_crawl` | Fetch and parse webpage content |
| `webpage_audit` | Full LLM-friendliness audit |
| `webpage_analyze_technical` | Technical SEO analysis |
| `webpage_analyze_content` | Content quality analysis |
| `schema_optimizer` | Optimize Schema.org markup |
| `analyze_competitor_url` | Deep-dive analysis of competitor URLs |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPERLINES_API_KEY` | Yes | Your Superlines API key (starts with `sl_live_`) |
| `MCP_SERVER_URL` | No | Override the default server URL |
| `DEBUG` | No | Set to `true` for debug logging |

---

## Example Queries

### Performance Analysis
```
Show me brand visibility and citations for the last 30 days, grouped by LLM service
```

### Competitor Intelligence
```
Who are my top 10 competitors by mentions? Show sentiment breakdown.
```

### Citation Analysis
```
Which domains are cited most in AI responses about my industry?
```

### Weekly Trends
```
Show me weekly performance for the last 8 weeks
```

### Webpage Audit
```
Audit https://competitor.com for LLM-friendliness and show me what schemas they use
```

### Content Opportunities
```
What content should I create to improve my AI search visibility?
```

---

## Troubleshooting

### "SUPERLINES_API_KEY environment variable not set"

Make sure your config includes the `env` section with your API key:

```json
{
  "mcpServers": {
    "superlines": {
      "command": "node",
      "args": ["/path/to/mcp-proxy.js"],
      "env": {
        "SUPERLINES_API_KEY": "sl_live_YOUR_API_KEY"
      }
    }
  }
}
```

### "401 Unauthorized"

- Your API key is invalid or expired
- Generate a new key at [Organization Settings → API Keys](https://analytics.superlines.io/settings/api-keys)

### "403 Forbidden"

- API access requires an Enterprise plan
- Contact [support@superlines.io](mailto:support@superlines.io) to upgrade

### Claude says "I don't have access to any tools"

1. **Restart Claude Desktop completely** (⌘+Q on Mac, not just close window)
2. **Check the script path** — use the full absolute path, not `~`
3. **Validate your config** is valid JSON:
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python3 -m json.tool
   ```
4. **Test the proxy manually:**
   ```bash
   export SUPERLINES_API_KEY="sl_live_your_key"
   echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node ~/superlines-mcp/mcp-proxy.js
   ```
   You should see a JSON response listing available tools.

### Script not found

- Use the **full absolute path** in your config
- ✅ Good: `/Users/john/superlines-mcp/mcp-proxy.js`
- ❌ Bad: `~/superlines-mcp/mcp-proxy.js`
- **Windows:** Use double backslashes: `C:\\Users\\john\\...`

---

## Security

- 🔒 Never share your API key publicly
- 🔒 Don't commit `claude_desktop_config.json` to version control
- 🔒 Rotate keys regularly in Organization Settings
- 🔒 Revoke keys immediately if compromised

Secure your config file:
```bash
chmod 600 ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

---

## Beta Notice

⚠️ The Superlines MCP server is currently in beta and may experience instability or contain bugs. Please report issues at [github.com/Superlines/mcp-server/issues](https://github.com/Superlines/mcp-server/issues).

---

## Resources

- [Superlines Dashboard](https://analytics.superlines.io)
- [API Documentation](https://superlines.io/docs/api)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [Claude Desktop](https://claude.ai/download)

## Support

- **Email:** [support@superlines.io](mailto:support@superlines.io)
- **Issues:** [github.com/Superlines/mcp-server/issues](https://github.com/Superlines/mcp-server/issues)

---

## License

MIT © [Superlines](https://superlines.io)
