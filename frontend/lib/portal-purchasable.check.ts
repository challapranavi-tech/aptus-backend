import assert from "node:assert/strict";
import {
  filterPortalPurchasableCartItems,
  isPortalPurchasableLineItem,
  isPortalPurchasableProductName,
  PORTAL_PURCHASABLE_PRODUCT_COUNT,
} from "./portal-purchasable";
import { isPortalPurchasableProduct } from "../data/software-full-catalog";

assert.equal(PORTAL_PURCHASABLE_PRODUCT_COUNT, 8);

assert.equal(isPortalPurchasableProduct("/autocad"), true);
assert.equal(isPortalPurchasableProduct("/revit"), true);
assert.equal(isPortalPurchasableProduct("/adobe-photoshop"), false);
assert.equal(isPortalPurchasableProduct("/fabrication-camduct"), false);

assert.equal(isPortalPurchasableProductName("AutoCAD"), true);
assert.equal(isPortalPurchasableProductName("Navisworks Manage"), true);
assert.equal(isPortalPurchasableProductName("Adobe Photoshop"), false);
assert.equal(isPortalPurchasableProductName("Microsoft 365 E3"), false);

assert.equal(
  filterPortalPurchasableCartItems([
    { productName: "AutoCAD", category: "Autodesk", quantity: 1 },
    { productName: "Adobe Photoshop", category: "Adobe", quantity: 1 },
  ]).length,
  1,
);

assert.equal(
  isPortalPurchasableLineItem({ productName: "Civil 3D", category: "Autodesk" }),
  true,
);

console.log("portal-purchasable.check: ok");
