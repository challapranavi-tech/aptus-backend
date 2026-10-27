import assert from "node:assert/strict";
import {
  brandIdFromPageSlug,
  isCatalogBrowseAction,
  parseCatalogBrandIds,
  resolveSoftwareCatalogHref,
  softwareBrandsHref,
  softwareCatalogHref,
  withBrandExploreProductsAction,
} from "./software-catalog-links.ts";

assert.equal(isCatalogBrowseAction("#Products", "Browse Products"), true);
assert.equal(isCatalogBrowseAction("#Software", "Explore Software"), true);
assert.equal(isCatalogBrowseAction("/autocad", "Browse Products"), false);

assert.equal(brandIdFromPageSlug("autodesk"), "autodesk");
assert.equal(brandIdFromPageSlug("autocad"), "autodesk");
assert.equal(brandIdFromPageSlug("rib-costx"), "costx");
assert.equal(brandIdFromPageSlug("fortinet"), "fortinet");

assert.equal(softwareCatalogHref("adobe"), "/software-solutions/products?brand=adobe");
assert.equal(
  softwareCatalogHref(["adobe", "microsoft"]),
  "/software-solutions/products?brand=adobe,microsoft",
);
assert.equal(softwareBrandsHref(), "/software-solutions/brands");
assert.deepEqual(parseCatalogBrandIds("adobe,microsoft"), ["adobe", "microsoft"]);
assert.deepEqual(parseCatalogBrandIds("adobe+microsoft"), ["adobe", "microsoft"]);
assert.deepEqual(parseCatalogBrandIds(null), []);
assert.equal(
  resolveSoftwareCatalogHref("microsoft", "#Products", "Browse Products"),
  "/software-solutions/products?brand=microsoft",
);
assert.equal(
  resolveSoftwareCatalogHref("autocad", "#Products", "Browse Products"),
  "/software-solutions/products?brand=autodesk",
);

const microsoftActions = withBrandExploreProductsAction("microsoft", [
  { label: "Contact sales", href: "/contact", tone: "green" },
  { label: "Browse Products", href: "#Products", tone: "blue" },
]);
assert.equal(microsoftActions[0]?.label, "Explore products");
assert.equal(microsoftActions[0]?.href, "/software-solutions/products?brand=microsoft");
assert.equal(microsoftActions.length, 2);
assert.equal(microsoftActions[1]?.label, "Contact sales");

assert.deepEqual(withBrandExploreProductsAction("not-a-brand", [{ label: "X", href: "/" }]), [
  { label: "X", href: "/" },
]);

console.log("software-catalog-links.check.ts passed");
