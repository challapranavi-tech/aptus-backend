/**
 * List all website.page records on Odoo staging.
 * Usage: node scripts/list-odoo-pages.mjs
 */

import path from "path";
import { fileURLToPath } from "url";
import { loadEnvLocal } from "./load-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

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

const cmsWebsiteId = Number(process.env.ODOO_CMS_WEBSITE_ID || 0) || null;

const FIELDS = [
  "id",
  "name",
  "url",
  "is_published",
  "website_published",
  "header_visible",
  "footer_visible",
  "website_id",
];

const pages = await odooCall("website.page", "search_read", {
  domain: [],
  fields: FIELDS,
  limit: 500,
});

const filtered = cmsWebsiteId
  ? pages.filter((p) => Array.isArray(p.website_id) && p.website_id[0] === cmsWebsiteId)
  : pages;

console.log(`Found ${pages.length} website.page record(s)`);
if (cmsWebsiteId) {
  console.log(`On website_id=${cmsWebsiteId}: ${filtered.length} record(s)`);
}
console.log("");

const published = filtered.filter((p) => p.is_published || p.website_published);
console.log(`Published: ${published.length} | Draft: ${filtered.length - published.length}\n`);

for (const page of filtered.sort((a, b) => (a.url ?? "").localeCompare(b.url ?? ""))) {
  const pub = page.is_published || page.website_published;
  const website = Array.isArray(page.website_id) ? page.website_id[1] : "none";
  console.log(
    `${pub ? "[PUB]" : "[DRAFT]"} id=${page.id} ${page.url ?? "/"} — ${page.name} (${website})`,
  );
}

console.log("\nRun `npm run cms:audit` for duplicate URL analysis and homepage pin recommendations.");
