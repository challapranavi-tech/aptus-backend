/**
 * Soft-delete all customer portal logins on Odoo partners.
 * Does NOT archive/delete CRM contacts — only clears portal auth fields.
 *
 * Usage (from frontend/):
 *   node --env-file=.env.local ../backend/scripts/clear-portal-users.mjs
 * Or (from backend/ with same Odoo env):
 *   node --env-file=.env.local scripts/clear-portal-users.mjs
 */

function normalizeBase(raw) {
  return String(raw ?? "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/(odoo|web)(\/.*)?$/i, "");
}

const BASE = normalizeBase(process.env.ODOO_BASE_URL || process.env.ODOO_URL);
const DB = (process.env.ODOO_DB ?? "").trim();
const USER = (process.env.ODOO_USER ?? "").trim();
const KEY = (process.env.ODOO_API_KEY ?? "").trim();

if (!BASE || !DB || !USER || !KEY) {
  console.error("Missing ODOO_BASE_URL/ODOO_URL, ODOO_DB, ODOO_USER, ODOO_API_KEY");
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
  if (json.error) {
    throw new Error(json.error.data?.message ?? json.error.message ?? "RPC error");
  }
  return json.result;
}

console.log(`Clearing portal users on ${BASE} db=${DB}`);

const uid = await rpc("common", "authenticate", [DB, USER, KEY, {}]);
if (!uid) {
  console.error("Odoo authentication failed");
  process.exit(1);
}

const partners = await rpc("object", "execute_kw", [
  DB,
  uid,
  KEY,
  "res.partner",
  "search_read",
  [
    [
      "|",
      "|",
      ["x_portal_account_id", "!=", false],
      ["x_portal_password_hash", "!=", false],
      ["x_portal_status", "!=", false],
    ],
  ],
  { fields: ["id", "name", "email", "x_portal_account_id", "x_portal_status"], limit: 5000 },
]);

const withPortal = (partners ?? []).filter((p) => {
  const account = typeof p.x_portal_account_id === "string" && p.x_portal_account_id.trim();
  const status = typeof p.x_portal_status === "string" && p.x_portal_status.trim();
  return Boolean(account || status);
});

console.log(`Found ${withPortal.length} portal-linked partner(s)`);

if (!withPortal.length) {
  console.log("Nothing to clear.");
  process.exit(0);
}

const ids = withPortal.map((p) => p.id);
await rpc("object", "execute_kw", [
  DB,
  uid,
  KEY,
  "res.partner",
  "write",
  [
    ids,
    {
      x_portal_status: "deleted",
      x_portal_password_hash: "",
      x_portal_account_id: "",
      x_portal_created_at: "",
      x_portal_last_login: "",
    },
  ],
]);

for (const p of withPortal) {
  console.log(`  cleared #${p.id} ${p.email || p.name || ""}`);
}

console.log(`Done. Soft-deleted portal login for ${ids.length} partner(s). CRM records kept.`);
