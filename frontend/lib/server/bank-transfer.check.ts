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
  delete process.env.BANK_TRANSFER_CURRENCY;

  process.env.NODE_ENV = "development";
  const defaults = getBankTransferDetails();
  assert.equal(defaults.bankName, "Bank Muscat");
  assert.equal(defaults.accountNumber, "0342-00229626-0015");
  assert.equal(defaults.swiftBic, "BMUSOMRXXXX");
  assert.equal(defaults.currency, "OMR");
  assert.equal(defaults.branch, "MBD South, Ruwi, Sultanate of Oman");
  assert.equal(defaults.iban, "");

  process.env.NODE_ENV = "production";
  const prodDefaults = getBankTransferDetails();
  assert.equal(prodDefaults.accountName, "ORIENTAL ORX INTER (APTUS INFOTECH)");

  process.env.BANK_TRANSFER_BANK_NAME = "Override Bank";
  process.env.BANK_TRANSFER_ACCOUNT_NAME = "Override Name";
  process.env.BANK_TRANSFER_ACCOUNT_NUMBER = "9999";
  process.env.BANK_TRANSFER_SWIFT = "OVERRIDEXX";
  process.env.BANK_TRANSFER_CURRENCY = "OMR";
  process.env.BANK_TRANSFER_BRANCH = "Test Branch";
  const overridden = getBankTransferDetails();
  assert.equal(overridden.bankName, "Override Bank");
  assert.equal(overridden.accountNumber, "9999");
  assert.equal(overridden.branch, "Test Branch");
} finally {
  process.env = originalEnv;
}

console.log("bank-transfer.check: ok");
