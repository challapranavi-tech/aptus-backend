import assert from "node:assert/strict";
import {
  SOFTWARE_PURCHASE_CATALOG,
  getPurchaseProductImage,
  lookupPurchaseProductBySlug,
  portalProductDetailHref,
  productSlugFromHref,
} from "./software-purchase-catalog";

assert.ok(SOFTWARE_PURCHASE_CATALOG.length > 0);

for (const category of SOFTWARE_PURCHASE_CATALOG) {
  for (const product of category.products) {
    assert.ok(product.partNumber, `${product.name} missing partNumber`);
    assert.ok(
      typeof product.price1Year === "number" && product.price1Year > 0,
      `${product.name} missing demo price`,
    );
  }
}

const info = SOFTWARE_PURCHASE_CATALOG.flatMap((c) => c.products).find(
  (p) => p.name === "InfoDrainage",
);
assert.equal(info?.partNumber, "C68Q1-WW3740-L562");
assert.equal(info?.price1Year, 520);
assert.ok(getPurchaseProductImage("/autocad")?.includes("/assets/autodesk/"));
assert.ok(getPurchaseProductImage("/adobe-photoshop"));

const autocad = lookupPurchaseProductBySlug("autocad");
assert.ok(autocad?.product.name.toLowerCase().includes("autocad"));
assert.equal(productSlugFromHref(autocad!.product.href), "autocad");
assert.match(portalProductDetailHref(autocad!.product), /^\/portal\/products\/autocad$/);

console.log("software-purchase-catalog.check: ok");
