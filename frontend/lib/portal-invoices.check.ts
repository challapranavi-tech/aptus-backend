import assert from "node:assert/strict";
import { orderHasPaymentProof, ordersWithPaymentProof } from "./portal-invoices";
import type { PortalOrder } from "@/types/orders";

const base: PortalOrder = {
  id: "o1",
  reference: "APT-1",
  actorId: "a1",
  partnerId: 1,
  status: "Approved",
  duration: "1year",
  items: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

assert.equal(orderHasPaymentProof(base), false);
assert.equal(
  orderHasPaymentProof({ ...base, paymentProofFileName: "proof.pdf" }),
  true,
);
assert.equal(ordersWithPaymentProof([base, { ...base, id: "o2", paymentProofUrl: "/x" }]).length, 1);

console.log("portal-invoices.check: ok");
