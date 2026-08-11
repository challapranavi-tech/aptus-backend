/**
 * Self-check: a purchase is only recorded after payment proof is accepted.
 *
 * Checkout (/api/orders/place) must not create a sale order, promote the CRM cart
 * journey, email the sales inbox, or spend the cart — all of that belongs to the
 * payment step, after savePaymentProofFile succeeds.
 *
 * Run: npx --yes tsx --tsconfig tsconfig.json lib/server/purchase-after-payment.check.ts
 */
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { cartBelongsToOrder } from "./portal-cart-store";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../app");
const read = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");

const place = read("api/orders/place/route.ts");
const payment = read("api/orders/[id]/bank-transfer/route.ts");

// 1. Checkout records no purchase and keeps the cart payable again on failure.
for (const forbidden of [
  "createPortalSaleOrderWithLines",
  "promoteCartLeadToProductOrder",
  "sendPortalEmail",
  "clearStoredPortalCart",
]) {
  assert.equal(
    place.includes(forbidden),
    false,
    `/api/orders/place must not call ${forbidden} before payment`,
  );
}

// 2. Every purchase side effect happens after the proof is stored.
const proofStored = payment.indexOf("await savePaymentProofFile(");
assert.ok(proofStored > 0, "payment step must store the proof");
for (const sideEffect of [
  "promoteCartLeadToProductOrder",
  "createBankTransferSaleOrder",
  "markPartnerOrderPaymentPending",
  "clearStoredPortalCart",
  "sendPortalEmail",
  "createPortalNotification",
]) {
  const at = payment.indexOf(`${sideEffect}(`, proofStored);
  assert.ok(at > proofStored, `${sideEffect} must run only after the proof is stored`);
}

// 3. Cart lines are used only for the order they were prepared for.
const cart = { items: [{ category: "Software", productName: "AutoCAD", quantity: 4 }], crmLeadId: 1228 };
assert.equal(cartBelongsToOrder(cart, { leadId: 1228 }), true);
assert.equal(cartBelongsToOrder(cart, { leadId: 1301 }), false, "another order must not take this cart");
assert.equal(
  cartBelongsToOrder(cart, { leadId: 1228, saleOrderId: 55 }),
  false,
  "an order that already has a sale order owns its own lines",
);
assert.equal(cartBelongsToOrder(cart, {}), false);
assert.equal(cartBelongsToOrder(null, { leadId: 1228 }), false);
assert.equal(cartBelongsToOrder({ items: [], crmLeadId: 1228 }, { leadId: 1228 }), false);

console.log("purchase-after-payment.check: ok");
