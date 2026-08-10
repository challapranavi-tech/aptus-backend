/**
 * Runnable self-check for crm.lead payload building (no network).
 * Run: npx --yes tsx backend/lib/odoo/crm.check.ts
 */
import assert from "node:assert/strict";
import { buildCrmLeadValues, crmTeamConfig, REQUEST_QUOTE_SEQUENCE } from "./crm";

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

// Multi-company routing: category decides company_id, no frontend input involved.
process.env.ODOO_SOFTWARE_COMPANY_ID = "1";
process.env.ODOO_ELV_COMPANY_ID = "2";

const softwareLead = buildCrmLeadValues({
  firstName: "Ada",
  lastName: "Lovelace",
  company: "Co",
  email: "ada@example.com",
  phone: "+968111",
  product: "Revit",
  category: "software",
});
assert.equal(softwareLead.company_id, 1);

const elvLead = buildCrmLeadValues({
  firstName: "Ada",
  lastName: "Lovelace",
  company: "Co",
  email: "ada@example.com",
  phone: "+968111",
  product: "CCTV",
  category: "elv",
});
assert.equal(elvLead.company_id, 2);

delete process.env.ODOO_SOFTWARE_COMPANY_ID;
delete process.env.ODOO_ELV_COMPANY_ID;

// Fail-loud, not silent-default: missing env var must throw, never fall
// through to SOFTWARE (the exact "silent misfile" risk this guards against).
assert.throws(() =>
  buildCrmLeadValues({
    firstName: "Ada",
    lastName: "Lovelace",
    company: "Co",
    email: "ada@example.com",
    phone: "+968111",
    product: "Revit",
    category: "software",
  }),
  /ODOO_SOFTWARE_COMPANY_ID/,
);

// Unrecognized category must throw too, not silently map to software.
assert.throws(() =>
  buildCrmLeadValues({
    firstName: "Ada",
    lastName: "Lovelace",
    company: "Co",
    email: "ada@example.com",
    phone: "+968111",
    product: "Revit",
    // @ts-expect-error — runtime guard against a bad value slipping past types
    category: "general",
  }),
  /unrecognized category/,
);

// No category at all (plain contact message — never reaches createCrmLead
// in practice, see app/api/contact/route.ts) must not throw and must omit
// company_id rather than guessing one.
const noCategoryLead = buildCrmLeadValues({
  firstName: "Ada",
  lastName: "Lovelace",
  company: "Co",
  email: "ada@example.com",
  phone: "+968111",
  product: "Revit",
});
assert.equal("company_id" in noCategoryLead, false);

// ── Category-based CRM team/stage routing ───────────────────────────────────
// Separate concern from company_id: unset team/stage is fine (Odoo default),
// so crmTeamConfig doesn't throw — only companyIdForCategory does.

// No env set → both undefined
delete process.env.ODOO_CRM_TEAM_ID;
delete process.env.ODOO_CRM_STAGE_ID;
delete process.env.ODOO_CRM_SOFTWARE_TEAM_ID;
delete process.env.ODOO_CRM_SOFTWARE_STAGE_ID;
delete process.env.ODOO_CRM_ELV_TEAM_ID;
delete process.env.ODOO_CRM_ELV_STAGE_ID;

const noEnv = crmTeamConfig("software");
assert.equal(noEnv.teamId, undefined);
assert.equal(noEnv.stageId, undefined);

// Category-specific env takes priority
process.env.ODOO_CRM_SOFTWARE_TEAM_ID = "10";
process.env.ODOO_CRM_ELV_TEAM_ID = "20";
process.env.ODOO_CRM_TEAM_ID = "99"; // legacy fallback — should NOT win

const softwareTeam = crmTeamConfig("software");
assert.equal(softwareTeam.teamId, 10, "software team should use ODOO_CRM_SOFTWARE_TEAM_ID");

const elvTeam = crmTeamConfig("elv");
assert.equal(elvTeam.teamId, 20, "elv team should use ODOO_CRM_ELV_TEAM_ID");

// Falls back to legacy ODOO_CRM_TEAM_ID when category-specific var absent
delete process.env.ODOO_CRM_SOFTWARE_TEAM_ID;
delete process.env.ODOO_CRM_ELV_TEAM_ID;
const fallback = crmTeamConfig("software");
assert.equal(fallback.teamId, 99, "should fall back to ODOO_CRM_TEAM_ID");
const fallbackElv = crmTeamConfig("elv");
assert.equal(fallbackElv.teamId, 99, "elv should also fall back to ODOO_CRM_TEAM_ID");

// undefined category behaves like software
delete process.env.ODOO_CRM_TEAM_ID;
process.env.ODOO_CRM_SOFTWARE_TEAM_ID = "5";
const noCategory = crmTeamConfig(undefined);
assert.equal(noCategory.teamId, 5);
delete process.env.ODOO_CRM_SOFTWARE_TEAM_ID;

// buildCrmLeadValues writes team_id when category-specific env is present.
// company_id is a separate, fail-loud concern — set it here so this section
// can exercise team/stage routing without also throwing on company_id.
process.env.ODOO_SOFTWARE_COMPANY_ID = "1";
process.env.ODOO_ELV_COMPANY_ID = "2";

const elvValues = buildCrmLeadValues({
  firstName: "Test",
  lastName: "User",
  company: "Co",
  email: "test@example.com",
  phone: "+968 0000 0000",
  product: "CCTV Surveillance Solutions",
  qty: "1",
  categoryLabel: "Infra",
  category: "elv",
  quoteRef: "RQ-2026-000099",
});
// team_id unset when no ELV-specific env
assert.equal(elvValues.team_id, undefined);

process.env.ODOO_CRM_ELV_TEAM_ID = "42";
const elvValuesWithTeam = buildCrmLeadValues({
  firstName: "Test",
  lastName: "User",
  company: "Co",
  email: "test@example.com",
  phone: "+968 0000 0000",
  product: "CCTV Surveillance Solutions",
  qty: "1",
  categoryLabel: "Infra",
  category: "elv",
  quoteRef: "RQ-2026-000099",
});
assert.equal(elvValuesWithTeam.team_id, 42, "ELV lead should carry team_id=42");

// Clean up
[
  "ODOO_SOFTWARE_COMPANY_ID", "ODOO_ELV_COMPANY_ID",
  "ODOO_CRM_TEAM_ID", "ODOO_CRM_STAGE_ID",
  "ODOO_CRM_SOFTWARE_TEAM_ID", "ODOO_CRM_SOFTWARE_STAGE_ID",
  "ODOO_CRM_ELV_TEAM_ID", "ODOO_CRM_ELV_STAGE_ID",
].forEach((k) => delete process.env[k]);

console.log("crm.check: ok");
