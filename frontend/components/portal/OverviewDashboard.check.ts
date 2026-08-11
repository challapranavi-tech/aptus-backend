/**
 * Self-check: the Dashboard "Recent Orders" badge must not claim a payment was
 * submitted ("Pending verification") for an order that only reached the payment
 * step but hasn't had proof uploaded yet (status "Submitted" / paymentStatus "pending").
 */
import assert from "node:assert/strict";
import { orderRowStatusLabel, orderRowStatusTone } from "../../lib/order-status";

assert.equal(orderRowStatusLabel("Submitted"), "Awaiting payment");
assert.notEqual(orderRowStatusLabel("Submitted"), "Pending verification");
assert.equal(orderRowStatusLabel("Approved"), "Approved");
assert.equal(orderRowStatusLabel("Pending verification"), "Pending verification");
assert.equal(orderRowStatusLabel("License issued"), "License issued");
assert.equal(orderRowStatusLabel("Completed"), "License issued");
assert.equal(orderRowStatusLabel("Rejected"), "Rejected");

assert.equal(orderRowStatusTone("Submitted"), "processing");
assert.equal(orderRowStatusTone("License issued"), "completed");
assert.equal(orderRowStatusTone("Rejected"), "rejected");

console.log("OverviewDashboard.check: ok");
