/**
 * Runnable self-check for Contact Form enquiry email template.
 * Run: npx --yes tsx backend/lib/enquiry-email.check.ts
 */
import assert from "node:assert/strict";
import {
  contactEnquiryInbox,
  formatContactEnquiryEmail,
} from "./enquiry-email";

process.env.CONTACT_TO_EMAIL = "info@aptusinfotech.com";
assert.equal(contactEnquiryInbox(), "info@aptusinfotech.com");

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
assert.ok(!mail.text.includes("Quote Ref"));
assert.ok(mail.text.includes("Name: Ada Lovelace"));
assert.ok(mail.text.includes("City: Muscat"));
assert.ok(mail.text.includes("Country: Oman"));
assert.ok(mail.text.includes("Email: ada@example.com"));
assert.ok(mail.text.includes("Phone: +968 1234 5678"));
assert.ok(mail.text.includes("How Did You Hear About Us: Media"));
assert.ok(mail.text.includes("Message: Need help"));
assert.ok(mail.text.includes("Date & Time:"));
assert.ok(mail.text.includes("Source: Website Contact Form"));
assert.ok(!mail.text.includes("Request Quote"));

const degraded = formatContactEnquiryEmail(
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
assert.equal(degraded.subject, "New Website Enquiry from Ada Lovelace");
assert.ok(
  degraded.text.includes("Enquiry Reference: (unavailable — Odoo sync failed)"),
);

console.log("enquiry-email.check: ok");
