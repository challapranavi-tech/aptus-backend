/**
 * Runnable self-check for quote refs + pending job enqueue (disk).
 * Run: npx --yes tsx backend/lib/crm-pending.check.ts
 */
import assert from "node:assert/strict";
import { mkdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { enqueueCrmLead, newQuoteRef } from "./crm-pending";

async function main() {
  const a = newQuoteRef(1_700_000_000_000);
  const b = newQuoteRef(1_700_000_000_000);
  assert.match(a, /^Q-[A-Z0-9]+-[A-Z0-9]+$/);
  assert.notEqual(a, b, "random suffix should differ");

  const root = path.join(os.tmpdir(), `aptus-crm-pending-${process.pid}`);
  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });
  process.env.CRM_PENDING_DIR = root;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.VERCEL;

  const stored = await enqueueCrmLead({
    quoteRef: "Q-TEST-0001",
    alertTo: "sales@example.com",
    input: {
      firstName: "Ada",
      lastName: "Lovelace",
      company: "Analytical Engines",
      email: "ada@example.com",
      phone: "+96812345678",
      product: "Revit",
      qty: "1",
    },
    lastError: "odoo down",
  });
  assert.ok(stored);
  const raw = await readFile(String(stored), "utf8");
  const job = JSON.parse(raw) as { quoteRef: string; attempts: number };
  assert.equal(job.quoteRef, "Q-TEST-0001");
  assert.equal(job.attempts, 0);

  await rm(root, { recursive: true, force: true });
  console.log("crm-pending.check: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
