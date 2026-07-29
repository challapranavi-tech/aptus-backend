/**
 * Runnable self-check for Contact Form partner payload + email template.
 * Run: npx --yes tsx backend/lib/odoo/enquiry.check.ts
 */
import assert from "node:assert/strict";
import { formatContactEnquiryEmail } from "../enquiry-email";
import {
  buildPartnerEnquiryValues,
  enquiryCategoryIdFromEnv,
  enquiryReferenceField,
  enquirySourceField,
  WEBSITE_ENQUIRY_CATEGORY_NAME,
  WEBSITE_ENQUIRY_SEQUENCE,
} from "./enquiry";

assert.equal(WEBSITE_ENQUIRY_SEQUENCE, "website.enquiry");
assert.equal(WEBSITE_ENQUIRY_CATEGORY_NAME, "Website Enquiry");
assert.equal(enquiryReferenceField(), "x_studio_x_enquiry_reference");
assert.equal(enquiryCategoryIdFromEnv(), undefined);

const values = buildPartnerEnquiryValues(
  {
    first_name: "Ada",
    last_name: "Lovelace",
    city: "Muscat",
    country: "Oman",
    email: "ada@example.com",
    phone: "+968 1234 5678",
    heard_from: "Media",
    message: "Need help",
  },
  "ENQ-2026-000001",
  { categoryIds: [42] },
);

assert.equal(values.name, "Ada Lovelace");
assert.equal(values.email, "ada@example.com");
assert.equal(values.phone, "+968 1234 5678");
assert.equal(values.city, "Muscat");
assert.equal(values.x_studio_x_enquiry_reference, "ENQ-2026-000001");
assert.equal(values.ref, "ENQ-2026-000001");
assert.equal(values.x_enquiry_reference, undefined);
assert.deepEqual(values.category_id, [[4, 42]]);
assert.deepEqual(
  (values[enquirySourceField()] as unknown) ?? undefined,
  undefined,
);

const valuesWithSource = buildPartnerEnquiryValues(
  {
    first_name: "Ada",
    last_name: "Lovelace",
    city: "Muscat",
    country: "Oman",
    email: "ada@example.com",
    phone: "+968 1234 5678",
    heard_from: "Media",
    message: "Need help",
  },
  "ENQ-2026-000002",
  { categoryIds: [42], websiteEnquirySourceValue: "Contact Form" },
);

assert.equal(valuesWithSource[enquirySourceField()], "Contact Form");
assert.ok(String(values.comment).includes("Enquiry Reference"));
assert.ok(String(values.comment).includes("Country"));
assert.ok(String(values.comment).includes("Oman"));
assert.ok(String(values.comment).includes("How Did You Hear About Us"));
assert.ok(String(values.comment).includes("Media"));
assert.ok(String(values.comment).includes("Need help"));
assert.ok(String(values.comment).includes("Website Contact Form"));
assert.ok(String(values.comment).includes("<li>"));
assert.ok(!String(values.comment).includes("<script>"));

process.env.ODOO_ENQUIRY_REF_FIELD = "x_enquiry_reference";
assert.equal(
  buildPartnerEnquiryValues(
    {
      first_name: "Ada",
      last_name: "Lovelace",
      city: "Muscat",
      country: "Oman",
      email: "ada@example.com",
      phone: "+968 1234 5678",
      heard_from: "Media",
      message: "Need help",
    },
    "ENQ-2026-000002",
  ).x_enquiry_reference,
  "ENQ-2026-000002",
);
delete process.env.ODOO_ENQUIRY_REF_FIELD;

process.env.ODOO_ENQUIRY_CATEGORY_ID = "99";
assert.equal(enquiryCategoryIdFromEnv(), 99);
delete process.env.ODOO_ENQUIRY_CATEGORY_ID;

const mail = formatContactEnquiryEmail(
  {
    first_name: "Ada",
    last_name: "Lovelace",
    city: "Muscat",
    country: "Oman",
    email: "ada@example.com",
    phone: "+968 1234 5678",
    heard_from: "Media",
    message: "Need help",
  },
  "ENQ-2026-000001",
  new Date("2026-07-29T12:00:00+04:00"),
);

assert.equal(mail.subject, "New Website Enquiry - ENQ-2026-000001");
assert.ok(mail.text.includes("Enquiry Reference: ENQ-2026-000001"));
assert.ok(mail.text.includes("Email: ada@example.com"));
assert.ok(mail.text.includes("Phone: +968 1234 5678"));
assert.ok(mail.text.includes("How Did You Hear About Us: Media"));
assert.ok(mail.text.includes("Date & Time:"));
assert.ok(mail.text.includes("Source: Website Contact Form"));
assert.ok(!mail.text.includes("Quote Ref"));
assert.ok(!mail.text.includes("Request Quote"));

const pending = formatContactEnquiryEmail(
  {
    first_name: "Ada",
    last_name: "Lovelace",
    city: "Muscat",
    country: "Oman",
    email: "ada@example.com",
    phone: "+968 1234 5678",
    heard_from: "Media",
    message: "Need help",
  },
  null,
);
assert.equal(pending.subject, "New Website Enquiry from Ada Lovelace");
assert.ok(pending.text.includes("Enquiry Reference: (unavailable — Odoo sync failed)"));

console.log("odoo/enquiry.check: ok");
