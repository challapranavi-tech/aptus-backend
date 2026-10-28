/**
 * Runnable self-check for Contact Form enquiry request parsing.
 * Run: npx --yes tsx shared/lib/enquiry-request.check.ts
 */
import assert from "node:assert/strict";
import { parseEnquiryRequest, validateEnquiryFields } from "./enquiry-request";

const ok = parseEnquiryRequest({
  first_name: "Ada",
  last_name: "Lovelace",
  city: "Muscat",
  country: "Oman",
  email: "Ada@Example.com",
  phone: "+968 1234 5678",
  heard_from: "Media",
  message: "Need guidance",
});
assert.equal(ok.ok, true);
if (ok.ok) {
  assert.equal(ok.data.email, "ada@example.com");
  assert.equal(ok.data.city, "Muscat");
  assert.equal(ok.data.country, "Oman");
  assert.equal(ok.data.heard_from, "Media");
}

// state alias → country (non–contact-page variant)
const aliased = parseEnquiryRequest({
  first_name: "Sam",
  last_name: "Lee",
  city: "Dubai",
  state: "UAE",
  email: "sam@example.com",
  phone: "+971501234567",
  heard_from: "LinkedIn",
  message: "Hello",
});
assert.equal(aliased.ok, true);
if (aliased.ok) assert.equal(aliased.data.country, "UAE");

assert.equal(
  parseEnquiryRequest({
    first_name: "Ada",
    last_name: "Lovelace",
    city: "Muscat",
    country: "Oman",
    email: "not-an-email",
    phone: "+968 1234 5678",
    heard_from: "Media",
    message: "x",
  }).ok,
  false,
);

assert.equal(
  parseEnquiryRequest({
    first_name: "Ada",
    last_name: "Lovelace",
    city: "Muscat",
    country: "Oman",
    email: "ada@example.com",
    phone: "+968 1234 5678",
    heard_from: "Not A Real Channel",
    message: "x",
  }).ok,
  false,
);

// Quote-only fields must not sneak into enquiry parse
const stripped = parseEnquiryRequest({
  first_name: "Ada",
  last_name: "Lovelace",
  city: "Muscat",
  country: "Oman",
  email: "ada@example.com",
  phone: "+968 1234 5678",
  heard_from: "Media",
  message: "x",
  product: "Revit",
  qty: "3",
});
assert.equal(stripped.ok, true);

assert.deepEqual(
  Object.keys(
    validateEnquiryFields({
      first_name: "",
      last_name: "A",
      city: "",
      country: "",
      email: "bad",
      phone: "12",
      heard_from: "",
      message: "",
    }),
  ).sort(),
  ["city", "country", "email", "first_name", "heard_from", "last_name", "message", "phone"],
);

assert.equal(
  Object.keys(
    validateEnquiryFields({
      first_name: "Ada",
      last_name: "Lovelace",
      city: "Muscat",
      country: "Oman",
      email: "ada@example.com",
      phone: "+968 1234 5678",
      heard_from: "Media",
      message: "Hello",
    }),
  ).length,
  0,
);

console.log("enquiry-request.check: ok");
