/**
 * Export Odoo Page Sections JSON for all Adobe pages.
 * Usage: npx tsx scripts/export-adobe-odoo-json.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  getAdobeHubContent,
  getAdobeInnerContent,
  toOdooSections,
} from "../src/lib/cms/adobe-pages-content";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "content", "odoo-json", "adobe");

const EXPORTS: { file: string; key?: Parameters<typeof getAdobeInnerContent>[0] }[] = [
  { file: "adobe-hub.json" },
  { file: "adobe-business-creative-solutions.json", key: "adobeBusinessCreative" },
  { file: "adobe-acrobat-pro.json", key: "adobeAcrobatPro" },
  { file: "adobe-illustrator.json", key: "adobeIllustrator" },
  { file: "adobe-photoshop.json", key: "adobePhotoshop" },
  { file: "adobe-premiere-pro.json", key: "adobePremierePro" },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const entry of EXPORTS) {
  const content = entry.key ? getAdobeInnerContent(entry.key) : getAdobeHubContent();
  if (!content) throw new Error(`Missing content for ${entry.file}`);
  const json = JSON.stringify(toOdooSections(content), null, 2);
  fs.writeFileSync(path.join(OUT_DIR, entry.file), `${json}\n`, "utf8");
  console.log(`Wrote ${entry.file}`);
}

console.log(`\nPaste files from ${OUT_DIR} into Odoo → Page Sections JSON (Next.js)`);
