/**
 * Runnable self-check for the multi-step careers application rules.
 * Run: npx --yes tsx shared/lib/careers-application.check.ts
 */
import assert from "node:assert/strict";
import {
  DOC_EXTENSIONS,
  DOC_OR_IMAGE_MIME_OK,
  IMAGE_EXTENSIONS,
  MAX_TOTAL_ATTACHMENT_BYTES,
  MAX_UPLOAD_BYTES,
  RESUME_EXTENSIONS,
  emptyApplicationFields,
  parseApplicationFields,
  rejectUnknownFormKeys,
  validateBasic,
  validateEducation,
  validateFields,
  validateFile,
  validatePreInterview,
} from "./careers-application";
import { extractResumeHints } from "./resume-parse";

const basicOk = validateBasic({
  fullName: "Jane Doe",
  email: "jane@example.com",
  phone: "+96812345678",
});
assert.deepEqual(basicOk, {}, "valid basic fields pass");

assert.ok(
  validateBasic({
    fullName: "A",
    email: "not-an-email",
    phone: "+96812345678",
  }).email,
  "bad email flagged",
);

const filled = emptyApplicationFields({
  fullName: "Jane Doe",
  email: "jane@example.com",
  phone: "+96812345678",
  applicationDate: "2026-07-13",
  appliedDesignation: "Engineer",
  candidateName: "Jane Doe",
  totalYearsExperience: "5",
  dateOfBirth: "1995-01-01",
  currentOrg: { name: "Acme", designation: "Dev", duration: "2020-2024", totalYears: "4" },
  previousOrg1: { name: "Beta", designation: "Jr", duration: "2018-2020", totalYears: "2" },
  previousOrg2: {
    name: "Not Applicable",
    designation: "Not Applicable",
    duration: "Not Applicable",
    totalYears: "Not Applicable",
  },
  professionalQualification: "B.Tech",
  professionalQualificationYear: "2017",
  graduation: "B.Tech CS",
  graduationYear: "2017",
  certifications: [{ name: "AWS SAA", year: "2022" }],
  reportsTo: "CTO",
  teamSize: "5",
  currentLocation: "Muscat",
  familyDetails: "Not Applicable",
  currentCtc: "1000",
  expectedCtc: "1200",
  noticePeriod: "30 days",
  passportNumber: "A12345678",
  passportValidity: "2030-01-01",
  drivingLicense: "Not Applicable",
  educationEntries: [{ name: "B.Tech", institution: "SQU", year: "2017" }],
  position: "Engineer",
  experience: "5",
  location: "Muscat",
});

assert.deepEqual(validatePreInterview(filled), {}, "pre-interview passes");
assert.deepEqual(validateEducation(filled), {}, "education passes");
assert.deepEqual(validateFields(filled), {}, "full validateFields passes");

// familyDetails & drivingLicense are optional; passport details are required.
assert.deepEqual(
  validatePreInterview({ ...filled, familyDetails: "", drivingLicense: "" }),
  {},
  "optional pre-interview fields may be blank",
);
assert.ok(
  validatePreInterview({ ...filled, passportNumber: "" }).passportNumber,
  "passport number required",
);
assert.ok(
  validatePreInterview({ ...filled, passportValidity: "" }).passportValidity,
  "passport validity required",
);

assert.ok(
  validateEducation({ educationEntries: [] })["educationEntries.0.name"],
  "empty education blocked",
);

// Single entry — name, institution, and year are all required.
assert.deepEqual(
  validateEducation({
    educationEntries: [{ name: "BE", institution: "SQU", year: "2017" }],
  }),
  {},
  "complete education entry passes",
);
assert.ok(
  validateEducation({
    educationEntries: [{ name: "BE", institution: "", year: "" }],
  })["educationEntries.0.institution"],
  "institution required",
);
assert.ok(
  validateEducation({
    educationEntries: [{ name: "BE", institution: "SQU", year: "" }],
  })["educationEntries.0.year"],
  "year required",
);
// Extra entries are allowed; each must be complete.
assert.deepEqual(
  validateEducation({
    educationEntries: [
      { name: "BE", institution: "SQU", year: "2017" },
      { name: "MBA", institution: "OU", year: "2020" },
    ],
  }),
  {},
  "multiple complete education entries pass",
);
assert.ok(
  validateEducation({
    educationEntries: [
      { name: "BE", institution: "SQU", year: "2017" },
      { name: "MBA", institution: "", year: "2020" },
    ],
  })["educationEntries.1.institution"],
  "extra entry institution required",
);

const parsed = parseApplicationFields({
  ...filled,
  currentOrg: JSON.stringify(filled.currentOrg),
  previousOrg1: JSON.stringify(filled.previousOrg1),
  previousOrg2: JSON.stringify(filled.previousOrg2),
  certifications: JSON.stringify(filled.certifications),
  educationEntries: JSON.stringify(filled.educationEntries),
});
assert.equal(parsed.ok, true, "parseApplicationFields accepts full payload");

assert.ok(
  Object.keys(rejectUnknownFormKeys(["fullName", "hack"])).includes("hack"),
);
assert.equal(
  Object.keys(rejectUnknownFormKeys(["educationDoc_0", "resume"])).length,
  0,
  "dynamic education doc keys allowed",
);

assert.ok(validateFile(null, RESUME_EXTENSIONS, "Resume", true), "missing required file flagged");
assert.equal(validateFile(null, RESUME_EXTENSIONS, "Resume", false), null, "missing optional file ok");
assert.ok(
  validateFile({ name: "cv.pdf", size: MAX_UPLOAD_BYTES + 1 }, RESUME_EXTENSIONS, "Resume", true),
  "oversize file flagged",
);
assert.ok(
  validateFile(
    { name: "malware.exe.pdf", size: 1024 },
    RESUME_EXTENSIONS,
    "Resume",
    true,
  ),
  "compound dangerous extension rejected",
);
assert.ok(
  validateFile(
    { name: "slip.png", size: 1024, type: "image/png" },
    [...DOC_EXTENSIONS, ...IMAGE_EXTENSIONS],
    "Latest payslip",
    false,
  ),
  "image MIME rejected when mimeOk defaults to docs-only",
);
assert.equal(
  validateFile(
    { name: "slip.png", size: 1024, type: "image/png" },
    [...DOC_EXTENSIONS, ...IMAGE_EXTENSIONS],
    "Latest payslip",
    false,
    DOC_OR_IMAGE_MIME_OK,
  ),
  null,
  "image MIME accepted with DOC_OR_IMAGE_MIME_OK",
);
assert.equal(
  validateFile(
    { name: "letter.jpeg", size: 1024, type: "image/jpeg" },
    [...DOC_EXTENSIONS, ...IMAGE_EXTENSIONS],
    "Relieving letter",
    false,
    DOC_OR_IMAGE_MIME_OK,
  ),
  null,
  "jpeg MIME accepted with DOC_OR_IMAGE_MIME_OK",
);
assert.ok(
  MAX_UPLOAD_BYTES <= 4.5 * 1024 * 1024 &&
    MAX_TOTAL_ATTACHMENT_BYTES <= 4.5 * 1024 * 1024,
  "upload caps must stay under Vercel serverless body limit",
);

const hints = extractResumeHints(
  "Jane Doe\njane@example.com\n+968 1234 5678\n5 years of experience\nB.Tech 2017",
);
assert.equal(hints.email, "jane@example.com");
assert.ok(hints.fullName?.includes("Jane"));
assert.ok(hints.autoFilledKeys.includes("email"));

console.log("careers-application self-check passed");
