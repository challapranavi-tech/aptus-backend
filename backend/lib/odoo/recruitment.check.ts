/**
 * Runnable self-check for hr.applicant payload building (no network).
 * Run: npx --yes tsx backend/lib/odoo/recruitment.check.ts
 */
import assert from "node:assert/strict";
import {
  applicantStageIdFromEnv,
  buildApplicantValues,
  parseSalaryExpected,
} from "./recruitment";

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
assert.ok(!("applicant_notes" in base));
assert.ok(!("salary_expected" in base));
// stage_id omitted when not provided (Odoo assigns default first stage).
assert.ok(!("stage_id" in base));

const rich = buildApplicantValues(
  {
    candidateName: "Jane Doe",
    email: "jane@example.com",
    phone: "+968 1234",
    jobId: 42,
    notesHtml: "<p>Full application</p>",
    salaryExpected: 1200,
  },
  3,
);
assert.equal(rich.partner_phone, "+968 1234");
assert.equal(rich.applicant_notes, "<p>Full application</p>");
assert.equal(rich.salary_expected, 1200);
assert.equal(rich.stage_id, 3);

assert.ok(
  !("stage_id" in
    buildApplicantValues({ candidateName: "A", email: "a@b.c", jobId: 1 }, 0)),
);

assert.equal(parseSalaryExpected("OMR 1,200"), 1200);
assert.equal(parseSalaryExpected("500"), 500);
assert.equal(parseSalaryExpected("n/a"), undefined);

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
