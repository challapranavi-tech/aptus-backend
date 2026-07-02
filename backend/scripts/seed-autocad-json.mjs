/**
 * Seed /autocad product page from content/odoo-json/autodesk/autocad.json into Odoo.
 * Usage: node --env-file=.env.local scripts/seed-autocad-json.mjs
 */

import { readFileSync } from "fs";

const PAGE_URL = process.env.ODOO_AUTOCAD_PAGE_URL?.trim() || "/autocad";
const PAGE_ID = process.env.ODOO_AUTOCAD_PAGE_ID?.trim();
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

const sections = JSON.parse(
  readFileSync("content/odoo-json/autodesk/autocad.json", "utf8"),
);

const uid = await rpc("common", "authenticate", [DB, USER, KEY, {}]);
if (!uid) throw new Error("Odoo auth failed");

let pageId = PAGE_ID ? Number(PAGE_ID) : null;
if (!pageId) {
  const rows = await rpc("object", "execute_kw", [
    DB,
    uid,
    KEY,
    "website.page",
    "search_read",
    [[["url", "=", PAGE_URL]], ["id", "url", "name"]],
    { limit: 1, order: "id desc" },
  ]);
  if (!rows[0]) throw new Error(`website.page not found for url ${PAGE_URL}`);
  pageId = rows[0].id;
}

await rpc("object", "execute_kw", [
  DB,
  uid,
  KEY,
  "website.page",
  "write",
  [[pageId], { [FIELD]: JSON.stringify(sections, null, 2), is_published: true, website_published: true }],
]);

console.log(`Seeded autocad → website.page id ${pageId} (${FIELD})`);
console.log("Test: http://localhost:3000/autocad (hard-refresh after ~60s ISR)");
