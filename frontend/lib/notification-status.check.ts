import assert from "node:assert/strict";
import {
  isActionRequiredNotification,
  notificationStatusClass,
  notificationStatusLabel,
} from "./notification-status";

assert.equal(notificationStatusLabel("Action Required"), "Payment Verification Pending");
assert.equal(notificationStatusLabel("Payment Verification Pending"), "Payment Verification Pending");
assert.equal(notificationStatusLabel("Confirmed", "purchase_approved"), "Payment Verified");
assert.equal(notificationStatusLabel("Confirmed", "license_available"), "License Issued");
assert.equal(notificationStatusLabel("Payment Verified"), "Payment Verified");
assert.equal(notificationStatusLabel("License Issued"), "License Issued");
assert.equal(notificationStatusClass("License Issued"), "aptus-status--delivered");
assert.equal(notificationStatusClass("Payment Verification Pending"), "aptus-status--pending");
assert.ok(isActionRequiredNotification("Action Required"));
assert.ok(isActionRequiredNotification("Payment Verification Pending"));
assert.equal(isActionRequiredNotification("Payment Verified"), false);

console.log("notification-status.check: ok");
