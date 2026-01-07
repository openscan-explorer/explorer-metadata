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

const ORG_TYPES = [
	"foundation",
	"infrastructure",
	"venture",
	"research",
	"other",
] as const;

async function main(): Promise<void> {
	console.log("\n=== Add Organization to OpenScan Metadata ===\n");

	// Get ID
	const id = await question(
		"Organization ID (lowercase, alphanumeric with hyphens): ",
	);
	if (!isValidId(id)) {
		console.error(
			"Invalid ID format. Use lowercase letters, numbers, and hyphens only.",
		);
		process.exit(1);
	}

	// Check if already exists
	const orgDir = path.join(ROOT_DIR, "data/orgs");
	const orgFile = path.join(orgDir, `${id}.json`);
	if (fs.existsSync(orgFile)) {
		console.error(`Organization already exists at ${orgFile}`);
		process.exit(1);
	}

	// Get basic info
	const name = await question("Organization name: ");
	if (!name) {
		console.error("Name is required");
		process.exit(1);
	}

	console.log(`\nOrganization types: ${ORG_TYPES.join(", ")}`);
	const type = await question("Organization type: ");
	if (!ORG_TYPES.includes(type as (typeof ORG_TYPES)[number])) {
		console.error(`Invalid type. Must be one of: ${ORG_TYPES.join(", ")}`);
		process.exit(1);
	}

	// Optional info
	console.log("\n--- Additional Info (optional, press Enter to skip) ---\n");
	const description = await question("Short description (max 500 chars): ");
	const website = await question("Website URL: ");
	const twitter = await question("Twitter handle (without @): ");
	const github = await question("GitHub organization: ");

	// Build organization object
	const org: Record<string, unknown> = {
		id,
		name,
		type,
	};

	if (description) {
		org.description = description;
	}

	// Add links if provided
	const links: Array<{ name: string; url: string }> = [];
	if (website) links.push({ name: "Website", url: website });
	if (twitter)
		links.push({ name: "Twitter", url: `https://twitter.com/${twitter}` });
	if (github)
		links.push({ name: "GitHub", url: `https://github.com/${github}` });

	if (links.length > 0) {
		org.links = links;
	}

	// Create directory if needed
	if (!fs.existsSync(orgDir)) {
		fs.mkdirSync(orgDir, { recursive: true });
	}

	// Write file
	fs.writeFileSync(orgFile, `${JSON.stringify(org, null, 2)}\n`);
	console.log(`\nOrganization saved to: ${orgFile}`);

	// Ask about profile
	const createProfile = await question("\nCreate markdown profile? (y/N): ");
	if (createProfile.toLowerCase() === "y") {
		const profileDir = path.join(ROOT_DIR, "profiles/organizations");
		const profileFile = path.join(profileDir, `${id}.md`);

		if (!fs.existsSync(profileDir)) {
			fs.mkdirSync(profileDir, { recursive: true });
		}

		const profileContent = `# ${name}

${description || "Add a description here."}

## About

Add information about the organization.

## Links

${website ? `- [Website](${website})` : "- Website: TBD"}
${twitter ? `- [Twitter](https://twitter.com/${twitter})` : ""}
${github ? `- [GitHub](https://github.com/${github})` : ""}
`;

		fs.writeFileSync(profileFile, profileContent);
		console.log(`Profile created at: ${profileFile}`);

		// Update org with profile path
		org.profile = `profiles/organizations/${id}.md`;
		fs.writeFileSync(orgFile, `${JSON.stringify(org, null, 2)}\n`);
	}

	console.log("\nDone! Remember to:");
	console.log(`  1. Add a logo to assets/organizations/${id}.svg`);
	console.log("  2. Run 'npm run validate' to check the entry");
	console.log("  3. Submit a PR with your changes\n");

	rl.close();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
