import assert from "node:assert/strict";
import { productSlugFromHref } from "@/data/software-purchase-catalog";
import {
  getProductDetailContent,
  PORTAL_PRODUCT_NAMES,
  productDetailContentKeys,
} from "./product-detail-content";

const keys = productDetailContentKeys();
assert.ok(keys.length >= 52, `expected at least 52 detail entries, got ${keys.length}`);

for (const name of PORTAL_PRODUCT_NAMES) {
  const slug =
    name === "Navisworks Manage"
      ? "navisworks"
      : productSlugFromHref(`/${name.toLowerCase().replace(/\s+/g, "-")}`);
  const content = getProductDetailContent(name, { brandLabel: "Autodesk", slug });
  assert.ok(content.overview.length > 0, `${name} overview empty`);
  assert.equal(content.keyFeatures[0]?.type, "ul", `${name} keyFeatures should be a list`);
  assert.ok(content.whatsIncluded.length > 0, `${name} whatsIncluded empty`);
  assert.ok(content.subscriptionLicensing.length > 0, `${name} subscriptionLicensing empty`);
  assert.ok(!JSON.stringify(content).includes("\uF0B7"), `${name} should not contain PDF bullet artifacts`);
}

const adobe = getProductDetailContent("Adobe Acrobat Pro", {
  brandLabel: "Adobe",
  slug: "adobe-acrobat-pro",
});
assert.ok(adobe.overview.length > 0);
assert.equal(adobe.keyFeatures[0]?.type, "ul");
assert.ok((adobe.keyFeatures[0]?.type === "ul" ? adobe.keyFeatures[0].items.length : 0) >= 3);
assert.ok(!JSON.stringify(adobe).includes("-- 1 of 23 --"));

const microsoft = getProductDetailContent("Microsoft 365 Apps", {
  brandLabel: "Microsoft",
  slug: "microsoft-365-apps",
  description: "Cloud productivity apps for business teams.",
});
assert.equal(microsoft.keyFeatures[0]?.type, "ul");
assert.ok(!JSON.stringify(microsoft).includes("\uF0B7"));

console.log(`product-detail-content.check: ok (${keys.length} products with detail content)`);
