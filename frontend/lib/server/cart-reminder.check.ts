import assert from "node:assert/strict";
import { formatCartReminderEmail } from "./order-notification";
import { CART_REMINDER_INTERVAL_MS } from "./portal-cart-store";

const mail = formatCartReminderEmail({
  customerName: "Test User",
  products: ["AutoCAD (Autodesk) × 1"],
  duration: "1year",
  continueUrl: "https://example.com/portal/products#cart",
});

assert.equal(CART_REMINDER_INTERVAL_MS, 15 * 24 * 60 * 60 * 1000);
assert.match(mail.subject, /Complete your purchase/i);
assert.match(mail.body, /Continue purchase:/);
assert.match(mail.body, /portal\/products#cart/);
assert.match(mail.body, /AutoCAD \(Autodesk\) × 1/);

console.log("cart-reminder.check.ts OK");
