/**
 * Self-check: calendar end date overrides Odoo "progress" for Expired.
 * Run: npx --yes tsx lib/server/odoo/subscriptions.check.ts
 */
import assert from "node:assert/strict";
import { subscriptionDisplayStatus } from "./subscriptions";

const past = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);
const soon = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
const far = new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10);

assert.equal(
  subscriptionDisplayStatus("3_progress", past, true),
  "Expired",
  "past end date must be Expired even when Odoo says progress",
);
assert.equal(subscriptionDisplayStatus("progress", past, true), "Expired");
assert.equal(subscriptionDisplayStatus("6_churn", far, true), "Cancelled");
assert.equal(subscriptionDisplayStatus("progress", far, true), "Active");
assert.equal(subscriptionDisplayStatus("progress", soon, true), "Expiring Soon");

console.log("subscriptions.check: ok");
