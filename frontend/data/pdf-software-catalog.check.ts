import assert from "node:assert/strict";
import { allFullCatalogProductSlugs, lookupFullCatalogProductBySlug } from "./software-full-catalog";
import {
  PDF_ADOBE_LEVEL_PRODUCTS,
  PDF_AUTODESK_RENEWAL_PRODUCTS,
  PDF_MICROSOFT_BUNDLE_PRODUCTS,
  PDF_ORACLE_BUNDLE_PRODUCTS,
  PDF_WATER_INFRASTRUCTURE_PRODUCTS,
} from "./pdf-software-catalog";
import { productSlugFromHref } from "./software-purchase-catalog";

const PDF_LINKS = [
  ...PDF_AUTODESK_RENEWAL_PRODUCTS,
  ...PDF_WATER_INFRASTRUCTURE_PRODUCTS,
  ...PDF_ADOBE_LEVEL_PRODUCTS,
  ...PDF_ORACLE_BUNDLE_PRODUCTS,
  ...PDF_MICROSOFT_BUNDLE_PRODUCTS,
];

for (const link of PDF_LINKS) {
  const slug = productSlugFromHref(link.href);
  const found = lookupFullCatalogProductBySlug(slug);
  assert.ok(found, `PDF product missing from catalog: ${link.label} (${slug})`);
  assert.equal(found.product.name, link.label, `Catalog label mismatch for ${slug}`);
}

assert.ok(PDF_LINKS.length >= 47, `expected at least 47 PDF catalog products, got ${PDF_LINKS.length}`);
assert.ok(allFullCatalogProductSlugs().length >= PDF_LINKS.length);

console.log(`pdf-software-catalog.check: ok (${PDF_LINKS.length} PDF products in catalog)`);
