/**
 * Seed full Page Sections JSON for Oracle hub + product pages in Odoo.
 * Usage: node scripts/seed-oracle-pages-json.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadEnvLocal } from "./load-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const JSON_DIR = path.join(ROOT, "content", "odoo-json", "oracle");

loadEnvLocal(ROOT);

const FIELD_NAME = process.env.ODOO_CMS_PAGE_JSON_FIELD?.trim() || "x_page_sections_json";

const PAGES = [
  { url: "/oracle", file: "oracle-hub.json", pageId: 279 },
  { url: "/oracle-primavera-p6", file: "oracle-primavera-p6.json", pageId: 176 },
  { url: "/aconex", file: "aconex.json", pageId: 221 },
];

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

async function findPageIdByUrl(url) {
  const cmsWebsiteId = Number(process.env.ODOO_CMS_WEBSITE_ID || 0);
  const domain = cmsWebsiteId
    ? [["url", "=", url], ["website_id", "=", cmsWebsiteId]]
    : [["url", "=", url]];

  const rows = await odooCall("website.page", "search_read", {
    domain,
    fields: ["id", "url", "name"],
    limit: 1,
    order: "id desc",
  });

  return rows[0] ?? null;
}

let seeded = 0;
let missing = 0;

for (const page of PAGES) {
  const filePath = path.join(JSON_DIR, page.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`Skip (JSON missing): ${page.file} — run npm run cms:export-oracle-json`);
    missing += 1;
    continue;
  }

  const jsonString = fs.readFileSync(filePath, "utf8");
  JSON.parse(jsonString);

  const row = page.pageId ? { id: page.pageId } : await findPageIdByUrl(page.url);
  if (!row) {
    console.warn(`Skip (not found in Odoo): ${page.url}`);
    missing += 1;
    continue;
  }

  await odooCall("website.page", "write", {
    ids: [row.id],
    vals: { [FIELD_NAME]: jsonString },
  });

  console.log(`Seeded ${page.file} on id=${row.id} (${page.url})`);
  seeded += 1;
}

console.log(`\nDone: ${seeded} seeded, ${missing} missing.`);
console.log("Test: http://localhost:3000/oracle");
