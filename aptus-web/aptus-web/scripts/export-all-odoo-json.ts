/**
 * Export all CMS seed JSON files to content/odoo-json/.
 * Usage: npm run cms:export-all-json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  ABOUT_PAGES,
  DEFAULT_ABOUT_PAGE_CONTENT,
  type AboutPageKey,
} from "../src/lib/cms/about-pages-content";
import {
  getAdobeHubContent,
  getAdobeInnerContent,
  toOdooSections as toAdobeOdooSections,
} from "../src/lib/cms/adobe-pages-content";
import {
  getAutodeskInnerContent,
  toAutodeskOdooSections,
} from "../src/lib/cms/autodesk-pages-content";
import { AUTODESK_INNER_PAGE_DEFS } from "../src/lib/cms/autodesk-inner-registry";
import { DEFAULT_CASE_STUDIES_PAGE_CONTENT } from "../src/lib/cms/case-studies-content";
import { toOdooCaseStudiesPageSectionsJson } from "../src/lib/cms/case-studies-json";
import { DEFAULT_ELV_PAGE_CONTENT } from "../src/lib/cms/elv-content";
import { toOdooElvPageSectionsJson } from "../src/lib/cms/elv-json";
import { DEFAULT_ETAP_PAGE_CONTENT } from "../src/lib/cms/etap-content";
import { toOdooEtapPageSectionsJson } from "../src/lib/cms/etap-json";
import { DEFAULT_HOMEPAGE_CONTENT } from "../src/lib/cms/homepage-content";
import { toOdooHomePageSectionsJson } from "../src/lib/cms/homepage-json";
import { toMarketingOdooSections } from "../src/lib/cms/marketing-page-json";
import {
  getMicrosoftInnerContent,
  toMicrosoftOdooSections,
} from "../src/lib/cms/microsoft-pages-content";
import { MICROSOFT_INNER_PAGE_DEFS } from "../src/lib/cms/microsoft-inner-registry";
import {
  NAV_PRODUCT_PAGE_DEFS,
  DEFAULT_NAV_PRODUCT_PAGE_CONTENT,
} from "../src/lib/cms/nav-product-pages-content";
import {
  getOracleInnerContent,
  toOracleOdooSections,
} from "../src/lib/cms/oracle-pages-content";
import { ORACLE_INNER_PAGE_DEFS } from "../src/lib/cms/oracle-inner-registry";
import { DEFAULT_SOFTWARE_PAGE_CONTENT } from "../src/lib/cms/software-content";
import {
  DEFAULT_SOFTWARE_CATEGORY_CONTENT,
  SOFTWARE_CATEGORIES,
  type SoftwareCategoryKey,
} from "../src/lib/cms/software-pages-content";
import { toOdooSoftwarePageSectionsJson } from "../src/lib/cms/software-json";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "content", "odoo-json");

const ADOBE_INNER_FILES: { key: Parameters<typeof getAdobeInnerContent>[0]; file: string }[] = [
  { key: "adobeBusinessCreative", file: "adobe-business-creative-solutions" },
  { key: "adobeAcrobatPro", file: "adobe-acrobat-pro" },
  { key: "adobeIllustrator", file: "adobe-illustrator" },
  { key: "adobePhotoshop", file: "adobe-photoshop" },
  { key: "adobePremierePro", file: "adobe-premiere-pro" },
];

const SOFTWARE_HUB_CATEGORIES: SoftwareCategoryKey[] = [
  "autodesk",
  "electricalSoftware",
  "multimedia",
  "quantityTakeoff",
  "structuralSoftware",
  "cyberSecurity",
  "educationalSoftware",
  "edms",
];

const NAV_PRODUCT_FOLDER: Record<string, string> = {
  multimedia: "multimedia",
  quantityTakeoff: "quantity-takeoff",
  structural: "structural",
  cyberSecurity: "cyber-security",
  educational: "educational",
  edms: "edms",
  elv: "elv",
};

let count = 0;

function writeJson(relativePath: string, data: unknown): void {
  const filePath = path.join(OUT, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`Wrote ${relativePath}`);
  count++;
}

function slugFromPath(routePath: string): string {
  return routePath.replace(/^\//, "");
}

// Home
writeJson("home.json", toOdooHomePageSectionsJson(DEFAULT_HOMEPAGE_CONTENT));

// About pages
for (const key of Object.keys(ABOUT_PAGES) as AboutPageKey[]) {
  writeJson(
    `about/${slugFromPath(ABOUT_PAGES[key].path)}.json`,
    toMarketingOdooSections(DEFAULT_ABOUT_PAGE_CONTENT[key]),
  );
}

// Software hub + category hubs
writeJson("software/software-hub.json", toOdooSoftwarePageSectionsJson(DEFAULT_SOFTWARE_PAGE_CONTENT));
for (const key of SOFTWARE_HUB_CATEGORIES) {
  writeJson(
    `software/${slugFromPath(SOFTWARE_CATEGORIES[key].path)}.json`,
    toMarketingOdooSections(DEFAULT_SOFTWARE_CATEGORY_CONTENT[key]),
  );
}

// Vendor hubs also live under software/ paths — adobe, oracle, microsoft exported in vendor dirs
writeJson("software/adobe.json", toMarketingOdooSections(DEFAULT_SOFTWARE_CATEGORY_CONTENT.adobe));
writeJson("software/oracle.json", toMarketingOdooSections(DEFAULT_SOFTWARE_CATEGORY_CONTENT.oracle));
writeJson("software/microsoft.json", toMarketingOdooSections(DEFAULT_SOFTWARE_CATEGORY_CONTENT.microsoft));

// ELV hub
writeJson("elv/elv-solutions.json", toOdooElvPageSectionsJson(DEFAULT_ELV_PAGE_CONTENT));

// Case studies
writeJson(
  "case-studies/aptus-case-studies.json",
  toOdooCaseStudiesPageSectionsJson(DEFAULT_CASE_STUDIES_PAGE_CONTENT),
);

// ETAP
writeJson("etap/etap-sections.json", toOdooEtapPageSectionsJson(DEFAULT_ETAP_PAGE_CONTENT));

// Adobe
writeJson("adobe/adobe-hub.json", toAdobeOdooSections(getAdobeHubContent()));
for (const { key, file } of ADOBE_INNER_FILES) {
  const content = getAdobeInnerContent(key);
  if (!content) throw new Error(`Missing Adobe content: ${key}`);
  writeJson(`adobe/${file}.json`, toAdobeOdooSections(content));
}

// Autodesk hub + products
writeJson(
  "autodesk/autodesk-hub.json",
  toMarketingOdooSections(DEFAULT_SOFTWARE_CATEGORY_CONTENT.autodesk),
);
for (const def of AUTODESK_INNER_PAGE_DEFS) {
  const content = getAutodeskInnerContent(def.key);
  if (!content) throw new Error(`Missing Autodesk content: ${def.key}`);
  writeJson(`autodesk/${slugFromPath(def.path)}.json`, toAutodeskOdooSections(content));
}

// Oracle hub + products
writeJson(
  "oracle/oracle-hub.json",
  toOracleOdooSections(DEFAULT_SOFTWARE_CATEGORY_CONTENT.oracle),
);
for (const def of ORACLE_INNER_PAGE_DEFS) {
  const content = getOracleInnerContent(def.key);
  if (!content) throw new Error(`Missing Oracle content: ${def.key}`);
  writeJson(`oracle/${slugFromPath(def.path)}.json`, toOracleOdooSections(content));
}

// Microsoft hub + products
writeJson(
  "microsoft/microsoft-hub.json",
  toMicrosoftOdooSections(DEFAULT_SOFTWARE_CATEGORY_CONTENT.microsoft),
);
for (const def of MICROSOFT_INNER_PAGE_DEFS) {
  const content = getMicrosoftInnerContent(def.key);
  if (!content) throw new Error(`Missing Microsoft content: ${def.key}`);
  writeJson(`microsoft/${slugFromPath(def.path)}.json`, toMicrosoftOdooSections(content));
}

// Nav-linked leaf pages (ELV sub-pages + software products)
for (const def of NAV_PRODUCT_PAGE_DEFS) {
  const slug = slugFromPath(def.path);
  const folder = NAV_PRODUCT_FOLDER[def.category];
  const content = DEFAULT_NAV_PRODUCT_PAGE_CONTENT[slug];
  if (!content) throw new Error(`Missing nav product content: ${slug}`);
  writeJson(`${folder}/${slug}.json`, toMarketingOdooSections(content));
}

fs.writeFileSync(
  path.join(OUT, "README.md"),
  `# Odoo CMS seed JSON exports

Generated by \`npm run cms:export-all-json\`.

Each file contains section content for the matching Odoo \`website.page\` JSON field:

| Page type | Odoo field |
|-----------|------------|
| Home | \`x_homepage_sections_json\` |
| ELV hub | \`x_elv_sections_json\` |
| Software hub | \`x_software_sections_json\` |
| Case studies | \`x_case_studies_sections_json\` |
| ETAP | \`x_etap_sections_json\` |
| All other marketing pages | \`x_page_sections_json\` |

Regenerate after editing content in \`src/lib/cms/*-content.ts\`.
`,
  "utf8",
);

console.log(`\nDone — ${count} page JSON files in ${OUT}`);
