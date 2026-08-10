/**
 * One-shot generator: parses the three product detailing .txt extracts and writes
 * frontend/data/product-detail-content.ts. Re-run after the source docs change.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outFile = path.join(root, "frontend/data/product-detail-content.ts");

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

/** Title line → catalog product name (or null to skip / attach-as-extra). */
const TITLE_RULES = [
  { re: /autocad\s*lt/i, catalog: "AutoCAD LT" },
  { re: /autocad\b(?!.*lt)/i, catalog: "AutoCAD" },
  { re: /civil\s*3d/i, catalog: "Civil 3D" },
  { re: /architecture engineering|aec collection/i, catalog: "AEC Collection" },
  { re: /3ds\s*max/i, catalog: "3ds Max" },
  { re: /forma design collaboration|bim collaborate pro/i, catalog: "BIM Collaborate Pro" },
  { re: /bim collaborate\s+cloud/i, catalog: "BIM Collaborate Pro", extraHeading: true },
  { re: /build\s*-\s*cloud|autodesk build/i, catalog: "Autodesk Build" },
  { re: /takeoff/i, catalog: "Autodesk Takeoff" },
  { re: /docs\s*-\s*user|autodesk docs/i, catalog: "Autodesk Docs" },
  { re: /navisworks manage/i, catalog: "Navisworks" },
  { re: /navisworks simulate/i, catalog: "Navisworks", extraHeading: true },
  { re: /revit/i, catalog: "Revit" },
  { re: /infodrainage/i, catalog: "InfoDrainage" },
  { re: /infowater/i, catalog: "InfoWater Pro" },
  { re: /infoworks icm.*standard|infoworks icm\s*-\s*standard/i, catalog: "InfoWorks ICM" },
  { re: /infoworks icm.*ultimate|infoworks icm\s*-\s*ultimate/i, catalog: "InfoWorks ICM", extraHeading: true },
  { re: /infoworks ws/i, catalog: "InfoWorks WS Pro" },
  { re: /acrobat pro/i, catalog: "Adobe Acrobat Pro" },
  { re: /premiere pro/i, catalog: "Adobe Premiere Pro" },
  { re: /primavera p6 professional/i, catalog: "Oracle Primavera P6" },
  { re: /primavera p6 enterprise/i, catalog: "Oracle Primavera P6", extraHeading: true },
  { re: /microsoft 365 apps for business/i, catalog: "Microsoft 365 Apps" },
  { re: /microsoft 365 business standard/i, catalog: "Microsoft 365 Business" },
  { re: /visio plan 2/i, catalog: "Microsoft Visio" },
  { re: /power bi pro(?!.*premium)/i, catalog: "Power BI" },
  // Documented but no portal product page — intentionally skipped:
  // PDMC, Fabrication CAMduct, InfraWorks, Inventor, M365 E3, Office 365 E1,
  // Exchange Kiosk, Teams Essentials, Planner, Defender, Teams Rooms, Planner Plan 1,
  // Power BI Premium, Windows 11, Office LTSC, Project Professional, Windows Server,
  // Software Update License, Copilot, Business Basic, etc.
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
      return { catalog: rule.catalog, extraHeading: Boolean(rule.extraHeading), titleLine };
    }
  }
  return null;
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

  const specifications = [];
  if (included.length) {
    specifications.push({ type: "h3", text: "What's Included" });
    specifications.push(...included);
  }
  if (licensing.length) {
    specifications.push({ type: "h3", text: "Subscription & Licensing Options" });
    specifications.push(...licensing);
  }

  return { overview, features, specifications };
}

function mergeExtra(existing, titleLine, parsed) {
  const heading = titleLine.replace(/^(?:Product Title\s*:|Product title\s*:|Project title\s*:|Product Detail\s*:|Product list\s*:|Product List\s*:)\s*/i, "").trim();
  const add = (tab, blocks) => {
    if (!blocks.length) return;
    existing[tab].push({ type: "h3", text: heading });
    existing[tab].push(...blocks);
  };
  // Extra SKUs (Simulate, Ultimate, EPPM, second BIM Collaborate) append under Specs to avoid overwriting primary Overview.
  add("specifications", [
    ...parsed.overview,
    ...parsed.features,
    ...parsed.specifications.filter((b) => b.type !== "h3" || !/^(What's Included|Subscription)/.test(b.text ?? "")),
  ]);
  // Also keep their Features/Included under Specs only — already flattened above.
  if (parsed.features.length) {
    /* already included */
  }
  return existing;
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

const byCatalog = new Map();
const allSkipped = [];

for (const file of files) {
  const { mapped, skipped } = processFile(file);
  allSkipped.push(...skipped);
  for (const entry of mapped) {
    const key = normalizeKey(entry.catalog);
    if (entry.extraHeading && byCatalog.has(key)) {
      byCatalog.set(key, mergeExtra(byCatalog.get(key), entry.titleLine, entry.parsed));
    } else if (!byCatalog.has(key) || !entry.extraHeading) {
      // Primary wins; don't overwrite primary with a later primary of same key unless empty
      if (!byCatalog.has(key)) {
        byCatalog.set(key, {
          productName: entry.catalog,
          overview: entry.parsed.overview,
          features: entry.parsed.features,
          specifications: entry.parsed.specifications,
          sourceTitle: entry.titleLine,
        });
      }
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

let ts = `/**
 * Portal product detail tab content (Overview / Features / Specifications).
 * Generated from the three product detailing documents in docx-tmp/.
 * Do not hand-edit product copy — re-run:
 *   node frontend/scripts/generate-product-detail-content.mjs
 */

export type ProductDetailBlock =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

export type ProductDetailContent = {
  overview: ProductDetailBlock[];
  features: ProductDetailBlock[];
  specifications: ProductDetailBlock[];
};

const CONTENT: Record<string, ProductDetailContent> = {
`;

for (const [key, value] of [...byCatalog.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  ts += `  ${esc(key)}: {\n`;
  ts += `    overview: ${emitBlocks(value.overview, 4).trimStart()},\n`;
  ts += `    features: ${emitBlocks(value.features, 4).trimStart()},\n`;
  ts += `    specifications: ${emitBlocks(value.specifications, 4).trimStart()},\n`;
  ts += `  },\n`;
}

ts += `};

function normalizeName(label: string): string {
  return label.trim().toLowerCase();
}

/** Returns document-backed detail content for a catalog product, or null if none. */
export function getProductDetailContent(productName: string): ProductDetailContent | null {
  return CONTENT[normalizeName(productName)] ?? null;
}

export function productDetailContentKeys(): string[] {
  return Object.keys(CONTENT);
}
`;

fs.writeFileSync(outFile, ts, "utf8");
console.log(`Wrote ${outFile}`);
console.log(`Products: ${byCatalog.size}`);
console.log(
  [...byCatalog.keys()].sort().join("\n"),
);
console.log(`\nSkipped (no catalog match): ${allSkipped.length}`);
allSkipped.forEach((s) => console.log(`  - ${s}`));
