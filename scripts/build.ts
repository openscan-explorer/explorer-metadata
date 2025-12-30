import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");

interface BuildManifest {
	version: string;
	buildTime: string;
	counts: {
		tokens: number;
		networks: number;
		apps: number;
		organizations: number;
		supporters: number;
		donations: number;
		events: number;
		addresses: number;
	};
}

function ensureDir(dir: string): void {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

function formatJson(data: unknown): string {
	return `${JSON.stringify(data, null, "\t")}\n`;
}

function copyDirectory(src: string, dest: string): void {
	if (!fs.existsSync(src)) return;

	ensureDir(dest);
	const entries = fs.readdirSync(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			copyDirectory(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

function loadJsonFilesFromDir(dir: string): Record<string, unknown>[] {
	const items: Record<string, unknown>[] = [];

	if (!fs.existsSync(dir)) return items;

	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			// Recurse into subdirectories
			items.push(...loadJsonFilesFromDir(fullPath));
		} else if (entry.name.endsWith(".json")) {
			try {
				const content = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
				items.push(content);
			} catch (e) {
				console.warn(`Warning: Failed to parse ${fullPath}: ${e}`);
			}
		}
	}

	return items;
}

function buildAddresses(): number {
	const addressesDir = path.join(ROOT_DIR, "data/addresses");
	const distAddressesDir = path.join(DIST_DIR, "addresses");
	ensureDir(distAddressesDir);

	let totalAddresses = 0;

	if (!fs.existsSync(addressesDir)) return totalAddresses;

	const chainDirs = fs.readdirSync(addressesDir, { withFileTypes: true });

	for (const chainDir of chainDirs) {
		if (!chainDir.isDirectory()) continue;

		const chainId = Number.parseInt(chainDir.name, 10);
		if (Number.isNaN(chainId)) continue;

		const chainPath = path.join(addressesDir, chainDir.name);
		const chainDistDir = path.join(distAddressesDir, chainDir.name);
		ensureDir(chainDistDir);

		// Copy individual address files from data to dist
		const addressFiles = fs.readdirSync(chainPath, { withFileTypes: true });
		const basicAddresses: {
			address: string;
			label: string;
			supporter?: string;
		}[] = [];

		for (const addressFile of addressFiles) {
			if (!addressFile.isFile() || !addressFile.name.endsWith(".json"))
				continue;

			const srcPath = path.join(chainPath, addressFile.name);
			const destPath = path.join(chainDistDir, addressFile.name.toLowerCase());

			// Copy the file as-is
			fs.copyFileSync(srcPath, destPath);

			// Parse for basic info
			try {
				const addr = JSON.parse(fs.readFileSync(srcPath, "utf-8"));
				basicAddresses.push({
					address: (addr.address as string).toLowerCase(),
					label: addr.label as string,
					...(addr.supporter && { supporter: addr.supporter as string }),
				});
			} catch (e) {
				console.warn(`Warning: Failed to parse ${srcPath}: ${e}`);
			}
		}

		if (basicAddresses.length === 0) continue;

		// Sort by label
		basicAddresses.sort((a, b) => a.label.localeCompare(b.label));

		// Write all.json with basic address info
		const allOutput = {
			chainId,
			updatedAt: new Date().toISOString(),
			count: basicAddresses.length,
			addresses: basicAddresses,
		};

		fs.writeFileSync(
			path.join(chainDistDir, "all.json"),
			formatJson(allOutput),
		);

		totalAddresses += basicAddresses.length;
		console.log(
			`  Built addresses/${chainId}/ (${basicAddresses.length} addresses)`,
		);
	}

	return totalAddresses;
}

function buildEvents(): number {
	const eventsDir = path.join(ROOT_DIR, "data/events");
	const distEventsDir = path.join(DIST_DIR, "events");
	ensureDir(distEventsDir);

	let totalEvents = 0;

	if (!fs.existsSync(eventsDir)) return totalEvents;

	const chainDirs = fs.readdirSync(eventsDir, { withFileTypes: true });

	for (const chainDir of chainDirs) {
		if (!chainDir.isDirectory()) continue;

		const chainId = Number.parseInt(chainDir.name, 10);
		if (Number.isNaN(chainId)) continue;

		const chainPath = path.join(eventsDir, chainDir.name);
		const chainDistDir = path.join(distEventsDir, chainDir.name);
		ensureDir(chainDistDir);

		const eventFiles = fs.readdirSync(chainPath, { withFileTypes: true });

		let commonCount = 0;
		let addressCount = 0;

		// Copy all event files from data to dist
		for (const eventFile of eventFiles) {
			if (!eventFile.isFile() || !eventFile.name.endsWith(".json")) continue;

			const srcPath = path.join(chainPath, eventFile.name);
			const destPath = path.join(chainDistDir, eventFile.name.toLowerCase());

			// Copy the file as-is
			fs.copyFileSync(srcPath, destPath);

			// Count events
			try {
				const events = JSON.parse(fs.readFileSync(srcPath, "utf-8"));
				const count = Object.keys(events).length;
				if (eventFile.name === "common.json") {
					commonCount = count;
				} else {
					addressCount += count;
				}
			} catch (e) {
				console.warn(`Warning: Failed to parse ${srcPath}: ${e}`);
			}
		}

		const eventCount = commonCount + addressCount;
		if (eventCount === 0) continue;

		totalEvents += eventCount;
		console.log(
			`  Built events/${chainId}/ (${commonCount} common, ${addressCount} address-specific)`,
		);
	}

	return totalEvents;
}

function buildTokens(): number {
	const tokensDir = path.join(ROOT_DIR, "data/tokens");
	const distTokensDir = path.join(DIST_DIR, "tokens");
	ensureDir(distTokensDir);

	let totalTokens = 0;

	if (!fs.existsSync(tokensDir)) return totalTokens;

	const chainDirs = fs.readdirSync(tokensDir, { withFileTypes: true });

	for (const chainDir of chainDirs) {
		if (!chainDir.isDirectory()) continue;

		const chainId = Number.parseInt(chainDir.name, 10);
		if (Number.isNaN(chainId)) continue;

		const chainPath = path.join(tokensDir, chainDir.name);
		const chainDistDir = path.join(distTokensDir, chainDir.name);
		ensureDir(chainDistDir);

		// Copy individual token files from data to dist
		const tokenFiles = fs.readdirSync(chainPath, { withFileTypes: true });
		const basicTokens: {
			address: string;
			name: string;
			symbol: string;
			decimals: number;
			type?: string;
		}[] = [];

		for (const tokenFile of tokenFiles) {
			if (!tokenFile.isFile() || !tokenFile.name.endsWith(".json")) continue;

			const srcPath = path.join(chainPath, tokenFile.name);
			const destPath = path.join(chainDistDir, tokenFile.name.toLowerCase());

			// Copy the file as-is
			fs.copyFileSync(srcPath, destPath);

			// Parse for basic info
			try {
				const token = JSON.parse(fs.readFileSync(srcPath, "utf-8"));
				basicTokens.push({
					address: (token.address as string).toLowerCase(),
					name: token.name as string,
					symbol: token.symbol as string,
					decimals: token.decimals as number,
					...(token.type && { type: token.type as string }),
				});
			} catch (e) {
				console.warn(`Warning: Failed to parse ${srcPath}: ${e}`);
			}
		}

		if (basicTokens.length === 0) continue;

		// Sort by name
		basicTokens.sort((a, b) => a.name.localeCompare(b.name));

		// Write all.json with basic token info
		const allOutput = {
			chainId,
			updatedAt: new Date().toISOString(),
			count: basicTokens.length,
			tokens: basicTokens,
		};

		fs.writeFileSync(
			path.join(chainDistDir, "all.json"),
			formatJson(allOutput),
		);

		totalTokens += basicTokens.length;
		console.log(`  Built tokens/${chainId}/ (${basicTokens.length} tokens)`);
	}

	return totalTokens;
}

function buildNetworks(): number {
	const networksFile = path.join(ROOT_DIR, "data/networks.json");

	if (!fs.existsSync(networksFile)) return 0;

	const content = JSON.parse(fs.readFileSync(networksFile, "utf-8"));
	const networks = content.networks || [];

	const output = {
		updatedAt: new Date().toISOString(),
		count: networks.length,
		networks,
	};

	fs.writeFileSync(path.join(DIST_DIR, "networks.json"), formatJson(output));

	console.log(`  Built networks.json (${networks.length} networks)`);
	return networks.length;
}

function buildApps(): number {
	const appsDir = path.join(ROOT_DIR, "data/apps");
	const apps = loadJsonFilesFromDir(appsDir);

	// Sort by name
	apps.sort((a, b) => {
		const nameA = (a.name as string) || "";
		const nameB = (b.name as string) || "";
		return nameA.localeCompare(nameB);
	});

	const output = {
		updatedAt: new Date().toISOString(),
		count: apps.length,
		apps,
	};

	fs.writeFileSync(path.join(DIST_DIR, "apps.json"), formatJson(output));

	console.log(`  Built apps.json (${apps.length} apps)`);
	return apps.length;
}

function buildOrganizations(): number {
	const orgsDir = path.join(ROOT_DIR, "data/orgs");
	const organizations = loadJsonFilesFromDir(orgsDir);

	// Sort by name
	organizations.sort((a, b) => {
		const nameA = (a.name as string) || "";
		const nameB = (b.name as string) || "";
		return nameA.localeCompare(nameB);
	});

	const output = {
		updatedAt: new Date().toISOString(),
		count: organizations.length,
		organizations,
	};

	fs.writeFileSync(
		path.join(DIST_DIR, "organizations.json"),
		formatJson(output),
	);

	console.log(
		`  Built organizations.json (${organizations.length} organizations)`,
	);
	return organizations.length;
}

interface Subscription {
	tier: number;
	expiresAt: string;
}

interface Supporter {
	id: string;
	type: "token" | "network" | "app" | "organization";
	chainId?: number;
	name: string;
	startedAt: string;
	currentTier: number;
	expiresAt: string;
}

function buildSupporters(): number {
	const supporters: Supporter[] = [];

	// Scan tokens for subscriptions
	const tokensDir = path.join(ROOT_DIR, "data/tokens");
	if (fs.existsSync(tokensDir)) {
		const tokens = loadJsonFilesFromDir(tokensDir);
		for (const token of tokens) {
			if (token.subscription) {
				const sub = token.subscription as Subscription;
				supporters.push({
					id: token.address as string,
					type: "token",
					chainId: token.chainId as number,
					name: `${token.name} (${token.symbol})`,
					startedAt: sub.expiresAt, // We don't have startedAt, use expiresAt as placeholder
					currentTier: sub.tier,
					expiresAt: sub.expiresAt,
				});
			}
		}
	}

	// Scan networks for subscriptions
	const networksFile = path.join(ROOT_DIR, "data/networks.json");
	if (fs.existsSync(networksFile)) {
		const content = JSON.parse(fs.readFileSync(networksFile, "utf-8"));
		const networks = content.networks || [];
		for (const network of networks) {
			if (network.subscription) {
				const sub = network.subscription as Subscription;
				supporters.push({
					id: String(network.chainId),
					type: "network",
					chainId: network.chainId,
					name: network.name,
					startedAt: sub.expiresAt,
					currentTier: sub.tier,
					expiresAt: sub.expiresAt,
				});
			}
		}
	}

	// Scan apps for subscriptions
	const appsDir = path.join(ROOT_DIR, "data/apps");
	if (fs.existsSync(appsDir)) {
		const apps = loadJsonFilesFromDir(appsDir);
		for (const app of apps) {
			if (app.subscription) {
				const sub = app.subscription as Subscription;
				supporters.push({
					id: app.id as string,
					type: "app",
					name: app.name as string,
					startedAt: sub.expiresAt,
					currentTier: sub.tier,
					expiresAt: sub.expiresAt,
				});
			}
		}
	}

	// Scan organizations for subscriptions
	const orgsDir = path.join(ROOT_DIR, "data/orgs");
	if (fs.existsSync(orgsDir)) {
		const orgs = loadJsonFilesFromDir(orgsDir);
		for (const org of orgs) {
			if (org.subscription) {
				const sub = org.subscription as Subscription;
				supporters.push({
					id: org.id as string,
					type: "organization",
					name: org.name as string,
					startedAt: sub.expiresAt,
					currentTier: sub.tier,
					expiresAt: sub.expiresAt,
				});
			}
		}
	}

	// Sort by name
	supporters.sort((a, b) => a.name.localeCompare(b.name));

	const output = {
		updatedAt: new Date().toISOString(),
		count: supporters.length,
		supporters,
	};

	fs.writeFileSync(path.join(DIST_DIR, "supporters.json"), formatJson(output));

	console.log(`  Built supporters.json (${supporters.length} supporters)`);
	return supporters.length;
}

function copyProfiles(): void {
	const profilesDir = path.join(ROOT_DIR, "profiles");
	const distProfilesDir = path.join(DIST_DIR, "profiles");

	copyDirectory(profilesDir, distProfilesDir);
	console.log("  Copied profiles/");
}

function copyAssetsWithNormalization(
	src: string,
	dest: string,
	normalizeFilenames = false,
): void {
	if (!fs.existsSync(src)) return;

	ensureDir(dest);
	const entries = fs.readdirSync(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		// Normalize filenames to lowercase if flag is set (for token addresses)
		const destName = normalizeFilenames ? entry.name.toLowerCase() : entry.name;
		const destPath = path.join(dest, destName);

		if (entry.isDirectory()) {
			// For tokens directory, normalize filenames in subdirectories (the address files)
			const shouldNormalize = normalizeFilenames || src.includes("/tokens");
			copyAssetsWithNormalization(srcPath, destPath, shouldNormalize);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

function copyAssets(): void {
	const assetsDir = path.join(ROOT_DIR, "assets");
	const distAssetsDir = path.join(DIST_DIR, "assets");

	copyAssetsWithNormalization(assetsDir, distAssetsDir);
	console.log("  Copied assets/");
}

// Main build
console.log("Building metadata distribution...\n");

// Clean dist
if (fs.existsSync(DIST_DIR)) {
	fs.rmSync(DIST_DIR, { recursive: true });
}
ensureDir(DIST_DIR);

console.log("Building JSON aggregates:");
const addressCount = buildAddresses();
const eventCount = buildEvents();
const tokenCount = buildTokens();
const networkCount = buildNetworks();
const appCount = buildApps();
const orgCount = buildOrganizations();
const supporterCount = buildSupporters();

// Copy donations
let donationCount = 0;

const donationsFile = path.join(ROOT_DIR, "data/donations.json");
if (fs.existsSync(donationsFile)) {
	const content = JSON.parse(fs.readFileSync(donationsFile, "utf-8"));
	donationCount = content.donations?.length || 0;
	fs.writeFileSync(path.join(DIST_DIR, "donations.json"), formatJson(content));
	console.log(`  Built donations.json (${donationCount} donations)`);
}

console.log("\nCopying static files:");
copyProfiles();
copyAssets();

// Build manifest
const manifest: BuildManifest = {
	version: JSON.parse(
		fs.readFileSync(path.join(ROOT_DIR, "package.json"), "utf-8"),
	).version,
	buildTime: new Date().toISOString(),
	counts: {
		tokens: tokenCount,
		networks: networkCount,
		apps: appCount,
		organizations: orgCount,
		supporters: supporterCount,
		donations: donationCount,
		events: eventCount,
		addresses: addressCount,
	},
};

fs.writeFileSync(path.join(DIST_DIR, "manifest.json"), formatJson(manifest));

console.log("\nBuild complete!");
console.log(`  Addresses: ${addressCount}`);
console.log(`  Events: ${eventCount}`);
console.log(`  Tokens: ${tokenCount}`);
console.log(`  Networks: ${networkCount}`);
console.log(`  Apps: ${appCount}`);
console.log(`  Organizations: ${orgCount}`);
console.log(`  Supporters: ${supporterCount}`);
console.log(`  Donations: ${donationCount}`);
