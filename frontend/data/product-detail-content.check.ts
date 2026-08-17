import assert from "node:assert/strict";
import {
  getProductDetailContent,
  PORTAL_PRODUCT_NAMES,
  productDetailContentKeys,
} from "./product-detail-content";

const keys = productDetailContentKeys();
assert.equal(keys.length, 8, `portal catalog expects 8 products, got ${keys.length}`);

for (const name of PORTAL_PRODUCT_NAMES) {
  const content = getProductDetailContent(name);
  assert.ok(content, `missing content for ${name}`);
  assert.ok(content!.overview.length > 0, `${name} overview empty`);
  assert.ok(content!.keyFeatures.length > 0, `${name} keyFeatures empty`);
  assert.ok(content!.whatsIncluded.length > 0, `${name} whatsIncluded empty`);
  assert.ok(content!.subscriptionLicensing.length > 0, `${name} subscriptionLicensing empty`);
  assert.equal(content!.whatsIncluded[0]?.type, "table", `${name} whatsIncluded must be a table`);
  assert.equal(
    content!.subscriptionLicensing[0]?.type,
    "table",
    `${name} subscriptionLicensing must be a table`,
  );
}

assert.equal(getProductDetailContent("Adobe Acrobat Pro"), null);
assert.equal(getProductDetailContent("Autodesk Build"), null);

const autocad = getProductDetailContent("AutoCAD")!;
assert.ok(
  autocad.whatsIncluded.some(
    (block) =>
      block.type === "table" &&
      block.rows.some((row) => row[0] === "Industry Toolsets (7 Packs)"),
  ),
  "AutoCAD should list industry toolsets under What's Included",
);

console.log(`product-detail-content.check: ok (${keys.length} portal products)`);
