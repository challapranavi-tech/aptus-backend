/**
 * Ensure x_homepage_sections_json exists on website.page (creates via JSON-RPC).
 *
 * Usage (from backend/):
 *   node --env-file=.env.local scripts/setup-homepage-json-field.mjs
 */
function normalizeBase(raw) {
  return String(raw ?? "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/(odoo|web)(\/.*)?$/i, "");
}

const BASE = normalizeBase(process.env.ODOO_URL);
const DB = (process.env.ODOO_DB ?? "").trim();
const USER = (process.env.ODOO_USER ?? "").trim();
const KEY = (process.env.ODOO_API_KEY ?? "").trim();
const FIELD =
  process.env.ODOO_CMS_HOMEPAGE_JSON_FIELD?.trim() || "x_homepage_sections_json";

if (!BASE || !DB || !USER || !KEY) {
  console.error("Missing ODOO_URL / ODOO_DB / ODOO_USER / ODOO_API_KEY");
  process.exit(1);
}

let id = 0;
async function rpc(service, method, args) {
  const res = await fetch(`${BASE}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: ++id,
      method: "call",
      params: { service, method, args },
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.data?.message ?? json.error.message);
  return json.result;
}

console.log(`Odoo ${BASE} db=${DB} user=${USER}`);

const uid = await rpc("common", "authenticate", [DB, USER, KEY, {}]);
if (!uid) {
  console.error("Auth failed");
  process.exit(1);
}
console.log(`Authenticated uid=${uid}`);

const models = await rpc("object", "execute_kw", [
  DB,
  uid,
  KEY,
  "ir.model",
  "search_read",
  [[["model", "=", "website.page"]]],
  { fields: ["id", "model"], limit: 1 },
]);
const pageModel = models[0];
if (!pageModel) {
  console.error("website.page model not found");
  process.exit(1);
}

const existing = await rpc("object", "execute_kw", [
  DB,
  uid,
  KEY,
  "ir.model.fields",
  "search_read",
  [[["model", "=", "website.page"], ["name", "=", FIELD]]],
  { fields: ["id", "name", "ttype"], limit: 1 },
]);

if (existing.length) {
  console.log(`Field already exists: ${FIELD} (id=${existing[0].id})`);
} else {
  const fieldId = await rpc("object", "execute_kw", [
    DB,
    uid,
    KEY,
    "ir.model.fields",
    "create",
    [
      {
        model_id: pageModel.id,
        name: FIELD,
        field_description: "Homepage Sections JSON (Next.js)",
        ttype: "text",
        state: "manual",
      },
    ],
  ]);
  console.log(`Created field ${FIELD} (id=${fieldId})`);
}

console.log("\nNext: node --env-file=.env.local scripts/seed-home-json.mjs");
