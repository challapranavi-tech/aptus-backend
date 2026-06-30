/**
 * Export Odoo Page Sections JSON for Microsoft hub + product pages.
 * Usage: npx tsx scripts/export-microsoft-odoo-json.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MICROSOFT_INNER_PAGE_DEFS } from "../src/lib/cms/microsoft-inner-registry";
import {
  getMicrosoftInnerContent,
  toMicrosoftOdooSections,
} from "../src/lib/cms/microsoft-pages-content";
import { DEFAULT_SOFTWARE_CATEGORY_CONTENT } from "../src/lib/cms/software-pages-content";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "content", "odoo-json", "microsoft");

fs.mkdirSync(OUT_DIR, { recursive: true });

const hubContent = DEFAULT_SOFTWARE_CATEGORY_CONTENT.microsoft;
const hubJson = JSON.stringify(toMicrosoftOdooSections(hubContent), null, 2);
fs.writeFileSync(path.join(OUT_DIR, "microsoft-hub.json"), `${hubJson}\n`, "utf8");
console.log("Wrote microsoft-hub.json");

for (const def of MICROSOFT_INNER_PAGE_DEFS) {
  const content = getMicrosoftInnerContent(def.key);
  if (!content) throw new Error(`Missing content for ${def.key}`);

  const slug = def.path.replace(/^\//, "");
  const file = `${slug}.json`;
  const json = JSON.stringify(toMicrosoftOdooSections(content), null, 2);
  fs.writeFileSync(path.join(OUT_DIR, file), `${json}\n`, "utf8");
  console.log(`Wrote ${file}`);
}

fs.writeFileSync(
  path.join(OUT_DIR, "README.md"),
  `# Microsoft page JSON exports

\`\`\`bash
npm run cms:export-microsoft-json
npm run cms:seed-microsoft-pages
\`\`\`
`,
  "utf8",
);

console.log(`\nPaste files from ${OUT_DIR} into Odoo → Page Sections JSON (Next.js)`);
