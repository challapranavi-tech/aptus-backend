/**
 * Self-check: payment-proof storage no longer touches the filesystem.
 * Run: npx --yes tsx frontend/lib/server/payment-proof-storage.check.ts
 */
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { savePaymentProofFile, readPaymentProofBuffer } from "./payment-proof-storage";

async function main() {
  // Without BLOB_READ_WRITE_TOKEN, save must use in-memory fallback (no .data writes).
  delete process.env.BLOB_READ_WRITE_TOKEN;

  const pdfHeader = Buffer.from("%PDF-1.4 minimal");
  const file = new File([pdfHeader], "proof.pdf", { type: "application/pdf" });

  const stored = await savePaymentProofFile("odoo-lead-1224", file);
  assert.equal(stored.storageKey.startsWith("odoo-lead-1224/"), true);
  assert.equal(stored.fileName, "proof.pdf");
  assert.equal(stored.filePath.startsWith("local:"), true);

  const diskDir = path.join(process.cwd(), ".data", "payment-proofs", "odoo-lead-1224");
  assert.equal(fs.existsSync(diskDir), false, "must not write payment proofs to disk");

  const buffer = await readPaymentProofBuffer(stored.storageKey);
  assert.ok(buffer);
  assert.equal(buffer!.subarray(0, 5).toString("utf8"), "%PDF-");

  assert.equal(await readPaymentProofBuffer("missing/key"), null);

  console.log("payment-proof-storage.check: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
