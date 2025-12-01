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

    const chainId = parseInt(chainDir.name, 10);
    if (isNaN(chainId)) continue;

    const chainPath = path.join(addressesDir, chainDir.name);
    const addresses = loadJsonFilesFromDir(chainPath);

    if (addresses.length === 0) continue;

    // Sort by label or address
    addresses.sort((a, b) => {
      const labelA = (a.label as string) || (a.address as string) || "";
      const labelB = (b.label as string) || (b.address as string) || "";
      return labelA.localeCompare(labelB);
    });

    const output = {
      chainId,
      updatedAt: new Date().toISOString(),
      count: addresses.length,
      addresses,
    };

    fs.writeFileSync(
      path.join(distAddressesDir, `${chainId}.json`),
      JSON.stringify(output, null, 2)
    );

    totalAddresses += addresses.length;
    console.log(`  Built addresses/${chainId}.json (${addresses.length} addresses)`);
  }

  return totalAddresses;
}

function buildEvents(): number {
  const eventsDir = path.join(ROOT_DIR, "data/events");
  const distEventsDir = path.join(DIST_DIR, "events");
  ensureDir(distEventsDir);

  let totalEvents = 0;

  if (!fs.existsSync(eventsDir)) return totalEvents;

  const eventFiles = fs.readdirSync(eventsDir, { withFileTypes: true });

  for (const eventFile of eventFiles) {
    if (!eventFile.isFile() || !eventFile.name.endsWith(".json")) continue;

    const chainId = parseInt(eventFile.name.replace(".json", ""), 10);
    if (isNaN(chainId)) continue;

    const filePath = path.join(eventsDir, eventFile.name);
    try {
      const events = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const eventCount = Object.keys(events).length;

      const output = {
        chainId,
        updatedAt: new Date().toISOString(),
        count: eventCount,
        events,
      };

      fs.writeFileSync(
        path.join(distEventsDir, `${chainId}.json`),
        JSON.stringify(output, null, 2)
      );

      totalEvents += eventCount;
      console.log(`  Built events/${chainId}.json (${eventCount} events)`);
    } catch (e) {
      console.warn(`Warning: Failed to parse ${filePath}: ${e}`);
    }
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

    const chainId = parseInt(chainDir.name, 10);
    if (isNaN(chainId)) continue;

    const chainPath = path.join(tokensDir, chainDir.name);
    const tokens = loadJsonFilesFromDir(chainPath);

    if (tokens.length === 0) continue;

    // Sort by name
    tokens.sort((a, b) => {
      const nameA = (a.name as string) || "";
      const nameB = (b.name as string) || "";
      return nameA.localeCompare(nameB);
    });

    const output = {
      chainId,
      updatedAt: new Date().toISOString(),
      count: tokens.length,
      tokens,
    };

    fs.writeFileSync(
      path.join(distTokensDir, `${chainId}.json`),
      JSON.stringify(output, null, 2)
    );

    totalTokens += tokens.length;
    console.log(`  Built tokens/${chainId}.json (${tokens.length} tokens)`);
  }

  return totalTokens;
}

function buildNetworks(): number {
  const networksFile = path.join(ROOT_DIR, "data/networks.json");

  if (!fs.existsSync(networksFile)) return 0;

  const content = JSON.parse(fs.readFileSync(networksFile, "utf-8"));
  const networks = content.networks || [];

  // Sort by chainId
  networks.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
    const chainA = (a.chainId as number) || 0;
    const chainB = (b.chainId as number) || 0;
    return chainA - chainB;
  });

  const output = {
    updatedAt: new Date().toISOString(),
    count: networks.length,
    networks,
  };

  fs.writeFileSync(
    path.join(DIST_DIR, "networks.json"),
    JSON.stringify(output, null, 2)
  );

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

  fs.writeFileSync(
    path.join(DIST_DIR, "apps.json"),
    JSON.stringify(output, null, 2)
  );

  console.log(`  Built apps.json (${apps.length} apps)`);
  return apps.length;
}

function buildOrganizations(): number {
  const orgsFile = path.join(ROOT_DIR, "data/organizations.json");

  if (!fs.existsSync(orgsFile)) return 0;

  const content = JSON.parse(fs.readFileSync(orgsFile, "utf-8"));
  const organizations = content.organizations || [];

  // Sort by name
  organizations.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
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
    JSON.stringify(output, null, 2)
  );

  console.log(`  Built organizations.json (${organizations.length} organizations)`);
  return organizations.length;
}

function copyProfiles(): void {
  const profilesDir = path.join(ROOT_DIR, "profiles");
  const distProfilesDir = path.join(DIST_DIR, "profiles");

  copyDirectory(profilesDir, distProfilesDir);
  console.log("  Copied profiles/");
}

function copyAssets(): void {
  const assetsDir = path.join(ROOT_DIR, "assets");
  const distAssetsDir = path.join(DIST_DIR, "assets");

  copyDirectory(assetsDir, distAssetsDir);
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

// Copy supporters and donations
let supporterCount = 0;
let donationCount = 0;

const supportersFile = path.join(ROOT_DIR, "data/supporters.json");
if (fs.existsSync(supportersFile)) {
  const content = JSON.parse(fs.readFileSync(supportersFile, "utf-8"));
  supporterCount = content.supporters?.length || 0;
  fs.writeFileSync(
    path.join(DIST_DIR, "supporters.json"),
    JSON.stringify(content, null, 2)
  );
  console.log(`  Built supporters.json (${supporterCount} supporters)`);
}

const donationsFile = path.join(ROOT_DIR, "data/donations.json");
if (fs.existsSync(donationsFile)) {
  const content = JSON.parse(fs.readFileSync(donationsFile, "utf-8"));
  donationCount = content.donations?.length || 0;
  fs.writeFileSync(
    path.join(DIST_DIR, "donations.json"),
    JSON.stringify(content, null, 2)
  );
  console.log(`  Built donations.json (${donationCount} donations)`);
}

console.log("\nCopying static files:");
copyProfiles();
copyAssets();

// Build manifest
const manifest: BuildManifest = {
  version: JSON.parse(
    fs.readFileSync(path.join(ROOT_DIR, "package.json"), "utf-8")
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

fs.writeFileSync(
  path.join(DIST_DIR, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);

console.log("\nBuild complete!");
console.log(`  Addresses: ${addressCount}`);
console.log(`  Events: ${eventCount}`);
console.log(`  Tokens: ${tokenCount}`);
console.log(`  Networks: ${networkCount}`);
console.log(`  Apps: ${appCount}`);
console.log(`  Organizations: ${orgCount}`);
console.log(`  Supporters: ${supporterCount}`);
console.log(`  Donations: ${donationCount}`);
