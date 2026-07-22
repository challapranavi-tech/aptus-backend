/**
 * Runnable self-check for schema + contact/career/revalidate parsers.
 * Run: npx --yes tsx shared/lib/schema.check.ts
 */
import assert from "node:assert/strict";
import { parseCmsSlug } from "./cms-slug";
import { parseContactRequest } from "./contact-request";
import { parseApplicationFields, validateFile } from "./career-application";
import { normaliseSlug, parseRevalidateRequest } from "./revalidate-request";
import {
  PERSON_NAME_RE,
  meaningfulTextError,
  parseObject,
  personNameError,
  sanitizeFilename,
  sanitizeText,
  validationErrorPayload,
} from "./schema";

// Unknown fields rejected.
const unknown = parseObject(
  { a: "1", b: "x" },
  {
    fields: {
      a: { type: "string", required: true, max: 10 },
    },
  },
);
assert.equal(unknown.ok, false);
if (!unknown.ok) assert.ok(unknown.errors.b);

// Control chars stripped from single-line.
assert.equal(sanitizeText("a\nb\rc", "singleLine"), "abc");
assert.equal(sanitizeFilename("../../etc/passwd.pdf"), "passwd.pdf");

// Person names: letters ok; punctuation-only junk rejected.
assert.equal(personNameError("Ada"), null);
assert.equal(personNameError("Mary-Jane"), null);
assert.equal(personNameError("O’Brien"), null);
assert.ok(personNameError("....."));
assert.ok(personNameError("?/"));
assert.ok(personNameError("..."));
assert.ok(!PERSON_NAME_RE.test("....."));
assert.ok(PERSON_NAME_RE.test("Anagha R"));
assert.equal(meaningfulTextError("Muscat", "Location"), null);
assert.equal(meaningfulTextError("Not Applicable", "Reports To"), null);
assert.equal(meaningfulTextError("5", "Years"), null);
assert.ok(meaningfulTextError("/////", "Organization"));
assert.ok(meaningfulTextError("../.", "Qualification"));
assert.ok(meaningfulTextError("''", "Year"));
assert.ok(meaningfulTextError("/", "Reports To"));

// Contact: happy path + bad email + unknown field.
const contactOk = parseContactRequest({
  first_name: "Ada",
  last_name: "Lovelace",
  email: "Ada@Example.com",
  company: "Analytical Engines",
  phone: "+968 1234 5678",
  product: "Revit",
  message: "Hello",
});
assert.equal(contactOk.ok, true);
if (contactOk.ok) assert.equal(contactOk.data.email, "ada@example.com");

assert.equal(
  parseContactRequest({
    first_name: "A",
    last_name: "B",
    email: "nope",
    company: "C",
    phone: "+96812345678",
  }).ok,
  false,
);

// Unknown keys are stripped in preprocess (CTA city/heard_from mapping).
assert.equal(
  parseContactRequest({
    first_name: "A",
    last_name: "B",
    email: "a@b.co",
    company: "C",
    phone: "+96812345678",
    extra: "nope",
  }).ok,
  true,
);

// Trailing-space product values normalize to allowlist.
const spaced = parseContactRequest({
  first_name: "A",
  last_name: "B",
  email: "a@b.co",
  company: "C",
  phone: "+96812345678",
  product: "Civil 3D ",
});
assert.equal(spaced.ok, true);
if (spaced.ok) assert.equal(spaced.data.product, "Civil 3D");

// Contact-page CTA fields map into company/message (unknown keys stripped).
const lead = parseContactRequest({
  first_name: "Sam",
  last_name: "Lee",
  email: "sam@example.com",
  phone: "+96812345678",
  city: "Muscat",
  country: "Oman",
  message: "Hello",
  heard_from: "LinkedIn",
});
assert.equal(lead.ok, true);
if (lead.ok) {
  assert.equal(lead.data.company, "Muscat, Oman");
  assert.equal(lead.data.product, "Others");
  assert.ok(lead.data.message.includes("Heard from: LinkedIn"));
}

// Career fields.
const career = parseApplicationFields({
  fullName: "Jane Doe",
  email: "jane@example.com",
  phone: "+96812345678",
  position: "Engineer",
  experience: "5",
  location: "Muscat",
  coverMessage: "Hi",
});
assert.equal(career.ok, true);

assert.ok(
  validateFile({ name: "cv.exe", size: 10, type: "application/x-msdownload" }, [".pdf"], "Resume", true),
);

// Revalidate + slug.
const rev = parseRevalidateRequest({ token: "secret", slug: "about-us" });
assert.equal(rev.ok, true);
assert.equal(normaliseSlug("https://x.test/About-Us?x=1"), "about-us");
assert.equal(normaliseSlug("../etc/passwd"), null);
assert.equal(parseCmsSlug("about-us").ok, true);
assert.equal(parseCmsSlug("../x").ok, false);

assert.equal(validationErrorPayload({ email: "bad" }).error, "Validation failed.");

console.log("schema.check: ok");
