import assert from "node:assert/strict";
import {
  ensurePaymentProofFileName,
  isAllowedPaymentProofFile,
  PAYMENT_PROOF_MAX_BYTES,
} from "./bank-transfer";

assert.ok(PAYMENT_PROOF_MAX_BYTES <= 4.5 * 1024 * 1024);

assert.equal(
  isAllowedPaymentProofFile({ name: "slip.jpg", type: "image/jpeg" }),
  true,
);
assert.equal(
  isAllowedPaymentProofFile({ name: "slip.JPG", type: "image/jpeg" }),
  true,
);
assert.equal(
  isAllowedPaymentProofFile({ name: "blob", type: "image/jpeg" }),
  true,
);
assert.equal(
  isAllowedPaymentProofFile({ name: "", type: "image/jpeg" }),
  true,
);
assert.equal(
  isAllowedPaymentProofFile({ name: "slip.jpg", type: "image/pjpeg" }),
  true,
);
assert.equal(
  isAllowedPaymentProofFile({ name: "evil.exe", type: "image/jpeg" }),
  false,
);

assert.equal(
  ensurePaymentProofFileName({ name: "blob", type: "image/jpeg" }),
  "blob.jpg",
);
assert.equal(
  ensurePaymentProofFileName({ name: "", type: "image/jpeg" }),
  "payment-proof.jpg",
);
assert.equal(
  ensurePaymentProofFileName({ name: "receipt.jfif", type: "image/jpeg" }),
  "receipt.jpg",
);
assert.equal(
  ensurePaymentProofFileName({ name: "slip.JPEG", type: "image/jpeg" }),
  "slip.JPEG",
);

console.log("bank-transfer.proof-file.check: ok");
