/**
 * Seed /autodesk landing page from content/odoo-json/autodesk.json into Odoo.
 * Usage: node --env-file=.env.local scripts/seed-autodesk-json.mjs
 */

import { readFileSync } from "fs";

const PAGE_ID = Number(process.env.ODOO_AUTODESK_PAGE_ID ?? "162");
const BASE = (process.env.ODOO_URL ?? "").replace(/\/$/, "");
const DB = process.env.ODOO_DB ?? "";
const USER = process.env.ODOO_USER ?? "";
const KEY = process.env.ODOO_API_KEY ?? "";
const FIELD = process.env.ODOO_CMS_PAGE_JSON_FIELD?.trim() || "x_page_sections_json";

let id = 0;
async function rpc(service, method, args) {
  const res = await fetch(`${BASE}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method: "call", params: { service, method, args } }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.data?.message ?? json.error.message);
  return json.result;
}

const sections = JSON.parse(readFileSync("content/odoo-json/autodesk.json", "utf8"));

const uid = await rpc("common", "authenticate", [DB, USER, KEY, {}]);
if (!uid) throw new Error("Odoo auth failed");

await rpc("object", "execute_kw", [
  DB,
  uid,
  KEY,
  "website.page",
  "write",
  [[PAGE_ID], { [FIELD]: JSON.stringify(sections, null, 2), is_published: true, website_published: true }],
]);

console.log(`Seeded autodesk → website.page id ${PAGE_ID} (${FIELD})`);
console.log("Test: http://localhost:3000/autodesk (hard-refresh after ~60s ISR)");
