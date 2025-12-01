# OpenScan Metadata

Open, community-driven metadata repository for the OpenScan blockchain explorer.

This repository contains verified metadata for tokens, networks, apps, organizations, events, supporters, and donations displayed on OpenScan.

## Structure

```
explorer-metadata/
├── data/
│   ├── tokens/{chainId}/{address}.json    # Token metadata
│   ├── events/{chainId}.json              # Chain-specific events
│   ├── networks.json                      # All networks
│   ├── apps/{id}.json                     # App metadata
│   ├── organizations.json                 # All organizations
│   ├── supporters.json                    # Supporters list
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

Tokens support **free listings** and **paid subscriptions**:

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

Events are stored per chain in `data/events/{chainId}.json`. Each event is indexed by its topic0 (keccak256 hash of the event signature).

```json
{
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef": {
    "event": "Transfer(address,address,uint256)",
    "description": "ERC20/ERC721 token transfer."
  },
  "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925": {
    "event": "Approval(address,address,uint256)",
    "description": "ERC20/ERC721 approval granted."
  },
  "0x2f8788117e7af2f4c44cc979f409775888b8597f5b8bfeb3c5c50411c276d0b3": {
    "event": "RoleGranted(bytes32,address,address)",
    "description": "AccessControl role granted."
  }
}
```

## Subscription Tiers

Tiers are represented as integers:
- **1 = Backer**: Entry-level support (base price)
- **2 = Partner**: Enhanced benefits and visibility (3x Backer price)
- **3 = Ally**: Full partnership with DAO participation (6x Backer price)

### Tokens
- **Free**: Basic listing with address, name, symbol, decimals (verified contract required)
- **Backer** ($500/mo): + Logo, links, project info, tags
- **Partner** ($1,500/mo): + Balance shown in explorer, markdown profile, voting power
- **Ally** ($3,000/mo): + DAO token allocation, custom explorer subdomain

### Networks - Backer $2,000/month
- **Backer** ($2,000/mo): Profile page, priority home page placement
- **Partner** ($6,000/mo): + Dedicated subdomain explorer, voting power
- **Ally** ($12,000/mo): + DAO token allocation, network-specific features

### Apps - Backer $1,000/month
- **Backer** ($1,000/mo): Profile page, contract tagging
- **Partner** ($3,000/mo): + Direct tech support, voting power
- **Ally** ($6,000/mo): + DAO token allocation, plugin integration

### Organizations - Backer $500/month
- **Backer** ($500/mo): Profile page, contract tagging
- **Partner** ($1,500/mo): + Direct tech support, voting power
- **Ally** ($3,000/mo): + DAO token allocation

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

The built metadata is hosted at `https://metadata.openscan.io/`:

```bash
# Get all networks
curl https://metadata.openscan.io/networks.json

# Get tokens for Ethereum
curl https://metadata.openscan.io/tokens/1.json

# Get all apps
curl https://metadata.openscan.io/apps.json

# Get supporters list
curl https://metadata.openscan.io/supporters.json

# Get donations list
curl https://metadata.openscan.io/donations.json

# Get events for Ethereum
curl https://metadata.openscan.io/events/1.json

# Get a token profile
curl https://metadata.openscan.io/profiles/tokens/1/0x....md

# Get a token logo
curl https://metadata.openscan.io/assets/tokens/1/0x....png
```

## License

MIT
