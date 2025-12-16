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
  <a href="#configuration">Configuration</a> •
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

### 1. Get Your API Key

1. Log in to [analytics.superlines.io](https://analytics.superlines.io)
2. Go to **Organization Settings** → **API Keys**
3. Click **"Create New API Key"**
4. Copy the key (starts with `sl_live_`)

### 2. Configure Claude Desktop

Edit your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add this configuration:

```json
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
```

### 3. Restart Claude Desktop

Quit and reopen Claude Desktop. You should see a hammer icon (🔨) indicating tools are available.

### 4. Start Asking Questions!

```
What brands do I have access to?
```

```
Show me my brand visibility for the last 30 days
```

```
Audit https://example.com for LLM-friendliness
```

---

## Installation Options

### Option 1: npx (Recommended)

No installation required. Claude Desktop runs it automatically:

```json
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
```

### Option 2: Global Installation

```bash
npm install -g @superlines/mcp-server
```

Then configure Claude Desktop:

```json
{
  "mcpServers": {
    "superlines": {
      "command": "superlines-mcp",
      "env": {
        "SUPERLINES_API_KEY": "sl_live_YOUR_API_KEY"
      }
    }
  }
}
```

### Option 3: HTTP Server Mode

Run as a standalone HTTP server for testing or custom integrations:

```bash
SUPERLINES_API_KEY=sl_live_xxx npx @superlines/mcp-server http
```

The server runs on port 3000 by default. Use `PORT` environment variable to change.

---

## Configuration for Other MCP Clients

### Cursor

Add to your Cursor settings (`.cursor/mcp.json` in your project or globally):

```json
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
```

### VS Code with Continue

Add to your Continue configuration:

```json
{
  "mcpServers": [
    {
      "name": "superlines",
      "command": "npx",
      "args": ["-y", "@superlines/mcp-server"],
      "env": {
        "SUPERLINES_API_KEY": "sl_live_YOUR_API_KEY"
      }
    }
  ]
}
```

### Programmatic Usage

```typescript
import { SuperlinesMCPClient } from '@superlines/mcp-server';

const client = new SuperlinesMCPClient({
  apiKey: 'sl_live_YOUR_KEY'
});

// List available tools
const tools = await client.listTools();

// Call a specific tool
const result = await client.callTool('analyze_metrics', {
  metrics: ['brand_visibility', 'citations'],
  startDate: '2025-01-01',
  endDate: '2025-01-31'
});
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
| `DEBUG` | No | Set to `true` for debug logging to `/tmp/superlines-mcp-debug.log` |
| `PORT` | No | Port for HTTP server mode (default: 3000) |

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

Make sure your config includes the `env` section:

```json
{
  "mcpServers": {
    "superlines": {
      "command": "npx",
      "args": ["-y", "@superlines/mcp-server"],
      "env": {
        "SUPERLINES_API_KEY": "sl_live_YOUR_API_KEY"  // ← Don't forget this!
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

1. Restart Claude Desktop completely (⌘+Q on Mac, not just close window)
2. Check your config file is valid JSON: `cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python3 -m json.tool`
3. Enable debug mode and check logs:

```json
{
  "mcpServers": {
    "superlines": {
      "command": "npx",
      "args": ["-y", "@superlines/mcp-server"],
      "env": {
        "SUPERLINES_API_KEY": "sl_live_YOUR_KEY",
        "DEBUG": "true"
      }
    }
  }
}
```

Then check `/tmp/superlines-mcp-debug.log`

### Test the Server Manually

```bash
export SUPERLINES_API_KEY="sl_live_your_key"
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | npx @superlines/mcp-server
```

You should see a JSON response listing available tools.

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

