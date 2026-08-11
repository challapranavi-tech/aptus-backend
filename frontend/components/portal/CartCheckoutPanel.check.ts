import assert from "node:assert/strict";
import { normalizePhone } from "../../lib/phone";

// Checkout still depends on shared normalizePhone for the reported duplicate.
assert.equal(normalizePhone("+968+96899999994"), "+96899999994");
assert.equal(normalizePhone("+968+968 12345678"), "+968 12345678");

console.log("CartCheckoutPanel.normalizePhone.check: ok");
