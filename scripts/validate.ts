import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

// Load schemas
const tokenSchema = JSON.parse(
	fs.readFileSync(path.join(ROOT_DIR, "schemas/token.schema.json"), "utf-8"),
);
const networkSchema = JSON.parse(
	fs.readFileSync(path.join(ROOT_DIR, "schemas/network.schema.json"), "utf-8"),
);
const appSchema = JSON.parse(
	fs.readFileSync(path.join(ROOT_DIR, "schemas/app.schema.json"), "utf-8"),
);
const orgSchema = JSON.parse(
	fs.readFileSync(
		path.join(ROOT_DIR, "schemas/organization.schema.json"),
		"utf-8",
	),
);
const supporterSchema = JSON.parse(
	fs.readFileSync(
		path.join(ROOT_DIR, "schemas/supporter.schema.json"),
		"utf-8",
	),
);
const donationSchema = JSON.parse(
	fs.readFileSync(path.join(ROOT_DIR, "schemas/donation.schema.json"), "utf-8"),
);
const eventSchema = JSON.parse(
	fs.readFileSync(path.join(ROOT_DIR, "schemas/event.schema.json"), "utf-8"),
);
const addressSchema = JSON.parse(
	fs.readFileSync(path.join(ROOT_DIR, "schemas/address.schema.json"), "utf-8"),
);

const validateToken = ajv.compile(tokenSchema);
const validateNetwork = ajv.compile(networkSchema);
const validateApp = ajv.compile(appSchema);
const validateOrg = ajv.compile(orgSchema);
const validateSupporter = ajv.compile(supporterSchema);
const validateDonation = ajv.compile(donationSchema);
const validateEvent = ajv.compile(eventSchema);
const validateAddress = ajv.compile(addressSchema);

interface ValidationResult {
	file: string;
	valid: boolean;
	errors?: string[];
}

const results: ValidationResult[] = [];

function toChecksumAddress(address: string): string {
	// Simple checksum validation - in production use ethers or viem
	const addr = address.toLowerCase().replace("0x", "");
	return `0x${addr}`;
}

function isValidChecksumAddress(address: string): boolean {
	// Basic format check - enhance with proper EIP-55 validation
	return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function validateJsonFiles(
	dir: string,
	validator: ReturnType<typeof ajv.compile>,
	type: string,
): void {
	if (!fs.existsSync(dir)) {
		return;
	}

	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			// Recurse into subdirectories (e.g., chainId folders for tokens)
			validateJsonFiles(fullPath, validator, type);
		} else if (entry.name.endsWith(".json")) {
			try {
				const content = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
				const valid = validator(content);

				if (!valid) {
					results.push({
						file: fullPath,
						valid: false,
						errors: validator.errors?.map(
							(e) => `${e.instancePath} ${e.message}`,
						),
					});
				} else {
					// Additional validations
					const additionalErrors: string[] = [];

					// Check address checksum for tokens and addresses
					if ((type === "token" || type === "address") && content.address) {
						if (!isValidChecksumAddress(content.address)) {
							additionalErrors.push(
								`Invalid address format: ${content.address}`,
							);
						}
					}

					// Check that chainId in filename matches content for tokens and addresses
					if (type === "token" || type === "address") {
						const parentDir = path.basename(path.dirname(fullPath));
						const expectedChainId = Number.parseInt(parentDir, 10);
						if (
							!Number.isNaN(expectedChainId) &&
							content.chainId !== expectedChainId
						) {
							additionalErrors.push(
								`chainId mismatch: file is in ${parentDir}/ but chainId is ${content.chainId}`,
							);
						}
					}

					// NFT-specific validation: ERC721/ERC1155 should have decimals = 0
					if (type === "token" && content.type && content.type !== "ERC20") {
						if (content.decimals !== 0) {
							additionalErrors.push(
								`NFT tokens (${content.type}) should have decimals = 0, got ${content.decimals}`,
							);
						}
					}

					// Check profile file exists if referenced
					if (content.profile) {
						const profilePath = path.join(ROOT_DIR, content.profile);
						if (!fs.existsSync(profilePath)) {
							additionalErrors.push(
								`Referenced profile not found: ${content.profile}`,
							);
						}
					}

					// Check logo file exists if referenced
					if (content.logo) {
						const logoPath = path.join(ROOT_DIR, content.logo);
						if (!fs.existsSync(logoPath)) {
							additionalErrors.push(
								`Referenced logo not found: ${content.logo}`,
							);
						}
					}

					if (additionalErrors.length > 0) {
						results.push({
							file: fullPath,
							valid: false,
							errors: additionalErrors,
						});
					} else {
						results.push({ file: fullPath, valid: true });
					}
				}
			} catch (e) {
				results.push({
					file: fullPath,
					valid: false,
					errors: [`Failed to parse JSON: ${e}`],
				});
			}
		}
	}
}

function checkDuplicates(): void {
	// Check for duplicate token addresses per chain
	const tokensDir = path.join(ROOT_DIR, "data/tokens");
	if (fs.existsSync(tokensDir)) {
		const chainDirs = fs.readdirSync(tokensDir, { withFileTypes: true });

		for (const chainDir of chainDirs) {
			if (chainDir.isDirectory()) {
				const addresses = new Map<string, string>();
				const chainPath = path.join(tokensDir, chainDir.name);
				const files = fs
					.readdirSync(chainPath)
					.filter((f) => f.endsWith(".json"));

				for (const file of files) {
					const filePath = path.join(chainPath, file);
					try {
						const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
						const addr = content.address?.toLowerCase();
						if (addr) {
							if (addresses.has(addr)) {
								results.push({
									file: filePath,
									valid: false,
									errors: [
										`Duplicate token address ${addr} (also in ${addresses.get(addr)})`,
									],
								});
							} else {
								addresses.set(addr, file);
							}
						}
					} catch {
						// Already reported in validateJsonFiles
					}
				}
			}
		}
	}

	// Check for duplicate app IDs
	const appsDir = path.join(ROOT_DIR, "data/apps");
	if (fs.existsSync(appsDir)) {
		const ids = new Map<string, string>();
		const files = fs.readdirSync(appsDir).filter((f) => f.endsWith(".json"));

		for (const file of files) {
			const filePath = path.join(appsDir, file);
			try {
				const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
				if (content.id) {
					if (ids.has(content.id)) {
						results.push({
							file: filePath,
							valid: false,
							errors: [
								`Duplicate app ID "${content.id}" (also in ${ids.get(content.id)})`,
							],
						});
					} else {
						ids.set(content.id, file);
					}
				}
			} catch {
				// Already reported
			}
		}
	}
}

// Run validations
console.log("Validating metadata files...\n");

validateJsonFiles(path.join(ROOT_DIR, "data/tokens"), validateToken, "token");
validateJsonFiles(path.join(ROOT_DIR, "data/apps"), validateApp, "app");

// Validate organizations list
const orgsFile = path.join(ROOT_DIR, "data/organizations.json");
if (fs.existsSync(orgsFile)) {
	try {
		const content = JSON.parse(fs.readFileSync(orgsFile, "utf-8"));
		if (content.organizations && Array.isArray(content.organizations)) {
			for (let i = 0; i < content.organizations.length; i++) {
				const org = content.organizations[i] as Record<string, unknown>;
				const isValid = validateOrg(org);
				if (!isValid) {
					results.push({
						file: `${orgsFile}[${i}]`,
						valid: false,
						errors: validateOrg.errors?.map(
							(e) => `${e.instancePath} ${e.message}`,
						),
					});
				} else {
					// Check logo file exists if referenced
					const additionalErrors: string[] = [];
					if (org.logo) {
						const logoPath = path.join(ROOT_DIR, org.logo as string);
						if (!fs.existsSync(logoPath)) {
							additionalErrors.push(`Referenced logo not found: ${org.logo}`);
						}
					}
					if (additionalErrors.length > 0) {
						results.push({
							file: `${orgsFile}[${i}] (id: ${org.id})`,
							valid: false,
							errors: additionalErrors,
						});
					}
				}
			}
		}
	} catch (e) {
		results.push({
			file: orgsFile,
			valid: false,
			errors: [`Failed to parse JSON: ${e}`],
		});
	}
}

// Validate networks list
const networksFile = path.join(ROOT_DIR, "data/networks.json");
if (fs.existsSync(networksFile)) {
	try {
		const content = JSON.parse(fs.readFileSync(networksFile, "utf-8"));
		if (content.networks && Array.isArray(content.networks)) {
			for (let i = 0; i < content.networks.length; i++) {
				const network = content.networks[i] as Record<string, unknown>;
				const isValid = validateNetwork(network);
				if (!isValid) {
					results.push({
						file: `${networksFile}[${i}]`,
						valid: false,
						errors: validateNetwork.errors?.map(
							(e) => `${e.instancePath} ${e.message}`,
						),
					});
				} else {
					// Check logo file exists if referenced
					const additionalErrors: string[] = [];
					if (network.logo) {
						const logoPath = path.join(ROOT_DIR, network.logo as string);
						if (!fs.existsSync(logoPath)) {
							additionalErrors.push(
								`Referenced logo not found: ${network.logo}`,
							);
						}
					}
					if (additionalErrors.length > 0) {
						results.push({
							file: `${networksFile}[${i}] (chainId: ${network.chainId})`,
							valid: false,
							errors: additionalErrors,
						});
					}
				}
			}
		}
	} catch (e) {
		results.push({
			file: networksFile,
			valid: false,
			errors: [`Failed to parse JSON: ${e}`],
		});
	}
}

// Validate supporters list
const supportersFile = path.join(ROOT_DIR, "data/supporters.json");
if (fs.existsSync(supportersFile)) {
	try {
		const content = JSON.parse(fs.readFileSync(supportersFile, "utf-8"));
		if (content.supporters && Array.isArray(content.supporters)) {
			for (let i = 0; i < content.supporters.length; i++) {
				const valid = validateSupporter(content.supporters[i]);
				if (!valid) {
					results.push({
						file: `${supportersFile}[${i}]`,
						valid: false,
						errors: validateSupporter.errors?.map(
							(e) => `${e.instancePath} ${e.message}`,
						),
					});
				}
			}
		}
	} catch (e) {
		results.push({
			file: supportersFile,
			valid: false,
			errors: [`Failed to parse JSON: ${e}`],
		});
	}
}

// Validate donations list
const donationsFile = path.join(ROOT_DIR, "data/donations.json");
if (fs.existsSync(donationsFile)) {
	try {
		const content = JSON.parse(fs.readFileSync(donationsFile, "utf-8"));
		if (content.donations && Array.isArray(content.donations)) {
			for (let i = 0; i < content.donations.length; i++) {
				const valid = validateDonation(content.donations[i]);
				if (!valid) {
					results.push({
						file: `${donationsFile}[${i}]`,
						valid: false,
						errors: validateDonation.errors?.map(
							(e) => `${e.instancePath} ${e.message}`,
						),
					});
				}
			}
		}
	} catch (e) {
		results.push({
			file: donationsFile,
			valid: false,
			errors: [`Failed to parse JSON: ${e}`],
		});
	}
}

checkDuplicates();

// Validate events files
const eventsDir = path.join(ROOT_DIR, "data/events");
if (fs.existsSync(eventsDir)) {
	const chainDirs = fs.readdirSync(eventsDir, { withFileTypes: true });

	for (const chainDir of chainDirs) {
		if (!chainDir.isDirectory()) continue;

		const chainPath = path.join(eventsDir, chainDir.name);
		const eventFiles = fs.readdirSync(chainPath, { withFileTypes: true });

		for (const eventFile of eventFiles) {
			if (!eventFile.isFile() || !eventFile.name.endsWith(".json")) continue;

			const filePath = path.join(chainPath, eventFile.name);

			try {
				const content = JSON.parse(
					fs.readFileSync(filePath, "utf-8"),
				) as Record<string, unknown>;
				const isValid = validateEvent(content);

				if (!isValid) {
					results.push({
						file: filePath,
						valid: false,
						errors: validateEvent.errors?.map(
							(e) => `${e.instancePath} ${e.message}`,
						),
					});
				} else {
					// Additional validation: check topic0 hash format
					const additionalErrors: string[] = [];
					for (const topic0 of Object.keys(content)) {
						if (!/^0x[a-f0-9]{64}$/.test(topic0)) {
							additionalErrors.push(`Invalid topic0 hash format: ${topic0}`);
						}
					}

					if (additionalErrors.length > 0) {
						results.push({
							file: filePath,
							valid: false,
							errors: additionalErrors,
						});
					} else {
						results.push({ file: filePath, valid: true });
					}
				}
			} catch (e) {
				results.push({
					file: filePath,
					valid: false,
					errors: [`Failed to parse JSON: ${e}`],
				});
			}
		}
	}
}

// Validate addresses files
validateJsonFiles(
	path.join(ROOT_DIR, "data/addresses"),
	validateAddress,
	"address",
);

// Report results
const validCount = results.filter((r) => r.valid).length;
const invalid = results.filter((r) => !r.valid);

console.log(`Validated ${results.length} files (${validCount} valid)\n`);

if (invalid.length > 0) {
	console.log(`${invalid.length} file(s) with errors:\n`);
	for (const r of invalid) {
		console.log(`  ${r.file}`);
		for (const err of r.errors || []) {
			console.log(`    - ${err}`);
		}
		console.log();
	}
	process.exit(1);
} else {
	console.log("All files valid!");
	process.exit(0);
}
