/**
 * Ensure x_case_studies_sections_json exists on website.page (creates via API if missing).
 * Usage: node scripts/setup-case-studies-json-field.mjs
 */

import path from "path";
import { fileURLToPath } from "url";
import { loadEnvLocal } from "./load-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const FIELD_NAME =
  process.env.ODOO_CMS_CASE_STUDIES_JSON_FIELD?.trim() || "x_case_studies_sections_json";

loadEnvLocal(ROOT);

async function odooCall(model, method, body) {
  const baseUrl = (process.env.ODOO_BASE_URL ?? "").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/json/2/${model}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.ODOO_API_KEY ?? ""}`,
      "Content-Type": "application/json",
      "X-Odoo-Database": process.env.ODOO_DB ?? "",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

const [pageModel] = await odooCall("ir.model", "search_read", {
  domain: [["model", "=", "website.page"]],
  fields: ["id", "model"],
  limit: 1,
});

if (!pageModel) {
  console.error("website.page model not found");
  process.exit(1);
}

const existing = await odooCall("ir.model.fields", "search_read", {
  domain: [["model", "=", "website.page"], ["name", "=", FIELD_NAME]],
  fields: ["id", "name", "ttype"],
  limit: 1,
});

if (existing.length) {
  console.log(`Field already exists: ${FIELD_NAME} (id=${existing[0].id})`);
} else {
  const [fieldId] = await odooCall("ir.model.fields", "create", {
    vals_list: [
      {
        model_id: pageModel.id,
        name: FIELD_NAME,
        field_description: "Case Studies Page Sections JSON (Next.js)",
        ttype: "text",
        state: "manual",
      },
    ],
  });
  console.log(`Created field ${FIELD_NAME} (id=${fieldId})`);
}

console.log("\nNext: npm run cms:seed-case-studies");
