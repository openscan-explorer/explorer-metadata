import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const RPCS_DIR = path.join(ROOT_DIR, "data/rpcs");

// Chain IDs to import from chainlist
const SUPPORTED_CHAINS = [1, 10, 56, 97, 8453, 42161, 11155111];

interface ChainlistRpc {
  url: string;
  tracking?: string;
  isOpenSource?: boolean;
}

interface ChainlistNetwork {
  chainId: number;
  name: string;
  rpc: ChainlistRpc[];
}

interface RpcEndpoint {
  url: string;
  tracking: string;
  isOpenSource: boolean;
  provider: string;
  isPublic: boolean;
}

// Map known RPC providers by URL patterns
function getProvider(url: string): string | undefined {
  const patterns: Record<string, string> = {
    "llamarpc.com": "LlamaNodes",
    "1rpc.io": "1RPC",
    "publicnode.com": "PublicNode",
    "meowrpc.com": "MeowRPC",
    "drpc.org": "dRPC",
    "omniatech.io": "Omnia",
    "ankr.com": "Ankr",
    "flashbots.net": "Flashbots",
    "mevblocker.io": "MEV Blocker",
    "blockrazor.xyz": "BlockRazor",
    "pocket.network": "Pocket Network",
    "subquery.network": "SubQuery",
    "0xrpc.io": "0xRPC",
    "stakely.io": "Stakely",
    "alchemy.com": "Alchemy",
    "infura.io": "Infura",
    "quicknode.com": "QuickNode",
    "blastapi.io": "Blast",
    "nodies.app": "Nodies",
    "unifra.io": "Unifra",
    "blockpi.network": "BlockPI",
    "zan.top": "ZAN",
    "stackup.sh": "Stackup",
    "onfinality.io": "OnFinality",
    "therpc.io": "TheRPC",
    "notadegen.com": "NotADegen",
    "tenderly.co": "Tenderly",
    "stateless.solutions": "Stateless",
    "payload.de": "Payload",
    "merkle.io": "Merkle",
    "fastnode.io": "FastNode",
    "poolz.finance": "Poolz",
    "diamondswap.org": "DiamondSwap",
    "bnbchain.org": "BNB Chain",
    "optimism.io": "Optimism",
    "arbitrum.io": "Arbitrum",
    "base.org": "Base",
    "sepolia.org": "Sepolia",
    "terminet.io": "Terminet",
    "48.club": "48 Club",
  };

  for (const [pattern, provider] of Object.entries(patterns)) {
    if (url.includes(pattern)) {
      return provider;
    }
  }
  return undefined;
}

async function importFromChainlist(): Promise<void> {
  console.log("Fetching RPC data from chainlist.org...\n");

  const response = await fetch("https://chainlist.org/rpcs.json");
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  const networks: ChainlistNetwork[] = await response.json();

  if (!fs.existsSync(RPCS_DIR)) {
    fs.mkdirSync(RPCS_DIR, { recursive: true });
  }

  for (const chainId of SUPPORTED_CHAINS) {
    const network = networks.find((n) => n.chainId === chainId);

    if (!network) {
      console.log(`  Chain ${chainId}: Not found in chainlist`);
      continue;
    }

    // Filter to public HTTP/HTTPS endpoints only (skip WebSocket)
    const endpoints: RpcEndpoint[] = network.rpc
      .filter((rpc) => {
        const url = rpc.url;
        return (
          (url.startsWith("https://") || url.startsWith("http://")) &&
          !url.includes("${") // Exclude template URLs with API keys
        );
      })
      .map((rpc) => ({
        url: rpc.url,
        tracking: rpc.tracking || "unspecified",
        isOpenSource: rpc.isOpenSource ?? false,
        provider: getProvider(rpc.url) || "Unknown",
        isPublic: true,
      }));

    // Sort: prefer tracking "none" first, then by provider name
    endpoints.sort((a, b) => {
      const trackingOrder = { none: 0, limited: 1, unspecified: 2, yes: 3 };
      const aOrder = trackingOrder[a.tracking as keyof typeof trackingOrder] ?? 2;
      const bOrder = trackingOrder[b.tracking as keyof typeof trackingOrder] ?? 2;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (a.provider || "").localeCompare(b.provider || "");
    });

    const output = {
      chainId,
      updatedAt: new Date().toISOString().split("T")[0],
      endpoints,
    };

    const filePath = path.join(RPCS_DIR, `${chainId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2) + "\n");
    console.log(`  Chain ${chainId} (${network.name}): Imported ${endpoints.length} endpoints`);
  }

  console.log("\nImport complete!");
}

importFromChainlist().catch((e) => {
  console.error("Import failed:", e);
  process.exit(1);
});
