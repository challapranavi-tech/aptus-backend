import assert from "node:assert/strict";
import { productSlugFromHref } from "@/data/software-purchase-catalog";
import {
  getProductDetailContent,
  PORTAL_PRODUCT_NAMES,
  productDetailContentKeys,
} from "./product-detail-content";

const keys = productDetailContentKeys();
assert.ok(keys.length >= 40, `expected at least 40 PDF-backed products, got ${keys.length}`);

for (const name of PORTAL_PRODUCT_NAMES) {
  const slug =
    name === "Navisworks Manage"
      ? "navisworks"
      : productSlugFromHref(`/${name.toLowerCase().replace(/\s+/g, "-")}`);
  const content = getProductDetailContent(name, { brandLabel: "Autodesk", slug });
  assert.ok(content.overview.length > 0, `${name} overview empty`);
  assert.ok(content.keyFeatures.length > 0, `${name} keyFeatures empty`);
  assert.ok(content.whatsIncluded.length > 0, `${name} whatsIncluded empty`);
  assert.ok(content.subscriptionLicensing.length > 0, `${name} subscriptionLicensing empty`);
}

const adobe = getProductDetailContent("Adobe Acrobat Pro", {
  brandLabel: "Adobe",
  slug: "adobe-acrobat-pro",
});
assert.ok(adobe.overview.length > 0);
assert.ok(!adobe.overview[0]!.text.includes("available through Aptus Infotech with genuine licensing"));

const p6 = getProductDetailContent("Oracle Primavera P6", {
  brandLabel: "Oracle",
  slug: "oracle-primavera-p6",
});
assert.ok(p6.overview.some((b) => b.type === "p" && b.text.toLowerCase().includes("primavera")));

console.log(`product-detail-content.check: ok (${keys.length} PDF-backed products)`);
