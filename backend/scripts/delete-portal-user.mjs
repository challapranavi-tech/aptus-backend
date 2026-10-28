/**
 * Soft-delete a single customer portal login by email on Odoo partners.
 * Does NOT archive/delete the CRM contact — only clears portal auth fields
 * (same effect as auth-service.ts softDeleteCustomerAccount).
 *
 * Usage (from backend/):
 *   node --env-file=.env.local scripts/delete-portal-user.mjs someone@example.com
 */

function normalizeBase(raw) {
  return String(raw ?? "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/(odoo|web)(\/.*)?$/i, "");
}

const email = (process.argv[2] ?? "").trim().toLowerCase();
if (!email) {
  console.error("Usage: node --env-file=.env.local scripts/delete-portal-user.mjs <email>");
  process.exit(1);
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

console.log(`Deleting portal user ${email} on ${BASE} db=${DB}`);

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
  [[["email", "=ilike", email]]],
  { fields: ["id", "name", "email", "x_portal_account_id", "x_portal_status"], limit: 10 },
]);

if (!partners?.length) {
  console.log(`No partner found with email ${email}. Nothing to do.`);
  process.exit(0);
}

const targets = partners.filter(
  (p) =>
    (typeof p.x_portal_account_id === "string" && p.x_portal_account_id.trim()) ||
    (typeof p.x_portal_status === "string" && p.x_portal_status.trim()),
);

if (!targets.length) {
  console.log(`Partner(s) found for ${email}, but none have a portal login. Nothing to do.`);
  for (const p of partners) console.log(`  #${p.id} ${p.name} (${p.email || "no email"})`);
  process.exit(0);
}

const ids = targets.map((p) => p.id);
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

for (const p of targets) {
  console.log(`  cleared portal login for #${p.id} ${p.email || p.name || ""}`);
}

console.log(`Done. Soft-deleted portal login for ${ids.length} partner(s). CRM record kept.`);
