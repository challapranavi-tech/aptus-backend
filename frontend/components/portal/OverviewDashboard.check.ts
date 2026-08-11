/**
 * Dashboard row labels must not claim payment proof was
 * submitted ("Payment Verification Pending") for an order that only reached the payment
 * step (Submitted / Awaiting payment).
 */
import assert from "node:assert/strict";
import { orderRowStatusLabel, orderRowStatusTone } from "../../lib/order-status";

assert.equal(orderRowStatusLabel("Submitted"), "Awaiting payment");
assert.notEqual(orderRowStatusLabel("Submitted"), "Payment Verification Pending");
assert.equal(orderRowStatusLabel("Approved"), "Approved");
assert.equal(orderRowStatusLabel("Payment Verification Pending"), "Payment Verification Pending");
assert.equal(orderRowStatusLabel("Payment Verified"), "Payment Verified");
assert.equal(orderRowStatusLabel("License Issued"), "License Issued");
assert.equal(orderRowStatusLabel("Completed"), "License Issued");
assert.equal(orderRowStatusLabel("Rejected"), "Rejected");

assert.equal(orderRowStatusTone("License Issued"), "completed");

console.log("OverviewDashboard.check: ok");
