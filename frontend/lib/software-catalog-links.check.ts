import assert from "node:assert/strict";
import {
  brandIdFromPageSlug,
  isCatalogBrowseAction,
  resolveSoftwareCatalogHref,
  softwareCatalogHref,
} from "./software-catalog-links.ts";

assert.equal(isCatalogBrowseAction("#Products", "Browse Products"), true);
assert.equal(isCatalogBrowseAction("#Software", "Explore Software"), true);
assert.equal(isCatalogBrowseAction("/autocad", "Browse Products"), false);

assert.equal(brandIdFromPageSlug("autodesk"), "autodesk");
assert.equal(brandIdFromPageSlug("autocad"), "autodesk");
assert.equal(brandIdFromPageSlug("rib-costx"), "costx");
assert.equal(brandIdFromPageSlug("fortinet"), "fortinet");

assert.equal(softwareCatalogHref("adobe"), "/software-solutions?brand=adobe#software-catalog");
assert.equal(
  resolveSoftwareCatalogHref("microsoft", "#Products", "Browse Products"),
  "/software-solutions?brand=microsoft#software-catalog",
);
assert.equal(
  resolveSoftwareCatalogHref("autocad", "#Products", "Browse Products"),
  "/software-solutions?brand=autodesk#software-catalog",
);

console.log("software-catalog-links.check.ts passed");
