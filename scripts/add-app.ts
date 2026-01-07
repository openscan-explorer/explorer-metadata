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

function isValidId(id: string): boolean {
	return /^[a-z0-9-]+$/.test(id);
}

const APP_TYPES = [
	"wallet",
	"dapp",
	"exchange",
	"tool",
	"infrastructure",
] as const;

async function main(): Promise<void> {
	console.log("\n=== Add App to OpenScan Metadata ===\n");

	// Get ID
	const id = await question("App ID (lowercase, alphanumeric with hyphens): ");
	if (!isValidId(id)) {
		console.error(
			"Invalid ID format. Use lowercase letters, numbers, and hyphens only.",
		);
		process.exit(1);
	}

	// Check if already exists
	const appDir = path.join(ROOT_DIR, "data/apps");
	const appFile = path.join(appDir, `${id}.json`);
	if (fs.existsSync(appFile)) {
		console.error(`App already exists at ${appFile}`);
		process.exit(1);
	}

	// Get basic info
	const name = await question("App name: ");
	if (!name) {
		console.error("Name is required");
		process.exit(1);
	}

	console.log(`\nApp types: ${APP_TYPES.join(", ")}`);
	const type = await question("App type: ");
	if (!APP_TYPES.includes(type as (typeof APP_TYPES)[number])) {
		console.error(`Invalid type. Must be one of: ${APP_TYPES.join(", ")}`);
		process.exit(1);
	}

	// Optional info
	console.log("\n--- Additional Info (optional, press Enter to skip) ---\n");
	const description = await question("Short description (max 500 chars): ");
	const website = await question("Website URL: ");
	const appUrl = await question("App URL (if different from website): ");
	const twitter = await question("Twitter handle (without @): ");
	const github = await question("GitHub organization/repo: ");
	const docsUrl = await question("Documentation URL: ");

	// Networks
	const networksStr = await question(
		"Supported chain IDs (comma-separated, e.g., 1,10,137): ",
	);
	const networks = networksStr
		? networksStr
				.split(",")
				.map((n) => Number.parseInt(n.trim(), 10))
				.filter((n) => !Number.isNaN(n))
		: [];

	// Tags
	const tagsStr = await question(
		"Tags (comma-separated, e.g., defi,dex,amm): ",
	);
	const tags = tagsStr
		? tagsStr
				.split(",")
				.map((t) => t.trim().toLowerCase())
				.filter((t) => t)
		: [];

	// Build app object
	const app: Record<string, unknown> = {
		id,
		name,
		type,
	};

	if (description) {
		app.description = description;
	}

	app.verified = false;

	// Add links if provided
	const links: Array<{ name: string; url: string }> = [];
	if (website) links.push({ name: "Website", url: website });
	if (appUrl) links.push({ name: "App", url: appUrl });
	if (docsUrl) links.push({ name: "Docs", url: docsUrl });
	if (twitter)
		links.push({ name: "Twitter", url: `https://twitter.com/${twitter}` });
	if (github)
		links.push({ name: "GitHub", url: `https://github.com/${github}` });

	if (links.length > 0) {
		app.links = links;
	}

	if (networks.length > 0) {
		app.networks = networks;
	}

	if (tags.length > 0) {
		app.tags = tags;
	}

	// Create directory if needed
	if (!fs.existsSync(appDir)) {
		fs.mkdirSync(appDir, { recursive: true });
	}

	// Write file
	fs.writeFileSync(appFile, `${JSON.stringify(app, null, 2)}\n`);
	console.log(`\nApp saved to: ${appFile}`);

	// Ask about profile
	const createProfile = await question("\nCreate markdown profile? (y/N): ");
	if (createProfile.toLowerCase() === "y") {
		const profileDir = path.join(ROOT_DIR, "profiles/apps");
		const profileFile = path.join(profileDir, `${id}.md`);

		if (!fs.existsSync(profileDir)) {
			fs.mkdirSync(profileDir, { recursive: true });
		}

		const profileContent = `# ${name}

${description || "Add a description here."}

## About

Add information about the app.

## Features

- Feature 1
- Feature 2

## Supported Networks

${networks.length > 0 ? networks.map((n) => `- Chain ID: ${n}`).join("\n") : "- Add supported networks"}

## Links

${website ? `- [Website](${website})` : "- Website: TBD"}
${appUrl ? `- [App](${appUrl})` : ""}
${docsUrl ? `- [Documentation](${docsUrl})` : ""}
${twitter ? `- [Twitter](https://twitter.com/${twitter})` : ""}
${github ? `- [GitHub](https://github.com/${github})` : ""}
`;

		fs.writeFileSync(profileFile, profileContent);
		console.log(`Profile created at: ${profileFile}`);

		// Update app with profile path
		app.profile = `profiles/apps/${id}.md`;
		fs.writeFileSync(appFile, `${JSON.stringify(app, null, 2)}\n`);
	}

	console.log("\nDone! Remember to:");
	console.log(`  1. Add a logo to assets/apps/${id}.svg`);
	console.log("  2. Run 'npm run validate' to check the entry");
	console.log("  3. Submit a PR with your changes\n");

	rl.close();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
