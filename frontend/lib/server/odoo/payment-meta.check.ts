import assert from "node:assert/strict";
import {
  formatPaymentPaidNote,
  formatPaymentPendingNote,
  formatPaymentRejectedNote,
  parseSaleOrderPaymentMeta,
  PAYMENT_PAID_TAG,
  PAYMENT_PENDING_TAG,
  PAYMENT_REJECTED_TAG,
} from "./payment-meta";

const pending = formatPaymentPendingNote({
  bankTransferReference: "APT-20260803-0001",
  attachmentId: 42,
  fileName: "proof scan.pdf",
});
assert.ok(pending.includes(PAYMENT_PENDING_TAG));
const pendingMeta = parseSaleOrderPaymentMeta(pending);
assert.equal(pendingMeta.paymentStatus, "pending_verification");
assert.equal(pendingMeta.bankTransferReference, "APT-20260803-0001");

const paid = formatPaymentPaidNote({
  paymentMethod: "Stripe",
  paymentIntentId: "pi_123",
  amountPaid: 12.5,
});
assert.ok(paid.includes(PAYMENT_PAID_TAG));
assert.equal(parseSaleOrderPaymentMeta(paid).paymentStatus, "paid");

const rejected = formatPaymentRejectedNote({
  bankTransferReference: "APT-1",
  reason: "Invalid proof",
});
assert.ok(rejected.includes(PAYMENT_REJECTED_TAG));
const rejectedMeta = parseSaleOrderPaymentMeta(rejected);
assert.equal(rejectedMeta.paymentStatus, "failed");
assert.equal(rejectedMeta.rejectReason, "Invalid proof");

assert.equal(
  parseSaleOrderPaymentMeta("", { invoiceStatus: "invoiced" }).paymentStatus,
  "paid",
);
assert.equal(
  parseSaleOrderPaymentMeta("", { orderState: "cancel" }).paymentStatus,
  "failed",
);
assert.equal(
  parseSaleOrderPaymentMeta("", { subscriptionState: "3_progress" }).paymentStatus,
  "paid",
);
assert.equal(
  parseSaleOrderPaymentMeta("[Payment Verification Pending] ref=APT-1", {
    hasLicense: true,
  }).paymentStatus,
  "paid",
  "issued license must win over a leftover pending tag",
);

const pendingWithProof = formatPaymentPendingNote({
  bankTransferReference: "APT-20260811-5713",
  attachmentId: 99,
  fileName: "Screenshot_30-7-2026_152022_supabase.com.jpeg",
});
const pendingProofMeta = parseSaleOrderPaymentMeta(pendingWithProof);
assert.equal(pendingProofMeta.paymentProofOdooAttachmentId, 99);
assert.equal(
  pendingProofMeta.paymentProofFileName,
  "Screenshot_30-7-2026_152022_supabase.com.jpeg",
);

// Invoiced / licensed shortcuts must keep attachment tags for the Invoices page.
const invoicedWithProof = parseSaleOrderPaymentMeta(pendingWithProof, {
  invoiceStatus: "invoiced",
});
assert.equal(invoicedWithProof.paymentStatus, "paid");
assert.equal(invoicedWithProof.paymentProofOdooAttachmentId, 99);
assert.equal(
  invoicedWithProof.paymentProofFileName,
  "Screenshot_30-7-2026_152022_supabase.com.jpeg",
);

const htmlNote =
  "<p>[Payment Verification Pending] ref=APT-1 attachment_id=77 file=proof.pdf</p>";
const htmlMeta = parseSaleOrderPaymentMeta(htmlNote);
assert.equal(htmlMeta.paymentProofOdooAttachmentId, 77);
assert.equal(htmlMeta.paymentProofFileName, "proof.pdf");

console.log("payment-meta.check: ok");
