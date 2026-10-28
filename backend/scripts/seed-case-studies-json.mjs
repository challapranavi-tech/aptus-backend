/**
 * Seed /aptus-case-studies from content/odoo-json/case-studies/aptus-case-studies.json
 * into Odoo's x_case_studies_sections_json (separate field/schema from the
 * generic page-json pages — see lib/odoo/case-studies-json-mapper.ts).
 * Usage: node --env-file=.env.local scripts/seed-case-studies-json.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const FILE = path.join(ROOT, "content", "odoo-json", "case-studies", "aptus-case-studies.json");
const ROUTE = "/aptus-case-studies";

const BASE = (process.env.ODOO_URL ?? "").replace(/\/$/, "");
const DB = process.env.ODOO_DB ?? "";
const USER = process.env.ODOO_USER ?? "";
const KEY = process.env.ODOO_API_KEY ?? "";
const WEBSITE_ID = Number(process.env.ODOO_WEBSITE_ID ?? 7);

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

const jsonString = fs.readFileSync(FILE, "utf8");
JSON.parse(jsonString);

const uid = await rpc("common", "authenticate", [DB, USER, KEY, {}]);
if (!uid) throw new Error("Odoo auth failed");

const rows = await rpc("object", "execute_kw", [
  DB, uid, KEY, "website.page", "search_read",
  [[["url", "=", ROUTE], ["website_id", "=", WEBSITE_ID]], ["id", "url"]],
  { limit: 1 },
]);

if (!rows[0]) {
  throw new Error(`No website.page for ${ROUTE} on website ${WEBSITE_ID}`);
}

await rpc("object", "execute_kw", [
  DB, uid, KEY, "website.page", "write",
  [[rows[0].id], { x_case_studies_sections_json: jsonString, is_published: true, website_published: true }],
]);

console.log(`Seeded ${ROUTE} → id=${rows[0].id} (${jsonString.length} bytes)`);
