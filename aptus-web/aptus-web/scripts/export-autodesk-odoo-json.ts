/**
 * Export Odoo Page Sections JSON for all Autodesk product pages.
 * Usage: npx tsx scripts/export-autodesk-odoo-json.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AUTODESK_INNER_PAGE_DEFS } from "../src/lib/cms/autodesk-inner-registry";
import {
  getAutodeskInnerContent,
  toAutodeskOdooSections,
} from "../src/lib/cms/autodesk-pages-content";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "content", "odoo-json", "autodesk");

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const def of AUTODESK_INNER_PAGE_DEFS) {
  const content = getAutodeskInnerContent(def.key);
  if (!content) throw new Error(`Missing content for ${def.key}`);

  const slug = def.path.replace(/^\//, "");
  const file = `${slug}.json`;
  const json = JSON.stringify(toAutodeskOdooSections(content), null, 2);
  fs.writeFileSync(path.join(OUT_DIR, file), `${json}\n`, "utf8");
  console.log(`Wrote ${file}`);
}

fs.writeFileSync(
  path.join(OUT_DIR, "README.md"),
  `# Autodesk page JSON exports

Marketing page sections for \`x_page_sections_json\` on each Autodesk \`website.page\`.

Regenerate from code defaults:

\`\`\`bash
npm run cms:export-autodesk-json
npm run cms:seed-autodesk-inner-pages
\`\`\`
`,
  "utf8",
);

console.log(`\nPaste files from ${OUT_DIR} into Odoo → Page Sections JSON (Next.js)`);
