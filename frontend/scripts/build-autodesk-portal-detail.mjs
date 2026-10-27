import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcPath = path.join(root, "scripts/_orig-product-detail.ts");
const outPath = path.join(root, "data/product-detail-autodesk-portal.ts");

if (!fs.existsSync(srcPath)) {
  console.error("Missing scripts/_orig-product-detail.ts — run git show first");
  process.exit(1);
}

let src = fs.readFileSync(srcPath, "utf8");
const start = src.indexOf("const CONTENT");
const end = src.indexOf("function genericFeatureBullets");
if (start === -1 || end === -1) {
  console.error("Could not locate CONTENT block in source file");
  process.exit(1);
}
const body = src.slice(start, end).trimEnd().replace(/\s*$/, "");
const bodyFixed = body.endsWith("};") ? body : `${body}\n};`;

const keyMap = [
  [/^\s+"civil 3d":/m, '  "civil-3d":'],
  [/^\s+"aec collection":/m, '  "aec-collection":'],
  [/^\s+"autocad lt":/m, '  "autocad-lt":'],
  [/^\s+"autocad revit lt suite":/m, '  "autocad-revit-lt-suite":'],
  [/^\s+"3ds max":/m, '  "3ds-max":'],
  [/^\s+"navisworks manage":/m, '  "navisworks":'],
];

let mapped = bodyFixed
  .replace("const CONTENT", "export const PORTAL_AUTODESK_DETAIL_CONTENT")
  .replace(/┬«/g, "®")
  .replace(/ΓÇö/g, "—");

for (const [from, to] of keyMap) {
  mapped = mapped.replace(from, to);
}

const out = `import { buildProductContent, type ProductDetailContent } from "./product-detail-content";

${mapped}

export const PORTAL_AUTODESK_DETAIL_SLUGS = new Set<string>(
  Object.keys(PORTAL_AUTODESK_DETAIL_CONTENT),
);
`;

fs.writeFileSync(outPath, out, "utf8");
console.log("Wrote", outPath);
