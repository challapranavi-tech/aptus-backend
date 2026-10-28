/**
 * Trim portal product detail content to 8 products with 4-tab structure.
 * Run: npx tsx frontend/scripts/migrate-portal-products.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentPath = path.join(__dirname, "../data/product-detail-content.ts");

const PORTAL_PRODUCTS = [
  { key: "autocad", label: "AutoCAD" },
  { key: "revit", label: "Revit" },
  { key: "civil 3d", label: "Civil 3D" },
  { key: "autodesk build", label: "Autodesk Build" },
  { key: "adobe acrobat pro", label: "Adobe Acrobat Pro" },
  { key: "microsoft 365 business", label: "Microsoft 365 Business" },
  { key: "power bi", label: "Power BI" },
  { key: "oracle primavera p6", label: "Oracle Primavera P6" },
];

function splitSpecifications(specifications) {
  const whatsIncluded = [];
  const subscriptionLicensing = [];
  let section = "none";
  for (const block of specifications) {
    if (block.type === "h3" && block.text === "What's Included") {
      section = "included";
      continue;
    }
    if (block.type === "h3" && block.text === "Subscription & Licensing Options") {
      section = "licensing";
      continue;
    }
    if (section === "included") whatsIncluded.push(block);
    if (section === "licensing") subscriptionLicensing.push(block);
  }
  return { whatsIncluded, subscriptionLicensing };
}

function formatBlock(block, indent) {
  const pad = "  ".repeat(indent);
  if (block.type === "p" || block.type === "h3") {
    return `${pad}{ type: "${block.type}", text: ${JSON.stringify(block.text)} }`;
  }
  if (block.type === "ul") {
    const items = block.items.map((item) => JSON.stringify(item)).join(", ");
    return `${pad}{ type: "ul", items: [\n${block.items.map((item) => `${pad}  ${JSON.stringify(item)}`).join(",\n")}\n${pad}] }`;
  }
  const rows = block.rows
    .map(
      (row) =>
        `${pad}  [${row.map((cell) => JSON.stringify(cell)).join(", ")}]`,
    )
    .join(",\n");
  return `${pad}{ type: "table", headers: [${block.headers.map((h) => JSON.stringify(h)).join(", ")}], rows: [\n${rows}\n${pad}] }`;
}

function formatBlocks(blocks, indent) {
  if (!blocks.length) return "[]";
  return `[\n${blocks.map((block) => formatBlock(block, indent + 1)).join(",\n")}\n${"  ".repeat(indent)}]`;
}

function formatProduct(key, product) {
  const pad = "  ";
  return `${pad}${JSON.stringify(key)}: {
${pad}  overview: ${formatBlocks(product.overview, 2)},
${pad}  keyFeatures: ${formatBlocks(product.keyFeatures, 2)},
${pad}  whatsIncluded: ${formatBlocks(product.whatsIncluded, 2)},
${pad}  subscriptionLicensing: ${formatBlocks(product.subscriptionLicensing, 2)},
${pad}}`;
}

const mod = await import("../data/product-detail-content.ts");
const migrated = {};

for (const { key, label } of PORTAL_PRODUCTS) {
  const legacy = mod.getProductDetailContent(label);
  if (!legacy?.overview?.length) {
    throw new Error(`Missing legacy content for ${label}`);
  }
  const { whatsIncluded, subscriptionLicensing } = splitSpecifications(legacy.specifications ?? []);
  migrated[key] = {
    overview: legacy.overview,
    keyFeatures: legacy.features ?? [],
    whatsIncluded,
    subscriptionLicensing,
  };
}

const productEntries = Object.entries(migrated)
  .map(([key, product]) => formatProduct(key, product))
  .join(",\n");

const tsContent = `/**
 * Portal product detail tab content — 8 curated products.
 * Tabs: Overview · Key Features · What's Included · Subscription and Licensing Options
 */

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

const CONTENT: Record<string, ProductDetailContent> = {
${productEntries}
};

function normalizeName(label: string): string {
  return label.trim().toLowerCase();
}

export function getProductDetailContent(productName: string): ProductDetailContent | null {
  return CONTENT[normalizeName(productName)] ?? null;
}

export function productDetailContentKeys(): string[] {
  return Object.keys(CONTENT);
}
`;

fs.writeFileSync(contentPath, tsContent);
console.log(`Wrote ${PORTAL_PRODUCTS.length} portal products to ${contentPath}`);
