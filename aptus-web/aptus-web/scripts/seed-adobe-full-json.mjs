/**
 * Seed full Adobe page JSON (live-site content) into Odoo.
 * Usage: node scripts/seed-adobe-full-json.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadEnvLocal } from "./load-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const JSON_DIR = path.join(ROOT, "content", "odoo-json", "adobe");

loadEnvLocal(ROOT);

const FIELD_NAME = process.env.ODOO_CMS_PAGE_JSON_FIELD?.trim() || "x_page_sections_json";

const PAGE_IDS = {
  "adobe-hub.json": 177,
  "adobe-business-creative-solutions.json": 254,
  "adobe-acrobat-pro.json": 255,
  "adobe-illustrator.json": 256,
  "adobe-photoshop.json": 257,
  "adobe-premiere-pro.json": 258,
};

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

for (const [file, id] of Object.entries(PAGE_IDS)) {
  const filePath = path.join(JSON_DIR, file);
  const jsonString = fs.readFileSync(filePath, "utf8");
  JSON.parse(jsonString);
  await odooCall("website.page", "write", {
    ids: [id],
    vals: { [FIELD_NAME]: jsonString },
  });
  console.log(`Seeded ${file} on id=${id}`);
}

console.log("\nDone. Test http://localhost:3000/adobe");
