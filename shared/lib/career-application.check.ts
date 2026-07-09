/**
 * Runnable self-check for the career application validation rules.
 * Run:  node lib/career-application.check.ts   (Node 22.6+ strips types)
 */
import assert from "node:assert/strict";
import {
  MAX_UPLOAD_BYTES,
  RESUME_EXTENSIONS,
  validateFields,
  validateFile,
} from "../lib/career-application.ts";

// Missing required fields -> one error per required field.
const empty = validateFields({});
assert.equal(Object.keys(empty).length, 6, "all required fields flagged");

// Invalid email is rejected.
assert.ok(
  validateFields({
    fullName: "A",
    email: "not-an-email",
    phone: "1",
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
