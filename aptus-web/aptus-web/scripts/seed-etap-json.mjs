/**
 * Seed ETAP page (/etap) with default section JSON from content/odoo-json/etap/etap-sections.json.
 * Usage: node scripts/seed-etap-json.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadEnvLocal } from "./load-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

loadEnvLocal(ROOT);

const FIELD_NAME = process.env.ODOO_CMS_ETAP_JSON_FIELD?.trim() || "x_etap_sections_json";
const PAGE_URL = process.env.ODOO_CMS_ETAP_PAGE_URL?.trim() || "/etap";
const PINNED_PAGE_ID = Number(process.env.ODOO_CMS_ETAP_PAGE_ID || 175);
const WEBSITE_ID = Number(process.env.ODOO_CMS_WEBSITE_ID || 0);

const sectionsPath = path.join(ROOT, "content", "odoo-json", "etap", "etap-sections.json");
const SECTIONS_JSON = JSON.parse(fs.readFileSync(sectionsPath, "utf8"));

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

async function resolvePageId() {
  if (PINNED_PAGE_ID > 0) {
    const rows = await odooCall("website.page", "search_read", {
      domain: [["id", "=", PINNED_PAGE_ID]],
      fields: ["id", "name", "url"],
      limit: 1,
    });
    if (rows.length) return rows[0].id;
  }

  const domain = [["url", "=", PAGE_URL]];
  if (WEBSITE_ID > 0) domain.push(["website_id", "=", WEBSITE_ID]);

  const rows = await odooCall("website.page", "search_read", {
    domain,
    fields: ["id", "name", "url", "website_id"],
    limit: 5,
  });

  if (!rows.length) {
    throw new Error(`No website.page found for url=${PAGE_URL} (website_id=${WEBSITE_ID || "any"})`);
  }

  return rows[0].id;
}

const pageId = await resolvePageId();
const jsonString = JSON.stringify(SECTIONS_JSON, null, 2);

await odooCall("website.page", "write", {
  ids: [pageId],
  vals: { [FIELD_NAME]: jsonString },
});

console.log(`Seeded ${FIELD_NAME} on website.page id=${pageId} (${PAGE_URL})`);
console.log(`JSON size: ${jsonString.length} chars`);
console.log("\nAdd field to Odoo form via Studio: ETAP Page Sections JSON (Next.js)");
console.log("Then refresh http://localhost:3000/etap");
