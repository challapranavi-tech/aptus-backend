import assert from "node:assert/strict";
import { getProductDetailContent, productDetailContentKeys } from "./product-detail-content";

const keys = productDetailContentKeys();
assert.ok(keys.length >= 20, `expected mapped products, got ${keys.length}`);

const samples = [
  "AutoCAD",
  "AutoCAD LT",
  "Revit",
  "Adobe Acrobat Pro",
  "Adobe Premiere Pro",
  "Oracle Primavera P6",
  "Microsoft 365 Apps",
  "Power BI",
  "Navisworks",
  "InfoWorks ICM",
] as const;

for (const name of samples) {
  const content = getProductDetailContent(name);
  assert.ok(content, `missing content for ${name}`);
  assert.ok(content!.overview.length > 0, `${name} overview empty`);
  assert.ok(content!.features.length > 0, `${name} features empty`);
  assert.ok(content!.specifications.length > 0, `${name} specifications empty`);
}

// Products outside the three docs must not get invented content.
assert.equal(getProductDetailContent("Enscape"), null);
assert.equal(getProductDetailContent("SonicWall Next-Gen Firewall"), null);

const autocad = getProductDetailContent("AutoCAD")!;
assert.ok(
  autocad.specifications.some(
    (b) => b.type === "table" && b.rows.some((row) => row[0] === "Architecture"),
  ),
  "AutoCAD specs should include toolset table",
);

console.log(`product-detail-content.check: ok (${keys.length} products)`);
