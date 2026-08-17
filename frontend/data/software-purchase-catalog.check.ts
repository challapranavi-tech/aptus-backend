import assert from "node:assert/strict";
import {
  SOFTWARE_PURCHASE_CATALOG,
  getPurchaseProductImage,
  lookupPortalSku,
  lookupPurchaseProductBySlug,
  portalProductDetailHref,
  portalProductsHref,
  productSlugFromHref,
} from "./software-purchase-catalog";

const products = SOFTWARE_PURCHASE_CATALOG.flatMap((category) => category.products);
assert.equal(products.length, 8, "portal catalog must expose exactly 8 products");

for (const category of SOFTWARE_PURCHASE_CATALOG) {
  for (const product of category.products) {
    assert.ok(product.partNumber, `${product.name} missing partNumber`);
    assert.ok(
      typeof product.price1Year === "number" && product.price1Year > 0,
      `${product.name} missing demo price`,
    );
  }
}

assert.ok(getPurchaseProductImage("/autocad")?.includes("/assets/autodesk/"));

const autocad = lookupPurchaseProductBySlug("autocad");
assert.ok(autocad?.product.name.toLowerCase().includes("autocad"));
assert.equal(autocad?.product.partNumber, "C1RK1-WW1762-L158");
assert.equal(autocad?.product.price1Year, 752.7);
assert.equal(lookupPortalSku("AutoCAD", "3year", "renew")?.partNumber, "C1RK1-008819-L706");
assert.equal(lookupPortalSku("AutoCAD", "3year", "renew")?.price, 2146.16);
assert.equal(lookupPortalSku("AutoCAD LT", "3year", "renew")?.price, 561.63);
assert.equal(productSlugFromHref(autocad!.product.href), "autocad");
assert.match(portalProductDetailHref(autocad!.product), /^\/portal\/products\/autocad$/);

assert.equal(portalProductsHref(), "/portal/products");
assert.equal(portalProductsHref("autodesk"), "/portal/products?category=autodesk");
const revit = lookupPurchaseProductBySlug("revit");
assert.ok(revit);
assert.equal(portalProductsHref(revit!.category.id), "/portal/products?category=autodesk");

console.log("software-purchase-catalog.check: ok");
