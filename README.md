# OpenScan Metadata

Open, community-driven metadata repository for the OpenScan blockchain explorer.

This repository contains verified metadata for tokens, networks, apps, organizations, addresses, events, supporters, and donations displayed on OpenScan.

## Structure

```
explorer-metadata/
├── data/
│   ├── tokens/{chainId}/{address}.json    # Token metadata
│   ├── addresses/{chainId}/{address}.json # Verified addresses per chain
│   ├── events/{chainId}/common.json       # Common events (ERC20, etc.)
│   ├── events/{chainId}/{address}.json    # Address-specific events
│   ├── networks.json                      # All networks
│   ├── apps/{id}.json                     # App metadata
│   ├── orgs/{id}.json                     # Organization metadata
│   └── donations.json                     # Donations list
├── profiles/
│   ├── tokens/{chainId}/{address}.md      # Token profiles
│   ├── apps/{id}.md                       # App profiles
│   └── organizations/{id}.md              # Organization profiles
├── assets/
│   ├── tokens/{chainId}/{address}.png     # Token logos (128x128)
│   ├── networks/{chainId}.svg             # Network logos
│   ├── apps/{id}.svg                      # App logos
│   └── organizations/{id}.svg             # Organization logos
└── schemas/                               # JSON Schema definitions
```

## Adding Metadata

### Quick Start: Add a Token

```bash
npm install
npm run add-token
```

Follow the interactive prompts to add a new token.

### Manual Submission

1. Fork this repository
2. Add your data file to the appropriate `data/` folder
3. Add logo to `assets/` (see image requirements below)
4. (Optional) Add profile markdown to `profiles/`
5. Run `npm run validate` to check your submission
6. Submit a Pull Request using the appropriate template

## Data Schemas

### Token

Tokens support **ERC20**, **ERC721** (NFTs), and **ERC1155** (Multi-Token) standards. All token types support **free listings** and **paid subscriptions**.

#### Free Listing (verified contract required)

```json
{
  "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  "chainId": 1,
  "name": "USD Coin",
  "symbol": "USDC",
  "decimals": 6
}
```

#### NFT Collection (ERC721)

```json
{
  "address": "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
  "chainId": 1,
  "type": "ERC721",
  "name": "Bored Ape Yacht Club",
  "symbol": "BAYC",
  "decimals": 0,
  "totalSupply": 10000
}
```

#### Paid Subscription (additional features)

```json
{
  "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  "chainId": 1,
  "name": "USD Coin",
  "symbol": "USDC",
  "decimals": 6,
  "subscription": {
    "tier": 2,
    "expiresAt": "2026-01-01"
  },
  "verified": true,
  "logo": "assets/tokens/1/0x....png",
  "profile": "profiles/tokens/1/0x....md",
  "project": {
    "name": "Circle",
    "description": "USDC is a fully reserved stablecoin"
  },
  "links": [
    { "name": "Website", "url": "https://circle.com/usdc", "description": "Official website" },
    { "name": "Twitter", "url": "https://twitter.com/circle" }
  ],
  "networks": [
    { "chainId": 42161, "address": "0xaf88d065e77c8cc2239327c5edb3a432268e5831" },
    { "chainId": 10, "address": "0x0b2c639c533813f4aa9d7837caf62653d097ff85" }
  ],
  "tags": ["stablecoin", "defi"]
}
```

### Network

```json
{
  "chainId": 42161,
  "name": "Arbitrum One",
  "shortName": "Arbitrum",
  "description": "Ethereum Layer 2 scaling solution",
  "currency": "ETH",
  "color": "#28A0F0",
  "isTestnet": false,
  "subscription": {
    "tier": 2,
    "expiresAt": "2026-01-01"
  },
  "logo": "assets/networks/42161.svg",
  "profile": "profiles/networks/42161.md",
  "rpc": {
    "public": ["https://arb1.arbitrum.io/rpc"]
  },
  "links": [
    { "name": "Website", "url": "https://arbitrum.io", "description": "Official website" },
    { "name": "Bridge", "url": "https://bridge.arbitrum.io" },
    { "name": "Docs", "url": "https://docs.arbitrum.io" }
  ]
}
```

### App

```json
{
  "id": "uniswap",
  "name": "Uniswap",
  "type": "dapp",
  "description": "Decentralized trading protocol",
  "subscription": {
    "tier": 2,
    "expiresAt": "2026-01-01"
  },
  "verified": true,
  "logo": "assets/apps/uniswap.svg",
  "profile": "profiles/apps/uniswap.md",
  "contracts": [
    { "chainId": 1, "address": "0x...", "label": "SwapRouter02" }
  ],
  "networks": [1, 42161, 10, 137],
  "links": [
    { "name": "Website", "url": "https://uniswap.org" },
    { "name": "App", "url": "https://app.uniswap.org" },
    { "name": "Docs", "url": "https://docs.uniswap.org" }
  ],
  "tags": ["defi", "dex", "amm"]
}
```

### Organization

```json
{
  "id": "ethereum-foundation",
  "name": "Ethereum Foundation",
  "type": "foundation",
  "description": "Supporting Ethereum development",
  "subscription": {
    "tier": 3,
    "expiresAt": "2026-01-01"
  },
  "logo": "assets/organizations/ethereum-foundation.svg",
  "profile": "profiles/organizations/ethereum-foundation.md",
  "links": [
    { "name": "Website", "url": "https://ethereum.foundation" },
    { "name": "Blog", "url": "https://blog.ethereum.org" },
    { "name": "Twitter", "url": "https://twitter.com/ethereum" }
  ]
}
```

### Supporter

```json
{
  "id": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  "type": "token",
  "chainId": 1,
  "name": "USD Coin (USDC)",
  "startedAt": "2025-01-01",
  "currentTier": 2,
  "expiresAt": "2026-01-01",
  "history": [
    { "tier": 2, "from": "2025-01-01", "to": "2026-01-01" }
  ]
}
```

### Donation

```json
{
  "from": "vitalik.eth",
  "amount": "1 ETH",
  "transaction": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "chainId": 1,
  "message": "Keep building the open web!",
  "date": "2025-12-01"
}
```

### Event

Events are stored per chain with common events in `data/events/{chainId}/common.json` and address-specific events in `data/events/{chainId}/{address}.json`.

#### Common Events (common.json)

Standard events like ERC20 Transfer, Approval, etc:

```json
{
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef": {
    "event": "Transfer(address,address,uint256)",
    "description": "ERC20/ERC721 token transfer."
  },
  "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925": {
    "event": "Approval(address,address,uint256)",
    "description": "ERC20/ERC721 approval granted."
  }
}
```

#### Address-Specific Events ({address}.json)

Custom events for specific contracts (e.g., Uniswap V2 Router):

```json
{
  "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822": {
    "event": "Swap(address,uint256,uint256,uint256,uint256,address)",
    "description": "Token swap executed."
  },
  "0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f": {
    "event": "Mint(address,uint256,uint256)",
    "description": "Liquidity added to pool."
  }
}
```

### Address

Verified addresses for apps and organizations are stored per chain in `data/addresses/{chainId}/{address}.json`.

```json
{
  "address": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  "chainId": 1,
  "supporter": "uniswap",
  "label": "Router V2"
}
```

- `address`: Checksummed contract address
- `chainId`: Chain ID where this address is deployed
- `supporter`: ID of the app or organization
- `label`: Optional human-readable label for the address

## Subscription Tiers

Tiers are represented as integers:
- **1 = Backer**: Entry-level support (base price)
- **2 = Partner**: Enhanced benefits and visibility (3x Backer price)
- **3 = Ally**: Full partnership with direct team access (6x Backer price)

### Tokens

Verified contracts tags, metadata integration, logo display, official links, and token balance fetcher integration.

| Tier | Monthly Rate | Key Benefits |
|------|--------------|--------------|
| **Backer** (Tier 1) | $500 | Token page with ERC20 details, project name, custom URLs. Verified and tagged contracts. |
| **Partner** (Tier 2) | $1,500 (3x) | Token balance shown on main explorer. Simple profile page. |
| **Ally** (Tier 3) | $3,000 (6x) | Complete profile page with markdown description. Direct communication with technical team. |

### Networks

Full RPC methods support, dedicated technical maintenance, subdomain availability, and prominent branding.

| Tier | Monthly Rate | Key Benefits |
|------|--------------|--------------|
| **Backer** (Tier 1) | $2,000 | Complete profile page. Priority placement on home page. |
| **Partner** (Tier 2) | $6,000 (3x) | Dedicated subdomain network explorer. Multiple network listing. Direct communication with technical team. |
| **Ally** (Tier 3) | $12,000 (6x) | Roadmap voting power. Network-specific features in dedicated explorer. |

### Apps

Dedicated listing and verified branding for wallets, dApps, supplementary explorer tools, and exchanges.

| Tier | Monthly Rate | Key Benefits |
|------|--------------|--------------|
| **Backer** (Tier 1) | $1,000 | Simple profile page. Important contracts verified and tagged. Contract events listing. |
| **Partner** (Tier 2) | $3,000 (3x) | OpenScan subdomain. Complete profile. |
| **Ally** (Tier 3) | $6,000 (6x) | Roadmap voting power. Direct communication with technical team. |

### Organizations

Formal recognition and visibility for infrastructure providers, venture funds, and other supporting entities.

| Tier | Monthly Rate | Key Benefits |
|------|--------------|--------------|
| **Backer** (Tier 1) | $500 | Simple profile page. Important contracts verified and tagged. Contract events listing. |
| **Partner** (Tier 2) | $1,500 (3x) | Complete profile. OpenScan subdomain. |
| **Ally** (Tier 3) | $3,000 (6x) | Roadmap voting power. Direct communication with technical team. |

### Profile Limits

| Entity Type | Simple Profile | Complete Profile |
|-------------|----------------|------------------|
| **Tokens** | ≤1,000 characters (Tier 2) | Unlimited markdown (Tier 3) |
| **Networks** | Unlimited markdown (all tiers) | Unlimited markdown (all tiers) |
| **Apps** | ≤1,000 characters (Tier 1) | Unlimited markdown (Tier 2+) |
| **Organizations** | ≤1,000 characters (Tier 1) | Unlimited markdown (Tier 2+) |

## Donations

Individual donations are welcome! When you donate through the OpenScan payment contract, you can include a message that will be permanently recorded in this repository.

Donation records include:
- `from`: Your address or ENS name
- `amount`: Donation amount (e.g., "0.1 ETH")
- `transaction`: Transaction hash for verification
- `message`: Your optional message (max 500 characters)

## Image Requirements

| Type          | Format         | Size      | Max File Size |
|---------------|----------------|-----------|---------------|
| Tokens        | PNG            | 128x128px | 50KB          |
| Networks      | SVG (preferred)| 256x256px | 100KB         |
| Apps          | SVG (preferred)| 256x256px | 100KB         |
| Organizations | SVG (preferred)| 256x256px | 100KB         |

Run `npm run optimize-images` to automatically optimize images.

## Development

```bash
# Install dependencies
npm install

# Validate all metadata
npm run validate

# Optimize images
npm run optimize-images

# Build distribution
npm run build

# Add a token interactively
npm run add-token
```

## API

The built metadata is available in the `dist/` folder on the `main` branch.

### Distribution Structure

```
dist/
├── tokens/{chainId}/
│   ├── all.json                    # List of all tokens (basic info)
│   └── {address}.json              # Individual token details
├── addresses/{chainId}/
│   ├── all.json                    # List of all addresses (basic info)
│   └── {address}.json              # Individual address details
├── events/{chainId}/
│   ├── common.json                 # Common events (ERC20, etc.)
│   └── {address}.json              # Address-specific events
├── networks.json                   # All networks
├── apps.json                       # All apps
├── organizations.json              # All organizations
├── supporters.json                 # All supporters
├── donations.json                  # All donations
├── manifest.json                   # Build metadata
├── profiles/                       # Markdown profiles
└── assets/                         # Images and logos
```

### Endpoints

Base URL: `https://cdn.jsdelivr.net/npm/@openscan/metadata/dist`

You can also pin to a specific version: `https://cdn.jsdelivr.net/npm/@openscan/metadata@1.0.0/dist`

```bash
# Get all networks
curl https://cdn.jsdelivr.net/npm/@openscan/metadata/dist/networks.json

# Get all apps
curl https://cdn.jsdelivr.net/npm/@openscan/metadata/dist/apps.json

# Get supporters list
curl https://cdn.jsdelivr.net/npm/@openscan/metadata/dist/supporters.json

# Get donations list
curl https://cdn.jsdelivr.net/npm/@openscan/metadata/dist/donations.json

# Tokens - list all tokens on a network (basic info)
curl https://cdn.jsdelivr.net/npm/@openscan/metadata/dist/tokens/1/all.json

# Tokens - get specific token details
curl https://cdn.jsdelivr.net/npm/@openscan/metadata/dist/tokens/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.json

# Addresses - list all addresses on a network
curl https://cdn.jsdelivr.net/npm/@openscan/metadata/dist/addresses/1/all.json

# Addresses - get specific address details
curl https://cdn.jsdelivr.net/npm/@openscan/metadata/dist/addresses/1/0x7a250d5630b4cf539739df2c5dacb4c659f2488d.json

# Events - get common events for a network
curl https://cdn.jsdelivr.net/npm/@openscan/metadata/dist/events/1/common.json

# Events - get address-specific events
curl https://cdn.jsdelivr.net/npm/@openscan/metadata/dist/events/1/0x7a250d5630b4cf539739df2c5dacb4c659f2488d.json

# Get a token profile
curl https://cdn.jsdelivr.net/npm/@openscan/metadata/dist/profiles/tokens/1/0x....md

# Get a token logo
curl https://cdn.jsdelivr.net/npm/@openscan/metadata/dist/assets/tokens/1/0x....png
```

## License

MIT
