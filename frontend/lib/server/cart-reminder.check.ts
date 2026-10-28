import assert from "node:assert/strict";
import { formatCartReminderEmail } from "./order-notification";
import { CART_REMINDER_INTERVAL_MS, CART_REMINDER_MAX_COUNT } from "./portal-cart-store";

const mail = formatCartReminderEmail({
  customerName: "Test User",
  products: ["AutoCAD (Autodesk) × 1"],
  duration: "1year",
  continueUrl: "https://example.com/software-solutions#cart",
});

assert.equal(CART_REMINDER_INTERVAL_MS, 7 * 24 * 60 * 60 * 1000);
assert.equal(CART_REMINDER_MAX_COUNT, 2);
assert.match(mail.subject, /left something in your cart/i);
assert.match(mail.body, /Complete Your Purchase:/);
assert.match(mail.body, /portal\/products#cart/);
assert.match(mail.body, /AutoCAD \(Autodesk\) × 1/);

console.log("cart-reminder.check.ts OK");
