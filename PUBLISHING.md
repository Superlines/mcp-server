# Publishing Guide for @superlines/mcp-server

This guide covers how to publish the MCP server package to npm.

## Prerequisites

1. **npm account** with publishing access to `@superlines` organization
2. **npm login** configured: `npm login`
3. **Package built**: `pnpm build`

## Publishing Steps

### 1. Update Version

```bash
# For beta releases
npm version prerelease --preid=beta

# For patch releases
npm version patch

# For minor releases
npm version minor

# For major releases
npm version major
```

### 2. Build

```bash
pnpm build
```

### 3. Verify Package Contents

```bash
npm pack --dry-run
```

Expected files:
- `dist/cli.js` (main CLI)
- `dist/index.js` (library entry)
- `dist/*.d.ts` (TypeScript definitions)
- `README.md`
- `LICENSE`

### 4. Publish

```bash
# For beta releases
npm publish --access public --tag beta

# For stable releases
npm publish --access public
```

### 5. Verify

```bash
# Check npm
npm view @superlines/mcp-server

# Test installation
npx @superlines/mcp-server --version
```

## Setting Up @superlines Organization

If the `@superlines` organization doesn't exist on npm:

```bash
# Create organization (from npm website or CLI)
npm org create superlines

# Add team members
npm team add superlines:developers <username>
```

## GitHub Repository Setup

If publishing from GitHub:

1. Create repository: `github.com/superlines-io/mcp-server`
2. Add GitHub Actions for CI/CD (see `.github/workflows/publish.yml`)
3. Add npm token as GitHub secret: `NPM_TOKEN`

### Example GitHub Action

```yaml
# .github/workflows/publish.yml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install
      - run: pnpm build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Versioning Strategy

- **1.0.0-beta.X**: Beta releases for testing
- **1.0.0**: First stable release
- **1.X.0**: Minor releases (new features, backwards compatible)
- **X.0.0**: Major releases (breaking changes)

## Changelogs

Update `CHANGELOG.md` before each release:

```markdown
## [1.0.0-beta.2] - 2025-01-XX

### Added
- New feature X

### Fixed
- Bug fix Y

### Changed
- Breaking change Z
```

## Rollback

If a release has issues:

```bash
# Unpublish (within 72 hours of publishing)
npm unpublish @superlines/mcp-server@1.0.0-beta.1

# Or deprecate
npm deprecate @superlines/mcp-server@1.0.0-beta.1 "Critical bug, use 1.0.0-beta.2"
```

## Testing Before Publish

```bash
# Pack locally
npm pack

# Install from tarball
npm install ./superlines-mcp-server-1.0.0-beta.1.tgz

# Test
npx superlines-mcp --version
```

## Sync with Documentation

After publishing, update:
1. Main README in platform repo
2. Docs at superlines.io/docs/integrations/mcp
3. Claude Desktop setup guide

---

Last updated: December 2025

