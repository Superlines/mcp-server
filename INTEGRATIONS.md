# Superlines Integrations

Connect Superlines AI visibility analytics to your favorite tools.

---

## 🤖 Model Context Protocol (MCP)

The Model Context Protocol enables AI assistants like Claude and Cursor to directly access your Superlines data.

### Supported Clients

| Client | Status | Installation |
|--------|--------|--------------|
| [Claude Desktop](https://claude.ai/download) | ✅ Supported | [Setup Guide](#claude-desktop) |
| [Cursor](https://cursor.sh) | ✅ Supported | [Setup Guide](#cursor) |
| [Continue](https://continue.dev) | ✅ Supported | [Setup Guide](#continue) |
| [Zed](https://zed.dev) | 🔜 Coming Soon | - |

### Quick Install

```bash
npx @superlines/mcp-server --help
```

---

## Claude Desktop

### Step 1: Install

No installation needed! npx runs it automatically.

### Step 2: Configure

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

### Step 3: Restart Claude Desktop

Quit (⌘+Q) and reopen Claude Desktop.

### Step 4: Try It!

Ask Claude:
```
What's my brand visibility for the last 30 days?
```

---

## Cursor

### Step 1: Create Configuration

Add to `.cursor/mcp.json` in your project (or globally in `~/.cursor/mcp.json`):

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

### Step 2: Restart Cursor

Reload the window or restart Cursor.

### Step 3: Use in Chat

In Cursor's AI chat:
```
@superlines list my brands
```

---

## Continue

### Step 1: Configure

Add to your Continue configuration (`.continue/config.json`):

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

### Step 2: Restart VS Code

Reload the window.

---

## API Integration

### REST API

For programmatic access without MCP, use our REST API:

```bash
curl -X GET "https://api.superlines.io/v1/metrics" \
  -H "Authorization: Bearer sl_live_YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

**Documentation:** [superlines.io/docs/api](https://superlines.io/docs/api)

### JavaScript/TypeScript SDK

```typescript
import { SuperlinesMCPClient } from '@superlines/mcp-server';

const client = new SuperlinesMCPClient({
  apiKey: 'sl_live_YOUR_KEY'
});

const result = await client.callTool('analyze_metrics', {
  metrics: ['brand_visibility'],
  startDate: '2025-01-01'
});
```

---

## Available Data

Once connected, you can query:

### 📊 Brand Metrics
- Brand visibility percentage
- Citation rate
- Mention count
- Share of voice

### 🏆 Competitor Analysis
- Top mentioned brands
- Sentiment scores
- Competitive gaps

### 🔗 Citations
- Cited domains
- Cited URLs with titles
- Citation trends

### 📈 Trends
- Weekly performance
- Period comparisons
- LLM service breakdown

### 🔍 Webpage Analysis
- LLM-friendliness audits
- Technical SEO analysis
- Schema.org optimization

---

## Getting Your API Key

1. Log in to [analytics.superlines.io](https://analytics.superlines.io)
2. Go to **Organization Settings** → **API Keys**
3. Click **"Create New API Key"**
4. Copy the key (starts with `sl_live_`)

> 💡 **Tip:** For users with multiple organizations, create a **Personal API Key** in User Settings instead.

---

## Requirements

- **Plan:** Enterprise (MCP access is Enterprise-only)
- **Node.js:** 18+ required for npx
- **API Key:** Valid Superlines API key

---

## Support

- 📧 **Email:** [support@superlines.io](mailto:support@superlines.io)
- 📖 **Docs:** [superlines.io/docs](https://superlines.io/docs)
- 🐛 **Issues:** [github.com/Superlines/mcp-server/issues](https://github.com/Superlines/mcp-server/issues)

---

## Changelog

### v1.0.0-beta.1 (December 2025)
- Initial beta release
- Claude Desktop support
- Cursor support
- 20+ analytics tools
- Webpage analysis tools

---

Built with ❤️ by [Superlines](https://superlines.io)

