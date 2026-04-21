import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const RPCS_DIR = path.join(ROOT_DIR, "data/rpcs/evm");
const NETWORKS_FILE = path.join(ROOT_DIR, "data/networks.json");

interface NetworkEntry {
	chainId: number;
	type?: string;
	name: string;
}

function getSupportedChains(): number[] {
	const content = JSON.parse(fs.readFileSync(NETWORKS_FILE, "utf-8"));
	const networks: NetworkEntry[] = content.networks || [];

	// Filter to EVM networks (chainlist only has EVM RPCs)
	// Networks with a `type` field use it; otherwise assume EVM if chainId is present
	return networks
		.filter((n) => {
			if (n.type) return n.type === "evm";
			return typeof n.chainId === "number";
		})
		.map((n) => n.chainId);
}

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

const REQUEST_TIMEOUT_MS = 10_000;
const TOTAL_BUDGET_MS = 60_000;

async function measureLatency(url: string): Promise<number | null> {
	const deadline = Date.now() + TOTAL_BUDGET_MS;
	const body = JSON.stringify({
		jsonrpc: "2.0",
		id: 1,
		method: "eth_blockNumber",
		params: [],
	});

	while (Date.now() < deadline) {
		const remaining = deadline - Date.now();
		const timeout = Math.min(REQUEST_TIMEOUT_MS, remaining);
		if (timeout <= 0) break;

		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeout);
		const start = Date.now();

		try {
			const res = await fetch(url, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body,
				signal: controller.signal,
			});
			clearTimeout(timer);
			if (!res.ok) continue;
			const json = (await res.json()) as { result?: string; error?: unknown };
			if (json.error || typeof json.result !== "string") continue;
			return Date.now() - start;
		} catch {
			clearTimeout(timer);
		}
	}

	return null;
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
	const supportedChains = getSupportedChains();
	console.log(
		`Fetching RPC data from chainlist.org for ${supportedChains.length} chains...\n`,
	);

	const response = await fetch("https://chainlist.org/rpcs.json");
	if (!response.ok) {
		throw new Error(
			`Failed to fetch: ${response.status} ${response.statusText}`,
		);
	}

	const networks: ChainlistNetwork[] = await response.json();

	if (!fs.existsSync(RPCS_DIR)) {
		fs.mkdirSync(RPCS_DIR, { recursive: true });
	}

	for (const chainId of supportedChains) {
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

		// Deduplicate by URL
		const seen = new Set<string>();
		const uniqueEndpoints = endpoints.filter((ep) => {
			if (seen.has(ep.url)) return false;
			seen.add(ep.url);
			return true;
		});

		// Probe endpoints in parallel; drop any that don't respond within budget
		const latencies = await Promise.all(
			uniqueEndpoints.map((ep) => measureLatency(ep.url)),
		);
		const liveEndpoints = uniqueEndpoints.filter(
			(_, i) => latencies[i] !== null,
		);
		const dead = uniqueEndpoints.length - liveEndpoints.length;

		// Sort: prefer tracking "none" first, then by provider name
		liveEndpoints.sort((a, b) => {
			const trackingOrder = { none: 0, limited: 1, unspecified: 2, yes: 3 };
			const aOrder =
				trackingOrder[a.tracking as keyof typeof trackingOrder] ?? 2;
			const bOrder =
				trackingOrder[b.tracking as keyof typeof trackingOrder] ?? 2;
			if (aOrder !== bOrder) return aOrder - bOrder;
			return (a.provider || "").localeCompare(b.provider || "");
		});

		const networkId = `eip155:${chainId}`;
		const output = {
			networkId,
			updatedAt: new Date().toISOString(),
			endpoints: liveEndpoints,
		};

		const filePath = path.join(RPCS_DIR, `${chainId}.json`);
		fs.writeFileSync(filePath, `${JSON.stringify(output, null, 2)}\n`);
		const dupes = endpoints.length - uniqueEndpoints.length;
		const dupeNote = dupes > 0 ? ` (${dupes} duplicates removed)` : "";
		const deadNote = dead > 0 ? ` (${dead} unresponsive removed)` : "";
		console.log(
			`  Chain ${chainId} (${network.name}): Imported ${liveEndpoints.length} endpoints${dupeNote}${deadNote}`,
		);
	}

	console.log("\nImport complete!");
}

importFromChainlist().catch((e) => {
	console.error("Import failed:", e);
	process.exit(1);
});
