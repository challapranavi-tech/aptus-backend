import assert from "node:assert/strict";
import { parseProductOrderLeadItems, productOrderLeadName } from "./leads";

assert.equal(productOrderLeadName(["Prokon"]), "Portal software order: Prokon");
assert.equal(
  productOrderLeadName([{ productName: "Prokon", quantity: 4 }]),
  "Portal software order: Prokon ×4",
);
assert.equal(
  productOrderLeadName([
    { productName: "Prokon", quantity: 4 },
    { productName: "AutoCAD", quantity: 1 },
  ]),
  "Portal software order: Prokon ×4, AutoCAD",
);

assert.deepEqual(parseProductOrderLeadItems("Portal software order: Prokon ×4"), [
  { productName: "Prokon", quantity: 4 },
]);
assert.deepEqual(parseProductOrderLeadItems("Portal software order: Prokon"), [
  { productName: "Prokon", quantity: 1 },
]);
assert.deepEqual(
  parseProductOrderLeadItems("Portal software order: Prokon ×4, AutoCAD ×2"),
  [
    { productName: "Prokon", quantity: 4 },
    { productName: "AutoCAD", quantity: 2 },
  ],
);

console.log("leads.product-order-qty.check: ok");
