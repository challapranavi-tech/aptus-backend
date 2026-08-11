/**
 * Purchase CRM workflow stage hints — one opportunity progresses:
 * Added to Cart → Portal Purchase → Payment Confirmation → License Issued
 */
import assert from "node:assert/strict";
import { pickStageIdByHints } from "./odoo/partner-context";
import { getOrderDisplayStatus } from "@/lib/order-status";
import type { PortalOrder } from "@/types/orders";

const pipeline = [
  { id: 1, name: "Added to Cart" },
  { id: 2, name: "Portal Purchase" },
  { id: 3, name: "Payment Confirmation" },
  { id: 4, name: "License Issued" },
];

assert.equal(pickStageIdByHints(pipeline, ["added to cart"]), 1);
assert.equal(pickStageIdByHints(pipeline, ["portal purchase", "portal software order"]), 2);
assert.equal(pickStageIdByHints(pipeline, ["payment confirmation"]), 3);
assert.equal(pickStageIdByHints(pipeline, ["license issued"]), 4);

function order(partial: Partial<PortalOrder>): PortalOrder {
  return {
    id: "odoo-so-1",
    reference: "SO-1",
    actorId: "",
    partnerId: 1,
    status: "Submitted",
    duration: "1year",
    items: [{ category: "Software", productName: "AutoCAD", quantity: 1 }],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...partial,
  };
}

assert.equal(
  getOrderDisplayStatus(order({ paymentStatus: "pending_verification" })),
  "Payment Verification Pending",
);
assert.equal(
  getOrderDisplayStatus(order({ paymentStatus: "paid" })),
  "Payment Verified",
);
assert.equal(
  getOrderDisplayStatus(order({ paymentStatus: "paid", licenseIssued: true })),
  "License Issued",
);
assert.equal(
  getOrderDisplayStatus(order({ paymentStatus: "paid", crmStage: "Won" })),
  "License Issued",
);

console.log("purchase-workflow.check: ok");
