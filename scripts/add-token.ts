import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

function question(prompt: string): Promise<string> {
	return new Promise((resolve) => {
		rl.question(prompt, resolve);
	});
}

function toChecksumAddress(address: string): string {
	// Basic lowercase - in production, use ethers.getAddress() or viem
	return address.toLowerCase();
}

function isValidAddress(address: string): boolean {
	return /^0x[a-fA-F0-9]{40}$/.test(address);
}

async function main(): Promise<void> {
	console.log("\n=== Add Token to OpenScan Metadata ===\n");

	// Get chain ID
	const chainIdStr = await question("Chain ID (e.g., 1 for Ethereum): ");
	const chainId = Number.parseInt(chainIdStr, 10);
	if (Number.isNaN(chainId) || chainId <= 0) {
		console.error("Invalid chain ID");
		process.exit(1);
	}

	// Get address
	const address = await question("Token contract address: ");
	if (!isValidAddress(address)) {
		console.error("Invalid address format");
		process.exit(1);
	}
	const checksumAddress = toChecksumAddress(address);

	// Check if already exists
	const tokenDir = path.join(ROOT_DIR, "data/tokens", String(chainId));
	const tokenFile = path.join(tokenDir, `${checksumAddress}.json`);
	if (fs.existsSync(tokenFile)) {
		console.error(`Token already exists at ${tokenFile}`);
		process.exit(1);
	}

	// Get basic info
	const name = await question("Token name: ");
	const symbol = await question("Token symbol: ");
	const decimalsStr = await question("Decimals (default 18): ");
	const decimals = decimalsStr ? Number.parseInt(decimalsStr, 10) : 18;

	// Optional project info
	console.log("\n--- Project Info (optional, press Enter to skip) ---\n");
	const projectName = await question("Project/Company name: ");
	const description = await question("Short description: ");
	const website = await question("Website URL: ");
	const twitter = await question("Twitter handle (without @): ");
	const github = await question("GitHub: ");

	// Build token object
	const token: Record<string, unknown> = {
		address: checksumAddress,
		chainId,
		name,
		symbol,
		decimals,
		verified: false,
	};

	// Add project info if provided
	const project: Record<string, string> = {};
	if (projectName) project.name = projectName;
	if (description) project.description = description;
	if (website) project.website = website;
	if (twitter) project.twitter = twitter;
	if (github) project.github = github;

	if (Object.keys(project).length > 0) {
		token.project = project;
	}

	// Create directory if needed
	if (!fs.existsSync(tokenDir)) {
		fs.mkdirSync(tokenDir, { recursive: true });
	}

	// Write file
	fs.writeFileSync(tokenFile, `${JSON.stringify(token, null, 2)}\n`);
	console.log(`\nToken saved to: ${tokenFile}`);

	// Ask about profile
	const createProfile = await question("\nCreate markdown profile? (y/N): ");
	if (createProfile.toLowerCase() === "y") {
		const profileDir = path.join(ROOT_DIR, "profiles/tokens", String(chainId));
		const profileFile = path.join(profileDir, `${checksumAddress}.md`);

		if (!fs.existsSync(profileDir)) {
			fs.mkdirSync(profileDir, { recursive: true });
		}

		const profileContent = `# ${name} (${symbol})

${description || "Add a description here."}

## About

Add information about the token and project.

## Links

${website ? `- [Website](${website})` : "- Website: TBD"}
${twitter ? `- [Twitter](https://twitter.com/${twitter})` : ""}
${github ? `- [GitHub](https://github.com/${github})` : ""}
`;

		fs.writeFileSync(profileFile, profileContent);
		console.log(`Profile created at: ${profileFile}`);

		// Update token with profile path
		token.profile = `profiles/tokens/${chainId}/${checksumAddress}.md`;
		fs.writeFileSync(tokenFile, `${JSON.stringify(token, null, 2)}\n`);
	}

	console.log("\nDone! Remember to:");
	console.log("  1. Add a logo to assets/tokens/${chainId}/${address}.png");
	console.log("  2. Run 'npm run validate' to check the entry");
	console.log("  3. Submit a PR with your changes\n");

	rl.close();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
