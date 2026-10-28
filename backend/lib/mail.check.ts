/**
 * Runnable self-check for mail helpers (no network).
 * Run: npx --yes tsx backend/lib/mail.check.ts
 */
import assert from "node:assert/strict";
import {
  MAX_TOTAL_ATTACHMENT_BYTES,
  hrEmail,
  mailFromAddress,
  validateAttachments,
} from "./mail";

assert.equal(
  validateAttachments([{ filename: "a.pdf", content: Buffer.from("x") }]),
  null,
);
assert.match(
  validateAttachments([{ filename: "", content: Buffer.from("x") }]) ?? "",
  /filename/i,
);
assert.match(
  validateAttachments([{ filename: "a.pdf", content: Buffer.alloc(0) }]) ?? "",
  /empty/i,
);
assert.match(
  validateAttachments([
    {
      filename: "big.bin",
      content: Buffer.alloc(MAX_TOTAL_ATTACHMENT_BYTES + 1),
    },
  ]) ?? "",
  /limit/i,
);

// Env helpers return non-empty defaults when unset.
delete process.env.FROM_EMAIL;
delete process.env.SMTP_FROM;
delete process.env.CAREER_FROM_EMAIL;
assert.ok(mailFromAddress().includes("@"));

delete process.env.HR_EMAIL;
delete process.env.CAREER_TO_EMAIL;
assert.equal(hrEmail(), "hr@aptusinfotech.com");

process.env.HR_EMAIL = "hiring@example.com";
assert.equal(hrEmail(), "hiring@example.com");

console.log("mail.check.ts: ok");
