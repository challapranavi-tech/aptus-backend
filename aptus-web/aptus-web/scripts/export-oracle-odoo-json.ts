/**
 * Export Odoo Page Sections JSON for Oracle hub + product pages.
 * Usage: npx tsx scripts/export-oracle-odoo-json.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ORACLE_INNER_PAGE_DEFS } from "../src/lib/cms/oracle-inner-registry";
import {
  getOracleInnerContent,
  toOracleOdooSections,
} from "../src/lib/cms/oracle-pages-content";
import { DEFAULT_SOFTWARE_CATEGORY_CONTENT } from "../src/lib/cms/software-pages-content";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "content", "odoo-json", "oracle");

fs.mkdirSync(OUT_DIR, { recursive: true });

const hubContent = DEFAULT_SOFTWARE_CATEGORY_CONTENT.oracle;
const hubJson = JSON.stringify(toOracleOdooSections(hubContent), null, 2);
fs.writeFileSync(path.join(OUT_DIR, "oracle-hub.json"), `${hubJson}\n`, "utf8");
console.log("Wrote oracle-hub.json");

for (const def of ORACLE_INNER_PAGE_DEFS) {
  const content = getOracleInnerContent(def.key);
  if (!content) throw new Error(`Missing content for ${def.key}`);

  const slug = def.path.replace(/^\//, "");
  const file = `${slug}.json`;
  const json = JSON.stringify(toOracleOdooSections(content), null, 2);
  fs.writeFileSync(path.join(OUT_DIR, file), `${json}\n`, "utf8");
  console.log(`Wrote ${file}`);
}

fs.writeFileSync(
  path.join(OUT_DIR, "README.md"),
  `# Oracle page JSON exports

Marketing page sections for \`x_page_sections_json\`.

\`\`\`bash
npm run cms:export-oracle-json
npm run cms:seed-oracle-pages
\`\`\`
`,
  "utf8",
);

console.log(`\nPaste files from ${OUT_DIR} into Odoo → Page Sections JSON (Next.js)`);
