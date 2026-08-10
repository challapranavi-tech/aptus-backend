import assert from "node:assert/strict";
import { getBankTransferDetails } from "./bank-transfer";

const originalEnv = { ...process.env };

try {
  delete process.env.BANK_TRANSFER_COMPANY_NAME;
  delete process.env.BANK_TRANSFER_BANK_NAME;
  delete process.env.BANK_TRANSFER_ACCOUNT_NAME;
  delete process.env.BANK_TRANSFER_ACCOUNT_NUMBER;
  delete process.env.BANK_TRANSFER_IBAN;
  delete process.env.BANK_TRANSFER_SWIFT;
  delete process.env.BANK_TRANSFER_BRANCH;

  process.env.NODE_ENV = "development";
  const devDetails = getBankTransferDetails();
  assert.ok(devDetails);
  assert.equal(devDetails?.bankName, "Test Bank of Oman");
  assert.match(devDetails?.iban ?? "", /^OM/);

  process.env.NODE_ENV = "production";
  assert.equal(getBankTransferDetails(), null);
} finally {
  process.env = originalEnv;
}

console.log("bank-transfer.check: ok");
