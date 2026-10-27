import assert from "node:assert/strict";
import {
  getOrderDisplayStatus,
  isOrderEligibleForPayment,
  isOrdersPageOrder,
} from "./order-status";
import type { PortalOrder } from "@/types/orders";

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
  getOrderDisplayStatus(order({ paymentStatus: "pending_verification", status: "Submitted" })),
  "Payment Verification Pending",
);
assert.equal(
  getOrderDisplayStatus(order({ paymentStatus: "paid", status: "Approved" })),
  "Payment Verified",
);
assert.equal(
  getOrderDisplayStatus(
    order({ paymentStatus: "paid", status: "Completed", licenseIssued: true }),
  ),
  "License Issued",
);
assert.equal(
  getOrderDisplayStatus(order({ paymentStatus: "failed", status: "Approved" })),
  "Rejected",
);
assert.equal(getOrderDisplayStatus(order({ status: "Rejected" })), "Rejected");
assert.equal(getOrderDisplayStatus(order({ status: "Approved" })), "Approved");
assert.equal(
  getOrderDisplayStatus(
    order({
      paymentStatus: "pending",
      crmStage: "Portal Purchase",
    }),
  ),
  "Payment Verification Pending",
);
assert.equal(
  getOrderDisplayStatus(
    order({
      paymentStatus: "pending",
      crmStage: "Payment Verification",
    }),
  ),
  "Payment Verification Pending",
);
assert.equal(
  getOrderDisplayStatus(
    order({
      paymentStatus: "pending",
      crmStage: "Payment Confirmation",
    }),
  ),
  "Payment Verified",
);
assert.equal(
  getOrderDisplayStatus(
    order({
      paymentStatus: "paid",
      status: "Completed",
      crmStage: "Won",
    }),
  ),
  "License Issued",
);
assert.equal(
  getOrderDisplayStatus(
    order({
      paymentStatus: "paid",
      crmStage: "License Issued",
    }),
  ),
  "License Issued",
);

assert.equal(
  isOrdersPageOrder(order({ paymentStatus: "pending_verification" })),
  true,
);
assert.equal(isOrdersPageOrder(order({ paymentStatus: "paid" })), true);
assert.equal(
  isOrdersPageOrder(order({ paymentStatus: "paid", licenseIssued: true })),
  true,
);
assert.equal(isOrdersPageOrder(order({ status: "Submitted" })), false);

assert.equal(
  isOrderEligibleForPayment(null, { status: "Approved", paymentStatus: "pending" }),
  false,
);
assert.equal(
  isOrderEligibleForPayment(order({ status: "Submitted", paymentStatus: "pending" })),
  true,
);
assert.equal(
  isOrderEligibleForPayment(order({ status: "Approved", paymentStatus: "pending" })),
  true,
);
assert.equal(
  isOrderEligibleForPayment(order({ status: "Submitted", paymentStatus: "paid" })),
  false,
);
assert.equal(
  isOrderEligibleForPayment(
    order({ status: "Approved", paymentStatus: "pending_verification" }),
  ),
  false,
);

console.log("order-status.check: ok");
