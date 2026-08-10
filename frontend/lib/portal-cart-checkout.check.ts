import assert from "node:assert/strict";
import {
  cartLineTotal,
  cartLineUnitPrice,
  CHECKOUT_STEPS,
  checkoutStepperIndex,
  durationLabel,
  estimateCartPricing,
  lineConfigSummary,
  productInitials,
  purchaseTypeLabel,
  resolveLineDuration,
} from "./portal-cart-checkout";

assert.equal(durationLabel("1year"), "Annual");
assert.equal(durationLabel("3year"), "3 Years");
assert.equal(purchaseTypeLabel("new"), "New Purchase");
assert.equal(purchaseTypeLabel("renew"), "Renew");
assert.equal(checkoutStepperIndex("cart"), 1);
assert.equal(checkoutStepperIndex("checkout"), 2);
assert.equal(checkoutStepperIndex("checkout", true), 3);
assert.equal(CHECKOUT_STEPS.length, 3);
assert.equal(productInitials("AutoCAD"), "AU");
assert.equal(productInitials("Revit"), "RE");
assert.equal(resolveLineDuration({ category: "CAD", productName: "X", quantity: 1 }, "1year"), "1year");
assert.equal(
  resolveLineDuration({ category: "CAD", productName: "X", quantity: 1, duration: "3year" }, "1year"),
  "3year",
);

const item = { category: "Autodesk", productName: "AutoCAD", quantity: 2 };
const unit = cartLineUnitPrice(item, "1year");
assert.ok(unit >= 0);
assert.equal(cartLineTotal(item, "1year"), unit * 2);

// A line term picked in the cart must win over the cart-level term.
assert.equal(
  cartLineUnitPrice({ ...item, duration: "3year" }, "1year"),
  cartLineUnitPrice(item, "3year"),
);

const pricing = estimateCartPricing({
  duration: "1year",
  items: [{ category: "Autodesk", productName: "AutoCAD", quantity: 1 }],
});
assert.ok(pricing);
assert.ok(pricing!.total >= 0);

// Renewal product summary includes duration + license type but no package when unconfigured.
assert.equal(
  lineConfigSummary({ category: "Autodesk", productName: "AutoCAD", quantity: 1, purchaseType: "renew" }, "3year"),
  "3 Years · Renew",
);

// Renewal product configured with packages (Revit) adds the package to price + summary.
const revitBase = cartLineUnitPrice({ category: "Autodesk", productName: "Revit", quantity: 1 }, "1year");
const revitEnterprise = cartLineUnitPrice(
  { category: "Autodesk", productName: "Revit", quantity: 1, packageId: "enterprise" },
  "1year",
);
assert.ok(revitEnterprise > revitBase);
assert.equal(
  lineConfigSummary({ category: "Autodesk", productName: "Revit", quantity: 1, packageId: "enterprise" }, "1year"),
  "Annual · New Purchase · Enterprise",
);

// Levels product ignores duration/purchaseType and prices by level instead.
const acrobatLevel1 = cartLineUnitPrice(
  { category: "Adobe", productName: "Adobe Acrobat Pro", quantity: 1, levelId: "level-1" },
  "1year",
);
const acrobatLevel3 = cartLineUnitPrice(
  { category: "Adobe", productName: "Adobe Acrobat Pro", quantity: 1, levelId: "level-3" },
  "1year",
);
assert.ok(acrobatLevel3 > acrobatLevel1);
assert.equal(
  lineConfigSummary({ category: "Adobe", productName: "Adobe Acrobat Pro", quantity: 1, levelId: "level-2" }),
  "Level 2",
);

// Bundle product is quantity-only: duration/purchaseType/package never change its price.
const bundleItem = { category: "Oracle", productName: "Oracle Primavera P6", quantity: 3 };
assert.equal(
  cartLineUnitPrice(bundleItem, "1year"),
  cartLineUnitPrice({ ...bundleItem, duration: "3year", purchaseType: "renew" }, "3year"),
);
assert.equal(lineConfigSummary(bundleItem), "Bundle");

console.log("portal-cart-checkout.check: ok");
