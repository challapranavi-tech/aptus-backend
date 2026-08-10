/**
 * Ensure customer-portal Char fields exist on res.partner (JSON-RPC).
 *
 * Fields:
 *   x_portal_password_hash  — scrypt password hash
 *   x_portal_account_id     — unique portal account UUID
 *   x_portal_status         — active | disabled | deleted
 *   x_portal_created_at     — ISO registration timestamp
 *   x_portal_last_login     — ISO last-login timestamp
 *
 * Usage (from backend/):
 *   node --env-file=.env.local scripts/ensure-portal-partner-fields.mjs
 *
 * Manual Studio fallback (if API user cannot create fields):
 *   Odoo → Settings → Technical → Studio (or Settings → Technical → Database Structure → Fields)
 *   Model: Contact (res.partner) → create each Char field with the names above.
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

const PORTAL_FIELDS = [
  {
    name: "x_portal_password_hash",
    field_description: "Portal Password Hash",
  },
  {
    name: "x_portal_account_id",
    field_description: "Portal Account ID",
  },
  {
    name: "x_portal_status",
    field_description: "Portal Status",
  },
  {
    name: "x_portal_created_at",
    field_description: "Portal Created At",
  },
  {
    name: "x_portal_last_login",
    field_description: "Portal Last Login",
  },
];

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
  if (json.error) {
    throw new Error(json.error.data?.message ?? json.error.message ?? "RPC error");
  }
  return json.result;
}

console.log(`Odoo ${BASE} db=${DB} user=${USER}`);

const uid = await rpc("common", "authenticate", [DB, USER, KEY, {}]);
if (!uid) {
  console.error("Auth failed — check ODOO_USER and ODOO_API_KEY");
  process.exit(1);
}
console.log(`Authenticated uid=${uid}`);

const models = await rpc("object", "execute_kw", [
  DB,
  uid,
  KEY,
  "ir.model",
  "search_read",
  [[["model", "=", "res.partner"]]],
  { fields: ["id", "model"], limit: 1 },
]);
const partnerModel = models[0];
if (!partnerModel) {
  console.error("res.partner model not found");
  process.exit(1);
}

let created = 0;
let existing = 0;

for (const field of PORTAL_FIELDS) {
  const found = await rpc("object", "execute_kw", [
    DB,
    uid,
    KEY,
    "ir.model.fields",
    "search_read",
    [[["model", "=", "res.partner"], ["name", "=", field.name]]],
    { fields: ["id", "name", "ttype"], limit: 1 },
  ]);

  if (found.length) {
    console.log(`OK  ${field.name} (id=${found[0].id}, ttype=${found[0].ttype})`);
    existing += 1;
    continue;
  }

  try {
    const fieldId = await rpc("object", "execute_kw", [
      DB,
      uid,
      KEY,
      "ir.model.fields",
      "create",
      [
        {
          model_id: partnerModel.id,
          name: field.name,
          field_description: field.field_description,
          ttype: "char",
          state: "manual",
        },
      ],
    ]);
    console.log(`NEW ${field.name} (id=${fieldId})`);
    created += 1;
  } catch (err) {
    console.error(`FAIL ${field.name}: ${err.message}`);
    console.error(
      "  Manual fallback: Odoo Studio → Contact (res.partner) → add Char field with this name.",
    );
    process.exitCode = 1;
  }
}

console.log(`\nDone. existing=${existing} created=${created}`);
if (process.exitCode) {
  console.log(
    "Some fields could not be created via API. Create them in Studio, then retry auth/register.",
  );
}
