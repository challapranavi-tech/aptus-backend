/**
 * Active Licenses card must count CRM "License Issued" orders when keyed
 * subscriptions have not landed yet.
 * Run: npx --yes tsx lib/overview-data.check.ts
 */
import assert from "node:assert/strict";
import { countActiveLicenses } from "./overview-data";
import type { PortalOrder } from "@/types/orders";
import type { SubscriptionItem } from "@/types/subscriptions";

function order(partial: Partial<PortalOrder>): PortalOrder {
  return {
    id: "o1",
    reference: "APT-1",
    actorId: "u1",
    partnerId: 1,
    status: "Completed",
    duration: "1year",
    items: [{ category: "Software", productName: "Kaspersky", quantity: 1 }],
    createdAt: "2026-08-11T00:00:00.000Z",
    updatedAt: "2026-08-11T00:00:00.000Z",
    paymentStatus: "paid",
    ...partial,
  };
}

function sub(partial: Partial<SubscriptionItem>): SubscriptionItem {
  return {
    productName: "Kaspersky",
    purchaseDate: "11 Aug 2026",
    renewalDate: "11 Aug 2027",
    status: "Active",
    licenseStatus: "Issued",
    licenseKey: "KEY-1",
    ...partial,
  };
}

assert.equal(
  countActiveLicenses([order({ licenseIssued: true })], []),
  1,
  "License Issued order with no keyed subscription still counts",
);
assert.equal(countActiveLicenses([order({ crmStage: "License Issued" })], []), 1);
assert.equal(countActiveLicenses([order({ paymentStatus: "paid" })], []), 0);
assert.equal(countActiveLicenses([], [sub({ status: "Active" })]), 1);
assert.equal(
  countActiveLicenses([order({ licenseIssued: true })], [sub({ status: "Active" }), sub({ status: "Active" })]),
  2,
  "keyed subscriptions win when higher",
);
assert.equal(countActiveLicenses([], [sub({ status: "Expired" })]), 0);

console.log("overview-data.check: ok");
