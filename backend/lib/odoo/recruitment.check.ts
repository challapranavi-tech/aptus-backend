/**
 * Runnable self-check for hr.applicant payload building (no network).
 * Run: npx --yes tsx backend/lib/odoo/recruitment.check.ts
 */
import assert from "node:assert/strict";
import { applicantStageIdFromEnv, buildApplicantValues } from "./recruitment";

// Maps input → Odoo field names; optional fields default to "".
const base = buildApplicantValues({
  candidateName: "Jane Doe",
  email: "jane@example.com",
  jobId: 42,
});
assert.equal(base.partner_name, "Jane Doe");
assert.equal(base.email_from, "jane@example.com");
assert.equal(base.job_id, 42);
assert.equal(base.partner_phone, "");
// stage_id omitted when not provided (Odoo assigns default first stage).
assert.ok(!("stage_id" in base));

// stage_id included only when a positive integer is passed.
assert.equal(buildApplicantValues({ candidateName: "A", email: "a@b.c", jobId: 1 }, 3).stage_id, 3);
assert.ok(!("stage_id" in buildApplicantValues({ candidateName: "A", email: "a@b.c", jobId: 1 }, 0)));

// Env parsing: only positive integers count.
delete process.env.ODOO_APPLICANT_STAGE_ID;
assert.equal(applicantStageIdFromEnv(), undefined);
process.env.ODOO_APPLICANT_STAGE_ID = "5";
assert.equal(applicantStageIdFromEnv(), 5);
process.env.ODOO_APPLICANT_STAGE_ID = "abc";
assert.equal(applicantStageIdFromEnv(), undefined);
process.env.ODOO_APPLICANT_STAGE_ID = "-2";
assert.equal(applicantStageIdFromEnv(), undefined);

console.log("recruitment.check.ts: ok");
