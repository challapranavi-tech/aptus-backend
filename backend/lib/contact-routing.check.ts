/**
 * Runnable self-check for contact / quote inbox routing.
 * Run: npx --yes tsx backend/lib/contact-routing.check.ts
 */
import assert from "node:assert/strict";
import { resolveContactRouting } from "./contact-routing";

process.env.CONTACT_TO_EMAIL = "contact@example.com";
process.env.SOFTWARE_SALES_EMAIL = "software@example.com";
process.env.ELV_SALES_EMAIL = "elv@example.com";

assert.equal(
  resolveContactRouting({ product: "Others" }).to,
  "contact@example.com",
  "Contact Us → CONTACT_TO_EMAIL",
);
assert.equal(
  resolveContactRouting({ product: "" }).to,
  "contact@example.com",
);
assert.equal(
  resolveContactRouting({ product: "Others" }).categoryLabel,
  "Contact",
);

assert.equal(
  resolveContactRouting({ product: "Revit" }).to,
  "software@example.com",
  "Software quote → SOFTWARE_SALES_EMAIL",
);
assert.equal(
  resolveContactRouting({ product: "Revit" }).categoryLabel,
  "Software",
);

assert.equal(
  resolveContactRouting({
    product: "CCTV Surveillance Solutions",
    categoryHint: "elv",
  }).to,
  "elv@example.com",
  "elv quote → ELV_SALES_EMAIL (internal key unchanged)",
);
assert.equal(
  resolveContactRouting({
    product: "CCTV Surveillance Solutions",
    categoryHint: "elv",
  }).categoryLabel,
  "Infra",
);

assert.equal(
  resolveContactRouting({
    product: "Access Control Systems",
    categoryHint: "software",
    productType: "elv",
  }).category,
  "elv",
  "Product Type ELV overrides a software page hint",
);
assert.equal(
  resolveContactRouting({
    product: "Sketchup",
    categoryHint: "software",
    productType: "solar",
  }).category,
  "solar",
);
assert.equal(
  resolveContactRouting({
    product: "Residential Solar Systems",
    productType: "solar",
  }).categoryLabel,
  "Solar",
);

process.env.SOLAR_SALES_EMAIL = "solar@example.com";
assert.equal(
  resolveContactRouting({
    product: "Residential Solar Systems",
    productType: "solar",
  }).to,
  "solar@example.com",
);
delete process.env.SOLAR_SALES_EMAIL;

delete process.env.SOFTWARE_SALES_EMAIL;
assert.equal(
  resolveContactRouting({ product: "Revit" }).to,
  "contact@example.com",
  "Software quote falls back to CONTACT_TO_EMAIL",
);

console.log("contact-routing.check: ok");
