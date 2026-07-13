/**
 * Runnable self-check for the career application validation rules.
 * Run: npx --yes tsx shared/lib/career-application.check.ts
 */
import assert from "node:assert/strict";
import {
  MAX_UPLOAD_BYTES,
  RESUME_EXTENSIONS,
  parseApplicationFields,
  rejectUnknownFormKeys,
  validateFields,
  validateFile,
} from "./career-application";

// Missing required fields -> one error per required field.
const empty = validateFields({});
assert.ok(Object.keys(empty).length >= 6, "all required fields flagged");

// Invalid email is rejected.
assert.ok(
  validateFields({
    fullName: "A",
    email: "not-an-email",
    phone: "+96812345678",
    position: "Dev",
    experience: "2",
    location: "Muscat",
  }).email,
  "bad email flagged",
);

// Fully valid payload passes.
assert.deepEqual(
  validateFields({
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "+96812345678",
    position: "Engineer",
    experience: "5",
    location: "Muscat, Oman",
  }),
  {},
  "valid fields pass",
);

const parsed = parseApplicationFields({
  fullName: "Jane Doe",
  email: "Jane@Example.com",
  phone: "+96812345678",
  position: "Engineer",
  experience: "5",
  location: "Muscat",
  unexpected: "x",
});
assert.equal(parsed.ok, false, "unknown fields rejected");

assert.ok(
  Object.keys(rejectUnknownFormKeys(["fullName", "hack"])).includes("hack"),
);

// File validation: required-but-missing, wrong type, too big, and OK.
assert.ok(validateFile(null, RESUME_EXTENSIONS, "Resume", true), "missing required file flagged");
assert.equal(validateFile(null, RESUME_EXTENSIONS, "Resume", false), null, "missing optional file ok");
assert.ok(
  validateFile({ name: "cv.exe", size: 1000 }, RESUME_EXTENSIONS, "Resume", true),
  "wrong extension flagged",
);
assert.ok(
  validateFile({ name: "cv.pdf", size: MAX_UPLOAD_BYTES + 1 }, RESUME_EXTENSIONS, "Resume", true),
  "oversize file flagged",
);
assert.equal(
  validateFile({ name: "cv.PDF", size: 1024 }, RESUME_EXTENSIONS, "Resume", true),
  null,
  "valid file (case-insensitive ext) passes",
);

console.log("career-application self-check passed");
