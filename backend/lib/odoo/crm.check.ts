/**
 * Runnable self-check for crm.lead payload building (no network).
 * Run: npx --yes tsx backend/lib/odoo/crm.check.ts
 */
import assert from "node:assert/strict";
import { buildCrmLeadValues, REQUEST_QUOTE_SEQUENCE } from "./crm";

assert.equal(REQUEST_QUOTE_SEQUENCE, "request.quote");

const quote = buildCrmLeadValues({
  firstName: "Ada",
  lastName: "Lovelace",
  company: "Analytical Engines",
  email: "ada@example.com",
  phone: "+968 1234 5678",
  product: "Revit",
  qty: "2",
  categoryLabel: "Software",
  message: "Need licenses",
  quoteRef: "RQ-2026-000001",
});

assert.equal(quote.name, "Request a Quote – Revit (RQ-2026-000001)");
assert.equal(quote.contact_name, "Ada Lovelace");
assert.equal(quote.partner_name, "Analytical Engines");
assert.equal(quote.email_from, "ada@example.com");
assert.equal(quote.phone, "+968 1234 5678");
assert.equal(quote.type, "opportunity");
assert.equal(quote.user_id, false);
assert.equal(
  quote.description,
  "Quote Ref: RQ-2026-000001, Client Message: Need licenses, Product: Revit, QTY: 2, Category: Software, Source: Website – Request Quote",
);

process.env.ODOO_QUOTE_REF_FIELD = "x_studio_quote_ref";
const withField = buildCrmLeadValues({
  firstName: "Ada",
  lastName: "Lovelace",
  company: "Co",
  email: "ada@example.com",
  phone: "+968 1234 5678",
  product: "Revit",
  qty: "1",
  quoteRef: "RQ-2026-000002",
});
assert.equal(withField.x_studio_quote_ref, "RQ-2026-000002");
delete process.env.ODOO_QUOTE_REF_FIELD;

const contact = buildCrmLeadValues({
  firstName: "Sam",
  lastName: "Lee",
  company: "Acme",
  email: "sam@example.com",
  phone: "+968111",
  product: "Others",
});
assert.equal(contact.name, "Website contact – Sam Lee");

console.log("crm.check: ok");
