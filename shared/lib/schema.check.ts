/**
 * Runnable self-check for schema + contact/career/revalidate parsers.
 * Run: npx --yes tsx shared/lib/schema.check.ts
 */
import assert from "node:assert/strict";
import { parseCmsSlug } from "./cms-slug";
import {
  detectContactCategory,
  parseContactRequest,
  validateQuoteContactFields,
} from "./contact-request";
import { parseApplicationFields, validateFile } from "./career-application";
import { normaliseSlug, parseRevalidateRequest } from "./revalidate-request";
import {
  PERSON_NAME_RE,
  meaningfulTextError,
  parseObject,
  personNameError,
  hasAllowedExtension,
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
  qty: "2",
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

// Stricter email/phone — reject short TLD and too-few digits.
assert.equal(
  parseContactRequest({
    first_name: "Ada",
    last_name: "Lovelace",
    email: "a@b.c",
    company: "Co",
    phone: "+968 1234 5678",
    product: "Revit",
    qty: "1",
  }).ok,
  false,
);
assert.equal(
  parseContactRequest({
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@example.com",
    company: "Co",
    phone: "123",
    product: "Revit",
    qty: "1",
  }).ok,
  false,
);
assert.equal(
  parseContactRequest({
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@example.com",
    company: "Co",
    phone: "+968 1234 5678",
    product: "Revit",
    qty: "0",
  }).ok,
  false,
);

assert.deepEqual(
  Object.keys(
    validateQuoteContactFields({
      first_name: "",
      last_name: "...",
      email: "bad",
      company: "////",
      phone: "12",
      qty: "",
    }),
  ).sort(),
  ["company", "email", "first_name", "last_name", "phone", "qty"],
);
assert.equal(
  Object.keys(
    validateQuoteContactFields({
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@example.com",
      company: "Analytical Engines",
      phone: "+968 1234 5678",
      qty: "1",
    }),
  ).length,
  0,
);

// Individual quote form
assert.equal(
  Object.keys(
    validateQuoteContactFields({
      customer_type: "individual",
      name: "Ada Lovelace",
      email: "ada@example.com",
      country_code: "+968",
      phone_local: "91234567",
      profession: "Engineer",
      product: "Revit",
      qty: "2",
    }),
  ).length,
  0,
);
assert.ok(
  validateQuoteContactFields({
    customer_type: "individual",
    name: "",
    email: "ada@example.com",
    country_code: "+968",
    phone_local: "91234567890",
    profession: "",
    product: "Select Software Product",
    qty: "0",
  }).phone_local,
);
assert.ok(
  validateQuoteContactFields({
    customer_type: "company",
    name: "Ada",
    company: "Aptus",
    country_code: "+968",
    phone_local: "91234567",
    vat_id: "1234567890123",
    cr_number: "12345678901",
    product: "Revit",
    qty: "1",
  }).vat_id,
);

const individualOk = parseContactRequest({
  customer_type: "individual",
  name: "Ada Lovelace",
  email: "Ada@Example.com",
  country_code: "+968",
  phone_local: "91234567",
  profession: "Engineer",
  product: "Revit",
  qty: "2",
  message: "Need licenses",
});
assert.equal(individualOk.ok, true);
if (individualOk.ok) {
  assert.equal(individualOk.data.email, "ada@example.com");
  assert.equal(individualOk.data.phone, "+96891234567");
  assert.equal(individualOk.data.customer_type, "individual");
}

const companyOk = parseContactRequest({
  customer_type: "company",
  name: "Ada Lovelace",
  company: "Analytical Engines",
  country_code: "+971",
  phone_local: "501234567",
  vat_id: "123456789012",
  cr_number: "1234567890",
  product: "Civil 3D",
  qty: "5",
});
assert.equal(companyOk.ok, true);
if (companyOk.ok) {
  assert.equal(companyOk.data.vat_id, "123456789012");
  assert.equal(companyOk.data.cr_number, "1234567890");
  assert.equal(companyOk.data.customer_type, "company");
}

// Unknown keys are stripped in preprocess (CTA city/heard_from mapping).
assert.equal(
  parseContactRequest({
    first_name: "Ada",
    last_name: "Bo",
    email: "a@b.co",
    company: "Co",
    phone: "+96812345678",
    qty: "1",
    extra: "nope",
  }).ok,
  true,
);

// Trailing-space product values normalize to allowlist.
const spaced = parseContactRequest({
  first_name: "Ada",
  last_name: "Bo",
  email: "a@b.co",
  company: "Co",
  phone: "+96812345678",
  product: "Civil 3D ",
  qty: "1",
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

assert.equal(detectContactCategory("Revit", null), "software");
assert.equal(detectContactCategory("CCTV Surveillance Solutions", null), "elv");
assert.equal(detectContactCategory("Revit", "elv"), "elv");
assert.equal(detectContactCategory("Access Control Systems", "software"), "software");

// Career fields — full validation lives in careers-application / apply routes.
assert.equal(
  parseApplicationFields({
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "+96812345678",
    position: "Engineer",
    experience: "5",
    location: "Muscat",
    coverMessage: "Hi",
  }).ok,
  false,
);

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

const proofExts = [".pdf", ".jpg", ".jpeg", ".png"] as const;
assert.equal(
  hasAllowedExtension("Screenshot_30-7-2026_152022_supabase.com.jpeg", proofExts),
  true,
  "hostname .com before .jpeg is not a compound executable",
);
assert.equal(hasAllowedExtension("slip.jpeg", proofExts), true);
assert.equal(hasAllowedExtension("malware.exe.pdf", proofExts), false);
assert.equal(hasAllowedExtension("photo.svg.jpg", proofExts), false);

console.log("schema.check: ok");
