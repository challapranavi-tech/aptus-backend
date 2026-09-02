/**
 * Regenerates frontend/data/product-detail-word-catalog.ts from docx-tmp/*.docx (via .txt extract).
 * Usage: node frontend/scripts/build-word-catalog-detail.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));

const extract = spawnSync(process.execPath, [path.join(scriptsDir, "extract-docx-tmp.mjs")], { stdio: "inherit" });
if (extract.status !== 0) process.exit(extract.status ?? 1);

const generate = spawnSync(process.execPath, [path.join(scriptsDir, "generate-product-detail-content.mjs")], {
  stdio: "inherit",
});
process.exit(generate.status ?? 1);
