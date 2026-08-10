import assert from "node:assert/strict";
import { isRecoverableSaleOrderCreateError } from "./odoo/sales";
import { parseSaleOrderPaymentMeta, formatPaymentPendingNote } from "./odoo/payment-meta";

assert.equal(
  isRecoverableSaleOrderCreateError(
    new Error("❌ Sequence code 'sale.order.software.quotation' not found."),
  ),
  true,
);
assert.equal(isRecoverableSaleOrderCreateError(new Error("Access denied")), false);

const pendingNote = formatPaymentPendingNote({
  bankTransferReference: "APT-20260806-0645",
  attachmentId: 99,
  fileName: "proof.pdf",
});
const parsed = parseSaleOrderPaymentMeta(`Existing lead notes\n\n${pendingNote}`);
assert.equal(parsed.paymentStatus, "pending_verification");
assert.equal(parsed.bankTransferReference, "APT-20260806-0645");
assert.equal(parsed.paymentProofOdooAttachmentId, 99);

console.log("bank-transfer-odoo.check: ok");
