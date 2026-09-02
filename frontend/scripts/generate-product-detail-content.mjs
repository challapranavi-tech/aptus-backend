/**
 * One-shot generator: parses product detailing .txt extracts and writes
 * frontend/data/product-detail-pdf-archive.ts (reference only — not used in the app).
 * Product detail pages use product-detail-content.ts + product-detail-autodesk-portal.ts.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outFile = path.join(root, "frontend/data/product-detail-pdf-archive.ts");

function decode(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "")
    .trim();
}

function normalizeKey(name) {
  return name.trim().toLowerCase();
}

/** Title line → catalog slug (primary CONTENT key). */
const TITLE_RULES = [
  { re: /autocad\s*lt/i, catalog: "AutoCAD LT", slug: "autocad-lt" },
  { re: /autocad\b(?!.*lt)/i, catalog: "AutoCAD", slug: "autocad" },
  { re: /civil\s*3d/i, catalog: "Civil 3D", slug: "civil-3d" },
  { re: /architecture engineering|aec collection/i, catalog: "AEC Collection", slug: "aec-collection" },
  {
    re: /product design.*manufacturing|pdmc/i,
    catalog: "Product Design & Manufacturing Collection",
    slug: "product-design-manufacturing-collection",
  },
  { re: /3ds\s*max/i, catalog: "3ds Max", slug: "3ds-max" },
  {
    re: /forma design collaboration|bim collaborate pro/i,
    catalog: "Forma Design Collaboration",
    slug: "bim-collaborate-pro",
  },
  { re: /bim collaborate\s+cloud/i, catalog: "BIM Collaborate", slug: "bim-collaborate", extraHeading: true },
  { re: /build\s*-\s*cloud|autodesk build/i, catalog: "Autodesk Build", slug: "autodesk-build" },
  { re: /takeoff/i, catalog: "Autodesk Takeoff", slug: "autodesk-takeoff" },
  { re: /docs\s*-\s*user|autodesk docs|docs.*cloud commercial/i, catalog: "Autodesk Docs", slug: "autodesk-docs" },
  { re: /navisworks manage/i, catalog: "Navisworks Manage", slug: "navisworks" },
  { re: /navisworks simulate/i, catalog: "Navisworks Simulate", slug: "navisworks-simulate", extraHeading: true },
  { re: /revit commercial/i, catalog: "Revit", slug: "revit" },
  { re: /fabrication camduct/i, catalog: "Fabrication CAMduct", slug: "fabrication-camduct" },
  { re: /infraworks/i, catalog: "InfraWorks", slug: "infraworks" },
  { re: /inventor professional/i, catalog: "Inventor Professional", slug: "inventor-professional" },
  { re: /infodrainage/i, catalog: "InfoDrainage", slug: "infodrainage" },
  { re: /infowater/i, catalog: "InfoWater Pro", slug: "infowater-pro" },
  {
    re: /infoworks icm.*ultimate|infoworks icm\s*-\s*ultimate/i,
    catalog: "InfoWorks ICM Ultimate",
    slug: "infoworks-icm-ultimate",
    extraHeading: true,
  },
  { re: /infoworks icm/i, catalog: "InfoWorks ICM", slug: "infoworks-icm" },
  { re: /infoworks ws/i, catalog: "InfoWorks WS Pro", slug: "infoworks-ws-pro" },
  { re: /acrobat pro/i, catalog: "Adobe Acrobat Pro", slug: "adobe-acrobat-pro" },
  { re: /premiere pro/i, catalog: "Adobe Premiere Pro", slug: "adobe-premiere-pro" },
  { re: /photoshop/i, catalog: "Adobe Photoshop", slug: "adobe-photoshop" },
  { re: /illustrator/i, catalog: "Adobe Illustrator", slug: "adobe-illustrator" },
  {
    re: /creative cloud for teams.*education/i,
    catalog: "Creative Cloud for Teams Education",
    slug: "creative-cloud-teams-education",
  },
  {
    re: /creative cloud for enterprise.*hed|new hed/i,
    catalog: "Creative Cloud for Enterprise HED",
    slug: "creative-cloud-enterprise-hed",
  },
  {
    re: /creative cloud for enterprise/i,
    catalog: "Creative Cloud for Enterprise",
    slug: "creative-cloud-enterprise",
  },
  {
    re: /creative cloud for teams all apps/i,
    catalog: "Creative Cloud for Teams All Apps",
    slug: "adobe-business-creative-solutions",
  },
  { re: /primavera p6 professional/i, catalog: "Oracle Primavera P6", slug: "oracle-primavera-p6" },
  {
    re: /primavera p6 enterprise/i,
    catalog: "Oracle Primavera P6 Enterprise",
    slug: "oracle-primavera-p6-enterprise",
    extraHeading: true,
  },
  { re: /microsoft 365 e3/i, catalog: "Microsoft 365 E3", slug: "microsoft-365-e3" },
  { re: /microsoft 365 apps/i, catalog: "Microsoft 365 Apps", slug: "microsoft-365-apps" },
  { re: /microsoft 365 business standard/i, catalog: "Microsoft 365 Business Standard", slug: "microsoft-365-business" },
  { re: /microsoft 365 business basic/i, catalog: "Microsoft 365 Business Basic", slug: "microsoft-365-business-basic" },
  { re: /exchange online kiosk/i, catalog: "Exchange Online Kiosk", slug: "exchange-online-kiosk" },
  { re: /microsoft teams essentials/i, catalog: "Microsoft Teams Essentials", slug: "microsoft-teams-essentials" },
  { re: /visio plan 2/i, catalog: "Microsoft Visio", slug: "microsoft-visio" },
  { re: /copilot for microsoft 365/i, catalog: "Copilot for Microsoft 365", slug: "copilot-for-microsoft-365" },
  { re: /planner plan 1/i, catalog: "Planner Plan 1", slug: "planner-plan-1" },
  { re: /power bi premium per user/i, catalog: "Power BI Premium Per User", slug: "power-bi-premium-per-user" },
  { re: /power bi pro(?!.*premium)/i, catalog: "Power BI Pro", slug: "power-bi" },
  { re: /windows 11 pro/i, catalog: "Windows 11 Pro", slug: "windows-11-pro" },
  { re: /project professional 2024/i, catalog: "Project Professional 2024", slug: "project-professional-2024" },
  { re: /windows server 2025/i, catalog: "Windows Server 2025 Standard", slug: "windows-server-2025" },
];

const TITLE_START =
  /^(?:Product Title\s*:|Product title\s*:|Project title\s*:|Product Detail\s*:|Product list\s*:|Product List\s*:|AutoCAD LT Commercial:|Autodesk Forma Design Collaboration)/i;

function splitProducts(raw) {
  const lines = raw.split("\n");
  const products = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || /^_{10,}$/.test(trimmed)) continue;

    if (TITLE_START.test(trimmed)) {
      if (current) products.push(current);
      current = { titleLine: decode(trimmed), bodyLines: [] };
      continue;
    }
    if (current) current.bodyLines.push(line);
  }
  if (current) products.push(current);
  return products;
}

function matchCatalog(titleLine) {
  for (const rule of TITLE_RULES) {
    if (rule.re.test(titleLine)) {
      return {
        catalog: rule.catalog,
        slug: rule.slug,
        extraHeading: Boolean(rule.extraHeading),
        titleLine,
      };
    }
  }
  return null;
}

function licensingBlocksToTab(blocks) {
  if (!blocks.length) {
    return [{ type: "p", text: "Contact Aptus for subscription and licensing options for this product." }];
  }
  const items = [];
  for (const block of blocks) {
    if (block.type === "ul") items.push(...block.items);
    else if (block.type === "p") items.push(block.text);
  }
  if (!items.length) return blocks;
  const rows = items.map((item) => {
    const splitAt = item.indexOf(": ");
    if (splitAt === -1) return [item, ""];
    return [item.slice(0, splitAt), item.slice(splitAt + 2)];
  });
  return [{ type: "table", headers: ["Licensing Option", "Description"], rows }];
}

function includedFallback(blocks) {
  if (blocks.length) return blocks;
  return [{ type: "p", text: "See the overview and key features for included components." }];
}

function featuresFallback(blocks) {
  if (blocks.length) return blocks;
  return [{ type: "p", text: "See product overview for capabilities." }];
}

const OVERVIEW_HEAD =
  /^(?:Product Overview|Overview)\s*:?\s*(.*)$/i;
const FEATURES_HEAD =
  /^(?:Key Product Benefits|Key Features(?:\s*&(?:amp;)?\s*Capabilities)?(?:\s*\(.*\))?|✨\s*Key Features|🚀\s*Key Features)\s*$/i;
const INCLUDED_HEAD =
  /^(?:What(?:’|')?s Included\??(?:\s*.*)?|📦\s*What(?:’|')?s Included|Included Product\s*\/\s*Service)\s*$/i;
const SPECS_HEAD =
  /^(?:Administrative\s*&(?:amp;)?\s*Licensing Details|Subscription\s*&(?:amp;)?\s*Licensing Options(?:\s*\(.*\))?|💳\s*Subscription\s*&(?:amp;)?\s*Licensing Options|🔑\s*Subscription\s*&(?:amp;)?\s*Licensing Options)\s*$/i;
const SKIP_META =
  /^(?:Group the technical features|Included Product\s*\/\s*Service|Description|Availability|Component(?: Type)?|Included Assets|Format\s*\/\s*Version|Deployment|Primary (?:Industry Application|Purpose|Value)|Module\s*\/\s*Component|Software(?:\s*\/\s*Service)?|Key Manufacturing Value|Toolset Name|Core Focus(?:\s*&\s*Features)?|Included Asset Count|Delivery Method)\s*$/i;

function isSectionHead(line) {
  return (
    OVERVIEW_HEAD.test(line) ||
    FEATURES_HEAD.test(line) ||
    INCLUDED_HEAD.test(line) ||
    SPECS_HEAD.test(line)
  );
}

function classifySection(line) {
  if (OVERVIEW_HEAD.test(line)) return "overview";
  if (FEATURES_HEAD.test(line)) return "features";
  if (INCLUDED_HEAD.test(line)) return "included";
  if (SPECS_HEAD.test(line)) return "licensing";
  return null;
}

/**
 * Convert a section's raw lines into ContentBlock[].
 * Feature lines "Label: rest" → list items preserving exact text.
 * Table-ish 3-row repeating groups after an included intro → table when detectable.
 */
function linesToBlocks(sectionLines, sectionKind) {
  const blocks = [];
  const lines = sectionLines.map((l) => decode(l)).filter((l) => l.length > 0);

  // Inline overview after "Product Overview :"
  if (sectionKind === "overview" && lines.length === 0) return blocks;

  let i = 0;
  // Drop heading line itself if present
  if (lines[0] && isSectionHead(lines[0])) {
    const m = lines[0].match(OVERVIEW_HEAD);
    if (m?.[1]?.trim()) {
      blocks.push({ type: "p", text: m[1].trim() });
      i = 1;
    } else {
      i = 1;
    }
  }

  const rest = lines.slice(i).filter((l) => !SKIP_META.test(l));

  if (sectionKind === "features") {
    const items = [];
    let i = 0;
    while (i < rest.length) {
      const line = rest[i];
      if (/^[✨🚀📦💳🔑]/.test(line) && !line.includes(":")) {
        if (items.length) {
          blocks.push({ type: "ul", items: [...items] });
          items.length = 0;
        }
        blocks.push({ type: "h3", text: line.replace(/^[✨🚀📦💳🔑]\s*/, "") });
        i += 1;
        continue;
      }
      if (/^[A-Za-z0-9].{0,80}:\s+\S/.test(line)) {
        items.push(line);
        i += 1;
        continue;
      }
      // Title on one line, description on the next (AutoCAD LT style)
      const next = rest[i + 1];
      if (
        next &&
        line.length < 90 &&
        !line.includes(":") &&
        next.length > line.length &&
        !/^[A-Za-z0-9].{0,80}:\s+\S/.test(next)
      ) {
        items.push(`${line}: ${next}`);
        i += 2;
        continue;
      }
      if (items.length) {
        blocks.push({ type: "ul", items: [...items] });
        items.length = 0;
      }
      blocks.push({ type: "p", text: line });
      i += 1;
    }
    if (items.length) blocks.push({ type: "ul", items });
    return blocks;
  }

  if (sectionKind === "included") {
    // Prefer 3-column repeating rows (name / description / availability|asset count)
    const tableRows = [];
    const intro = [];
    let j = 0;
    while (j < rest.length) {
      const line = rest[j];
      // Skip leftover column headers
      if (SKIP_META.test(line)) {
        j += 1;
        continue;
      }
      if (j + 2 < rest.length && looksLikeTableRowStart(rest, j)) break;
      intro.push(line);
      j += 1;
      // Only keep a short intro — stop once we're past the first paragraph
      if (intro.length >= 2) break;
    }
    // If we stopped early without finding a table, reset and scan from start
    if (j + 2 >= rest.length || !looksLikeTableRowStart(rest, j)) {
      j = 0;
      intro.length = 0;
      while (j < rest.length && (SKIP_META.test(rest[j]) || rest[j].endsWith(":"))) {
        if (!SKIP_META.test(rest[j])) intro.push(rest[j]);
        j += 1;
      }
      while (j < rest.length && SKIP_META.test(rest[j])) j += 1;
    }
    for (const p of intro) blocks.push({ type: "p", text: p });

    while (j + 2 < rest.length) {
      if (SKIP_META.test(rest[j])) {
        j += 1;
        continue;
      }
      const a = rest[j];
      const b = rest[j + 1];
      const c = rest[j + 2];
      if (a.length < 120 && c.length < 90 && b.length >= 10 && !SKIP_META.test(a)) {
        tableRows.push([a, b, c]);
        j += 3;
      } else {
        break;
      }
    }
    if (tableRows.length >= 2) {
      const headers =
        tableRows[0][2].match(/Objects|Parts|Symbols|Piping|Connectors|Engine|Installation|Plugin|Utility|Support|Cloud|Windows|macOS|Included|Component|Desktop|Browser|App/i) ||
        tableRows[0][2].length < 40
          ? ["Included Product / Service", "Description", "Availability"]
          : ["Name", "Description", "Detail"];
      // AutoCAD toolsets use asset-count third column
      if (/Intelligent Objects|Parts & Symbols|Electrical Symbols|Piping|Connectors|Engine/i.test(tableRows.map((r) => r[2]).join(" "))) {
        blocks.push({
          type: "table",
          headers: ["Toolset Name", "Core Focus & Features", "Included Asset Count"],
          rows: tableRows,
        });
      } else {
        blocks.push({ type: "table", headers, rows: tableRows });
      }
      while (j < rest.length) {
        if (!SKIP_META.test(rest[j])) blocks.push({ type: "p", text: rest[j] });
        j += 1;
      }
      return blocks;
    }

    // Fallback: 2-col software list (name + purpose) for AEC / PDMC style
    const twoCol = [];
    let k = 0;
    const lead = [];
    while (k < rest.length && rest[k].length > 90) {
      lead.push(rest[k]);
      k += 1;
    }
    for (const p of lead) blocks.push({ type: "p", text: p });
    while (k + 1 < rest.length) {
      if (SKIP_META.test(rest[k])) {
        k += 1;
        continue;
      }
      const a = rest[k];
      const b = rest[k + 1];
      if (a.length < 80 && b.length > 15) {
        twoCol.push([a, b]);
        k += 2;
      } else {
        break;
      }
    }
    if (twoCol.length >= 2) {
      blocks.push({
        type: "table",
        headers: ["Software / Service", "Primary Industry Application"],
        rows: twoCol,
      });
      while (k < rest.length) {
        blocks.push({ type: "p", text: rest[k] });
        k += 1;
      }
      return blocks;
    }

    const items = [];
    for (const line of rest) {
      if (SKIP_META.test(line)) continue;
      if (/^[A-Za-z0-9].{0,80}:\s+\S/.test(line)) items.push(line);
      else {
        if (items.length) {
          blocks.push({ type: "ul", items: [...items] });
          items.length = 0;
        }
        blocks.push({ type: "p", text: line });
      }
    }
    if (items.length) blocks.push({ type: "ul", items });
    return blocks;
  }

  if (sectionKind === "licensing" || sectionKind === "overview") {
    const items = [];
    for (const line of rest) {
      if (/^[A-Za-z0-9].{0,90}:\s+\S/.test(line)) items.push(line);
      else {
        if (items.length) {
          blocks.push({ type: "ul", items: [...items] });
          items.length = 0;
        }
        blocks.push({ type: "p", text: line });
      }
    }
    if (items.length) blocks.push({ type: "ul", items });
    return blocks;
  }

  for (const line of rest) blocks.push({ type: "p", text: line });
  return blocks;
}

function looksLikeTableRowStart(lines, j) {
  if (j + 2 >= lines.length) return false;
  const a = lines[j];
  const b = lines[j + 1];
  const c = lines[j + 2];
  // First cell must look like a product/toolset name, not an intro sentence.
  if (a.length > 70 || /[.!?]$/.test(a) || a.endsWith(":")) return false;
  return b.length >= 20 && c.length < 90;
}

function parseProductBody(bodyLines) {
  const sections = { overview: [], features: [], included: [], licensing: [] };
  let current = "overview";
  let pendingOverviewInline = null;

  for (const raw of bodyLines) {
    const line = raw.trim();
    if (!line) continue;
    const decoded = decode(line);

    const kind = classifySection(decoded);
    if (kind) {
      current = kind;
      const m = decoded.match(OVERVIEW_HEAD);
      if (kind === "overview" && m?.[1]?.trim()) {
        sections.overview.push(`Product Overview`);
        sections.overview.push(m[1].trim());
      } else {
        sections[kind].push(decoded);
      }
      continue;
    }

    // AutoCAD LT / Forma style: title line already consumed; first body may be overview without header
    if (
      current === "overview" &&
      sections.overview.length === 0 &&
      !FEATURES_HEAD.test(decoded) &&
      decoded.length > 80
    ) {
      sections.overview.push(decoded);
      continue;
    }

    sections[current].push(decoded);
  }

  const overview = linesToBlocks(sections.overview, "overview");
  const features = linesToBlocks(sections.features, "features");
  const included = linesToBlocks(sections.included, "included");
  const licensing = linesToBlocks(sections.licensing, "licensing");

  return { overview, features, included, licensing };
}

function mergeExtra(existing, titleLine, parsed) {
  const heading = titleLine
    .replace(/^(?:Product Title\s*:|Product title\s*:|Project title\s*:|Product Detail\s*:|Product list\s*:|Product List\s*:)\s*/i, "")
    .trim();
  const add = (tab, blocks) => {
    if (!blocks.length) return;
    existing[tab].push({ type: "h3", text: heading });
    existing[tab].push(...blocks);
  };
  add("overview", parsed.overview);
  add("keyFeatures", parsed.features);
  add("whatsIncluded", parsed.included);
  add("subscriptionLicensing", parsed.licensing);
  return existing;
}

function toContent(parsed) {
  return {
    overview: parsed.overview.length ? parsed.overview : [{ type: "p", text: "Product overview available on request." }],
    keyFeatures: featuresFallback(parsed.features),
    whatsIncluded: includedFallback(parsed.included),
    subscriptionLicensing: licensingBlocksToTab(parsed.licensing),
  };
}

function processFile(relPath) {
  const raw = fs.readFileSync(path.join(root, relPath), "utf8");
  const products = splitProducts(raw);
  const mapped = [];
  const skipped = [];

  for (const product of products) {
    const match = matchCatalog(product.titleLine);
    if (!match) {
      skipped.push(product.titleLine.slice(0, 100));
      continue;
    }
    const parsed = parseProductBody(product.bodyLines);
    mapped.push({ ...match, parsed });
  }
  return { mapped, skipped };
}

const files = [
  "docx-tmp/renewals.txt",
  "docx-tmp/levels.txt",
  "docx-tmp/bundle.txt",
];

const bySlug = new Map();
const allSkipped = [];

for (const file of files) {
  const { mapped, skipped } = processFile(file);
  allSkipped.push(...skipped);
  for (const entry of mapped) {
    const key = entry.slug;
    if (entry.extraHeading && bySlug.has(key)) {
      bySlug.set(key, mergeExtra(bySlug.get(key), entry.titleLine, entry.parsed));
    } else if (!bySlug.has(key)) {
      bySlug.set(key, {
        productName: entry.catalog,
        sourceTitle: entry.titleLine,
        ...toContent(entry.parsed),
      });
    }
  }
}

function esc(str) {
  return JSON.stringify(str);
}

function emitBlocks(blocks, indent) {
  const pad = " ".repeat(indent);
  if (!blocks.length) return `${pad}[]`;
  const lines = [`${pad}[`];
  for (const b of blocks) {
    if (b.type === "p") lines.push(`${pad}  { type: "p", text: ${esc(b.text)} },`);
    else if (b.type === "h3") lines.push(`${pad}  { type: "h3", text: ${esc(b.text)} },`);
    else if (b.type === "ul") {
      lines.push(`${pad}  { type: "ul", items: [`);
      for (const item of b.items) lines.push(`${pad}    ${esc(item)},`);
      lines.push(`${pad}  ] },`);
    } else if (b.type === "table") {
      lines.push(`${pad}  { type: "table", headers: [${b.headers.map(esc).join(", ")}], rows: [`);
      for (const row of b.rows) lines.push(`${pad}    [${row.map(esc).join(", ")}],`);
      lines.push(`${pad}  ] },`);
    }
  }
  lines.push(`${pad}]`);
  return lines.join("\n");
}

let ts = `/** @deprecated PDF extract archive — not imported by the app. See product-detail-content.ts */

export type ProductDetailBlock =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

export type ProductDetailContent = {
  overview: ProductDetailBlock[];
  keyFeatures: ProductDetailBlock[];
  whatsIncluded: ProductDetailBlock[];
  subscriptionLicensing: ProductDetailBlock[];
};

export const PORTAL_PRODUCT_NAMES = [
  "AutoCAD",
  "Civil 3D",
  "AEC Collection",
  "AutoCAD LT",
  "AutoCAD Revit LT Suite",
  "3ds Max",
  "Navisworks Manage",
  "Revit",
] as const;

export const ADOBE_ORIGINAL_DETAIL_SLUGS = new Set([
  "adobe-business-creative-solutions",
  "creative-cloud-teams-education",
  "creative-cloud-enterprise-hed",
  "creative-cloud-enterprise",
  "adobe-acrobat-pro",
  "adobe-illustrator",
  "adobe-photoshop",
  "adobe-premiere-pro",
]);

const CONTENT: Record<string, ProductDetailContent> = {
`;

const ADOBE_ORIGINAL_DETAIL_SLUGS = new Set([
  "adobe-business-creative-solutions",
  "creative-cloud-teams-education",
  "creative-cloud-enterprise-hed",
  "creative-cloud-enterprise",
  "adobe-acrobat-pro",
  "adobe-illustrator",
  "adobe-photoshop",
  "adobe-premiere-pro",
]);

for (const [key, value] of [...bySlug.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (ADOBE_ORIGINAL_DETAIL_SLUGS.has(key)) continue;
  ts += `  ${esc(key)}: {\n`;
  ts += `    overview: ${emitBlocks(value.overview, 4).trimStart()},\n`;
  ts += `    keyFeatures: ${emitBlocks(value.keyFeatures, 4).trimStart()},\n`;
  ts += `    whatsIncluded: ${emitBlocks(value.whatsIncluded, 4).trimStart()},\n`;
  ts += `    subscriptionLicensing: ${emitBlocks(value.subscriptionLicensing, 4).trimStart()},\n`;
  ts += `  },\n`;
}

ts += `};

function normalizeName(label: string): string {
  return label.trim().toLowerCase().replace(/^\\([^)]*\\)\\s*/, "");
}

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const NAME_ALIASES: Record<string, string> = {
  autocad: "autocad",
  "civil 3d": "civil-3d",
  "aec collection": "aec-collection",
  "autocad lt": "autocad-lt",
  "autocad revit lt suite": "autocad-revit-lt-suite",
  "3ds max": "3ds-max",
  navisworks: "navisworks",
  "navisworks manage": "navisworks",
  revit: "revit",
  "oracle primavera p6": "oracle-primavera-p6",
  "power bi": "power-bi",
  "power bi pro": "power-bi",
  "microsoft visio": "microsoft-visio",
  "microsoft 365 business": "microsoft-365-business",
  "microsoft 365 business standard": "microsoft-365-business",
  "forma design collaboration": "bim-collaborate-pro",
  "bim collaborate pro": "bim-collaborate-pro",
};

function resolveContentKey(input: { productName: string; slug?: string }): string | undefined {
  if (input.slug && CONTENT[input.slug]) return input.slug;
  const byName = NAME_ALIASES[normalizeName(input.productName)] ?? slugify(input.productName);
  if (CONTENT[byName]) return byName;
  return undefined;
}

function genericFeatureBullets(productName: string): string[] {
  const lower = productName.toLowerCase();
  if (lower.includes("autocad") || lower.includes("revit") || lower.includes("civil")) {
    return ["2D & 3D design", "Industry toolsets", "Cloud collaboration", "Automation tools"];
  }
  if (lower.includes("adobe") || lower.includes("photoshop") || lower.includes("illustrator")) {
    return ["Creative workflows", "Cloud libraries", "Team collaboration", "Regular updates"];
  }
  if (lower.includes("microsoft") || lower.includes("365") || lower.includes("visio")) {
    return ["Business productivity", "Cloud sync", "Security & compliance", "Ongoing updates"];
  }
  return [
    "Genuine commercial licensing",
    "Publisher-backed support options",
    "Implementation and renewal assistance from Aptus",
    "Flexible subscription or perpetual terms where available",
  ];
}

export function buildGenericProductContent(
  productName: string,
  brandLabel: string,
  description?: string,
): ProductDetailContent {
  return {
    overview: [
      {
        type: "p",
        text:
          description ??
          \`\${productName} from \${brandLabel} is available through Aptus Infotech with genuine licensing, expert guidance, and local support in Oman.\`,
      },
    ],
    keyFeatures: [{ type: "ul", items: genericFeatureBullets(productName) }],
    whatsIncluded: [
      {
        type: "table",
        headers: ["Included Component", "Description", "Delivery Method"],
        rows: [
          ["Software license", \`Authorized \${productName} license or subscription as quoted.\`, "Electronic delivery (ELD)"],
          ["Publisher support", "Vendor support and updates per your license agreement.", "Vendor portal"],
          ["Aptus account management", "Quoting, provisioning, renewals, and billing support.", "Aptus customer portal"],
        ],
      },
    ],
    subscriptionLicensing: [
      {
        type: "table",
        headers: ["Licensing Option", "Description"],
        rows: [
          ["Commercial New", "For organizations adding new seats or starting a new agreement."],
          ["Renewal Subscription", "Extend an active contract without service interruption."],
          ["Term options", "Annual (12-month) and multi-year agreements where offered."],
          ["Delivery", "Electronic license delivery through Aptus with setup guidance."],
        ],
      },
    ],
  };
}

export function getProductDetailContent(
  productName: string,
  fallback?: { brandLabel: string; description?: string; slug?: string },
): ProductDetailContent {
  const slug =
    fallback?.slug ??
    NAME_ALIASES[normalizeName(productName)] ??
    slugify(productName);

  if (ADOBE_ORIGINAL_DETAIL_SLUGS.has(slug)) {
    return buildGenericProductContent(
      productName,
      fallback?.brandLabel ?? "Adobe",
      fallback?.description,
    );
  }

  const key = resolveContentKey({ productName, slug: fallback?.slug });
  if (key) return CONTENT[key];
  return buildGenericProductContent(
    productName,
    fallback?.brandLabel ?? "Software",
    fallback?.description,
  );
}

export function productDetailContentKeys(): string[] {
  return Object.keys(CONTENT);
}
`;

fs.writeFileSync(outFile, ts, "utf8");
console.log(`Wrote ${outFile}`);
console.log(`Products: ${bySlug.size}`);
console.log([...bySlug.keys()].sort().join("\n"));
console.log(`\nSkipped (no catalog match): ${allSkipped.length}`);
allSkipped.forEach((s) => console.log(`  - ${s}`));
