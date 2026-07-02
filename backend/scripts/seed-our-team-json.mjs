/**
 * Seed /our-team page sections in Odoo (website 7) — matches live + QWeb embed.
 * Usage: node --env-file=.env.local scripts/seed-our-team-json.mjs
 */

import { readFileSync } from "fs";

const BASE = (process.env.ODOO_URL ?? "").replace(/\/$/, "");
const DB = process.env.ODOO_DB ?? "";
const USER = process.env.ODOO_USER ?? "";
const KEY = process.env.ODOO_API_KEY ?? "";
const FIELD = process.env.ODOO_CMS_PAGE_JSON_FIELD?.trim() || "x_page_sections_json";
const PAGE_ID = 227;

const sections = JSON.parse(readFileSync("content/odoo-json/our-team.json", "utf8"));

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

console.log(`Seeded ${FIELD} on website.page id=${PAGE_ID} (/our-team)`);
console.log("Members:", sections.team?.members?.length ?? 0);
console.log("Test: http://localhost:3004/our-team");
