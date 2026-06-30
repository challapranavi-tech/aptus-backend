/**
 * Seed full Page Sections JSON for Microsoft hub + product pages in Odoo.
 * Usage: node scripts/seed-microsoft-pages-json.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadEnvLocal } from "./load-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const JSON_DIR = path.join(ROOT, "content", "odoo-json", "microsoft");

loadEnvLocal(ROOT);

const FIELD_NAME = process.env.ODOO_CMS_PAGE_JSON_FIELD?.trim() || "x_page_sections_json";

const PAGES = [
  { url: "/microsoft", file: "microsoft-hub.json", pageId: 178 },
  { url: "/microsoft-365-apps", file: "microsoft-365-apps.json", pageId: 193 },
  { url: "/microsoft-365-business", file: "microsoft-365-business.json", pageId: 196 },
  { url: "/microsoft-visio", file: "microsoft-visio.json", pageId: 222 },
  { url: "/power-bi", file: "power-bi.json", pageId: 198 },
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

let seeded = 0;
let missing = 0;

for (const page of PAGES) {
  const filePath = path.join(JSON_DIR, page.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`Skip (JSON missing): ${page.file} — run npm run cms:export-microsoft-json`);
    missing += 1;
    continue;
  }

  const jsonString = fs.readFileSync(filePath, "utf8");
  JSON.parse(jsonString);

  await odooCall("website.page", "write", {
    ids: [page.pageId],
    vals: { [FIELD_NAME]: jsonString },
  });

  console.log(`Seeded ${page.file} on id=${page.pageId} (${page.url})`);
  seeded += 1;
}

console.log(`\nDone: ${seeded} seeded, ${missing} missing.`);
console.log("Test: http://localhost:3000/microsoft");
