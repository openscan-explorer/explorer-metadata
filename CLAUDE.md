# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenScan Metadata is a community-driven metadata repository for the OpenScan blockchain explorer. It contains verified metadata for tokens, networks, apps, organizations, addresses, events, supporters, and donations displayed on OpenScan.

## Repository Structure

```
explorer-metadata/
├── data/                    # JSON metadata files
│   ├── tokens/{chainId}/    # Token metadata per chain
│   ├── addresses/{chainId}/ # Verified addresses per chain
│   ├── events/{chainId}/    # Event signatures per chain
│   ├── networks.json        # All networks
│   ├── apps/{id}.json       # App metadata
│   ├── orgs/{id}.json       # Organization metadata
│   └── donations.json       # Donations list
├── profiles/                # Markdown profile pages
│   ├── tokens/{chainId}/    # Token profiles
│   ├── apps/                # App profiles
│   ├── networks/            # Network profiles
│   └── organizations/       # Organization profiles
├── assets/                  # Images and logos
│   ├── tokens/{chainId}/    # Token logos (128x128 PNG)
│   ├── networks/            # Network logos (SVG preferred)
│   ├── apps/                # App logos (SVG preferred)
│   └── organizations/       # Organization logos (SVG preferred)
├── schemas/                 # JSON Schema definitions
└── scripts/                 # Build and validation scripts
```

## Development Commands

```bash
# Install dependencies
npm install

# Validate all metadata against JSON schemas
npm run validate

# Build distribution files to dist/
npm run build

# Optimize images (resize, compress)
npm run optimize-images

# Add new entries interactively
npm run add-token
npm run add-app
npm run add-org

# Check formatting and linting
npm run lint

# Fix formatting issues
npm run format
```

## Code Style

- **Biome** for formatting and linting (config: `biome.json`)
- Scope: `data/**/*.json` files
- Use `npm run format` to auto-format before committing

## Coding Standards and Workflow

### Before Committing

ALWAYS run these commands before committing:

```bash
# 1. Validate metadata
npm run validate

# 2. Fix formatting
npm run format

# 3. Check linting
npm run lint
```

### Commits

- Follow the conventional commit standard v1.0.0
- Commit without Claude attribution

### Data Quality Requirements

- All JSON metadata must pass schema validation
- Token addresses must be checksummed (EIP-55)
- Images must meet size requirements (tokens: 128x128 PNG, others: 256x256 SVG preferred)
- Profile markdown files should follow established format

### When Adding New Metadata

1. Use interactive scripts for adding entries:
   - `npm run add-token` for tokens
   - `npm run add-app` for apps
   - `npm run add-org` for organizations
2. Or manually create files in appropriate `data/` directories
3. Add corresponding logo to `assets/`
4. Optionally add profile markdown to `profiles/`
5. Run `npm run validate` to verify
6. Run `npm run optimize-images` if adding images
