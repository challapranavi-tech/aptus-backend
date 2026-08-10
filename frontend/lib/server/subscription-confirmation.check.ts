import assert from "node:assert/strict";
import {
  orderNotificationAliases,
  orderNotificationClaimRef,
} from "./subscription-confirmation";

assert.equal(
  orderNotificationClaimRef({ reference: "LEAD-1211", leadId: 1211 }),
  "LEAD-1211",
);
assert.equal(
  orderNotificationClaimRef({ reference: "SO-99", saleOrderId: 99, leadId: 1211 }),
  "LEAD-1211",
  "linked SO must share the lead claim so Purchase Approved is not sent twice",
);
assert.equal(
  orderNotificationClaimRef({ reference: "SO-99", saleOrderId: 99 }),
  "SO-99",
);

const aliases = orderNotificationAliases({
  id: "odoo-so-99",
  reference: "SO-99",
  saleOrderId: 99,
  leadId: 1211,
});
assert.ok(aliases.includes("LEAD-1211"));
assert.ok(aliases.includes("SO-99"));
assert.ok(aliases.includes("odoo-so-99"));

console.log("subscription-confirmation.check: ok");
