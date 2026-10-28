/**
 * scripts/list-companies.mjs
 *
 * Lists res.company records (id, name, parent) for whichever Odoo the loaded
 * env points at. Use this to find ODOO_SOFTWARE_COMPANY_ID / ODOO_ELV_COMPANY_ID
 * for a new environment (e.g. production) — same lookup done for staging.
 *
 * Usage:
 *   node --env-file=.env.local scripts/list-companies.mjs
 *   node --env-file=.env.production.local scripts/list-companies.mjs
 */

const REQUIRED = ["ODOO_URL", "ODOO_DB", "ODOO_USER", "ODOO_API_KEY"];
const missing = REQUIRED.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error("Missing required env vars:", missing.join(", "));
  process.exit(1);
}

const BASE = process.env.ODOO_URL.replace(/\/$/, "");
const DB = process.env.ODOO_DB;
const USER = process.env.ODOO_USER;
const KEY = process.env.ODOO_API_KEY;

let _id = 0;
async function rpc(service, method, args) {
  const res = await fetch(`${BASE}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++_id, method: "call", params: { service, method, args } }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.data?.message ?? json.error.message ?? "RPC error");
  return json.result;
}

async function main() {
  const uid = await rpc("common", "authenticate", [DB, USER, KEY, {}]);
  if (!uid) throw new Error("Auth failed — check ODOO_USER and ODOO_API_KEY.");

  const companies = await rpc("object", "execute_kw", [
    DB, uid, KEY, "res.company", "search_read",
    [[]],
    { fields: ["id", "name", "parent_id"] },
  ]);

  console.log(`db=${DB}`);
  console.table(
    companies.map((c) => ({
      id: c.id,
      name: c.name,
      parent: Array.isArray(c.parent_id) ? c.parent_id[1] : "—",
    })),
  );
}

main().catch((err) => {
  console.error("\n[FATAL]", err.message);
  process.exit(1);
});
