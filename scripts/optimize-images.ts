import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const ASSETS_DIR = path.join(ROOT_DIR, "assets");

interface ImageConfig {
	maxWidth: number;
	maxHeight: number;
	maxSizeKB: number;
}

const IMAGE_CONFIGS: Record<string, ImageConfig> = {
	tokens: { maxWidth: 128, maxHeight: 128, maxSizeKB: 50 },
	networks: { maxWidth: 256, maxHeight: 256, maxSizeKB: 100 },
	apps: { maxWidth: 256, maxHeight: 256, maxSizeKB: 100 },
	organizations: { maxWidth: 256, maxHeight: 256, maxSizeKB: 100 },
};

interface OptimizeResult {
	file: string;
	originalSize: number;
	optimizedSize: number;
	skipped: boolean;
	error?: string;
}

const results: OptimizeResult[] = [];

async function optimizeImage(
	filePath: string,
	config: ImageConfig,
): Promise<OptimizeResult> {
	const originalSize = fs.statSync(filePath).size;
	const ext = path.extname(filePath).toLowerCase();

	// Skip SVGs - they don't need optimization in the same way
	if (ext === ".svg") {
		return {
			file: filePath,
			originalSize,
			optimizedSize: originalSize,
			skipped: true,
		};
	}

	// Only process PNG, JPG, WEBP
	if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
		return {
			file: filePath,
			originalSize,
			optimizedSize: originalSize,
			skipped: true,
			error: `Unsupported format: ${ext}`,
		};
	}

	try {
		const image = sharp(filePath);
		const metadata = await image.metadata();

		// Check if resize is needed
		const needsResize =
			(metadata.width && metadata.width > config.maxWidth) ||
			(metadata.height && metadata.height > config.maxHeight);

		// Check if file is already small enough
		const maxSizeBytes = config.maxSizeKB * 1024;
		if (!needsResize && originalSize <= maxSizeBytes) {
			return {
				file: filePath,
				originalSize,
				optimizedSize: originalSize,
				skipped: true,
			};
		}

		// Optimize
		let pipeline = image;

		if (needsResize) {
			pipeline = pipeline.resize(config.maxWidth, config.maxHeight, {
				fit: "inside",
				withoutEnlargement: true,
			});
		}

		// Output based on format
		let buffer: Buffer;
		if (ext === ".png") {
			buffer = await pipeline
				.png({ compressionLevel: 9, palette: true })
				.toBuffer();
		} else if (ext === ".webp") {
			buffer = await pipeline.webp({ quality: 80 }).toBuffer();
		} else {
			buffer = await pipeline.jpeg({ quality: 85 }).toBuffer();
		}

		// Only save if smaller
		if (buffer.length < originalSize) {
			fs.writeFileSync(filePath, buffer);
			return {
				file: filePath,
				originalSize,
				optimizedSize: buffer.length,
				skipped: false,
			};
		}
		return {
			file: filePath,
			originalSize,
			optimizedSize: originalSize,
			skipped: true,
		};
	} catch (e) {
		return {
			file: filePath,
			originalSize,
			optimizedSize: originalSize,
			skipped: true,
			error: String(e),
		};
	}
}

async function processDirectory(
	dir: string,
	config: ImageConfig,
): Promise<void> {
	if (!fs.existsSync(dir)) return;

	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			await processDirectory(fullPath, config);
		} else {
			const result = await optimizeImage(fullPath, config);
			results.push(result);
		}
	}
}

async function validateImages(): Promise<void> {
	console.log("\nValidating image dimensions and sizes...\n");

	const errors: string[] = [];

	for (const [category, config] of Object.entries(IMAGE_CONFIGS)) {
		const dir = path.join(ASSETS_DIR, category);
		if (!fs.existsSync(dir)) continue;

		const files = getAllFiles(dir);

		for (const file of files) {
			const ext = path.extname(file).toLowerCase();
			if (ext === ".svg") continue;
			if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) continue;

			try {
				const metadata = await sharp(file).metadata();
				const fileSize = fs.statSync(file).size;
				const maxSizeBytes = config.maxSizeKB * 1024;

				if (metadata.width && metadata.width > config.maxWidth) {
					errors.push(
						`${file}: width ${metadata.width}px exceeds max ${config.maxWidth}px`,
					);
				}
				if (metadata.height && metadata.height > config.maxHeight) {
					errors.push(
						`${file}: height ${metadata.height}px exceeds max ${config.maxHeight}px`,
					);
				}
				if (fileSize > maxSizeBytes) {
					errors.push(
						`${file}: size ${Math.round(fileSize / 1024)}KB exceeds max ${config.maxSizeKB}KB`,
					);
				}
			} catch (e) {
				errors.push(`${file}: failed to read - ${e}`);
			}
		}
	}

	if (errors.length > 0) {
		console.log("Image validation errors:");
		for (const err of errors) {
			console.log(`  - ${err}`);
		}
	} else {
		console.log("All images pass validation!");
	}
}

function getAllFiles(dir: string): string[] {
	const files: string[] = [];
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...getAllFiles(fullPath));
		} else {
			files.push(fullPath);
		}
	}

	return files;
}

// Main
const args = process.argv.slice(2);
const validateOnly = args.includes("--validate");

if (validateOnly) {
	await validateImages();
} else {
	console.log("Optimizing images...\n");

	for (const [category, config] of Object.entries(IMAGE_CONFIGS)) {
		const dir = path.join(ASSETS_DIR, category);
		console.log(`Processing ${category}/...`);
		await processDirectory(dir, config);
	}

	// Report
	const optimized = results.filter((r) => !r.skipped && !r.error);
	const skipped = results.filter((r) => r.skipped);
	const errors = results.filter((r) => r.error);

	console.log(`\nProcessed ${results.length} files:`);
	console.log(`  Optimized: ${optimized.length}`);
	console.log(`  Skipped: ${skipped.length}`);
	console.log(`  Errors: ${errors.length}`);

	if (optimized.length > 0) {
		const totalSaved = optimized.reduce(
			(sum, r) => sum + (r.originalSize - r.optimizedSize),
			0,
		);
		console.log(`  Total saved: ${Math.round(totalSaved / 1024)}KB`);
	}

	if (errors.length > 0) {
		console.log("\nErrors:");
		for (const r of errors) {
			console.log(`  ${r.file}: ${r.error}`);
		}
	}

	// Run validation after optimization
	await validateImages();
}
