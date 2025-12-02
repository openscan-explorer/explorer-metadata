---
name: Add Token
about: Submit a new token to OpenScan metadata
---

## Token Information

- **Chain ID**:
- **Contract Address**:
- **Token Name**:
- **Symbol**:
- **Decimals**:

## Listing Type

- [ ] **Free Listing** (basic info only, verified contract required)
- [ ] **Paid Subscription** (logo, links, project info, and more)

<!-- If Free Listing, skip to Checklist section -->

## Project Information (Paid only)

- **Project Name**:
- **Website**:
- **Twitter**:
- **GitHub**:

## Subscription Tier (Paid only)

- [ ] Backer (Tier 1 - $500/month)
- [ ] Partner (Tier 2 - $1,500/month)
- [ ] Ally (Tier 3 - $3,000/month)

## Payment Details (Paid only)

- **ETH Address** (subscriber wallet):
- **Transaction Hash**:
- **Chain ID** (where payment was made):
- **Amount Paid**:
- **Subscription Period**: <!-- e.g., 2025-01-01 to 2026-01-01 -->
- **Payment Signature**: <!-- Sign the transaction hash with your ETH address -->

```
<paste signature here>
```

## Checklist

- [ ] Token contract address is checksummed (EIP-55)
- [ ] Token data JSON file added to `data/tokens/{chainId}/`
- [ ] Contract is verified on-chain (Etherscan/Blockscout) **← Required for all listings**
- [ ] Ran `npm run validate` locally with no errors

### Paid Subscription Only
- [ ] Logo added to `assets/tokens/{chainId}/` (128x128px PNG, max 50KB)
- [ ] Profile markdown added to `profiles/tokens/{chainId}/` (if Partner/Ally tier)

## Additional Context

<!-- Any additional information about the token or project -->
