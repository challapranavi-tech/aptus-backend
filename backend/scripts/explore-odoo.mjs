/**
 * scripts/explore-odoo.mjs
 *
 * Development-only terminal utility.
 * Connects to Odoo, lists website-related models, logs fields and sample records.
 * Output goes to stdout only — nothing is exposed to the frontend.
 *
 * Usage (Node.js 20.6+):
 *   node --env-file=.env.local scripts/explore-odoo.mjs
 *
 * Or set env vars manually first:
 *   $env:ODOO_URL="https://..."; $env:ODOO_DB="..."; ... (PowerShell)
 *   node scripts/explore-odoo.mjs
 */

// ─── Env ──────────────────────────────────────────────────────────────────────
const REQUIRED = ["ODOO_URL", "ODOO_DB", "ODOO_USER", "ODOO_API_KEY"];

function checkEnv() {
  const missing = REQUIRED.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.error("Missing required env vars:", missing.join(", "));
    console.error("Run: node --env-file=.env.local scripts/explore-odoo.mjs");
    process.exit(1);
  }
}

const BASE = (process.env.ODOO_URL ?? "").replace(/\/$/, "");
const DB = process.env.ODOO_DB ?? "";
const USER = process.env.ODOO_USER ?? "";
const KEY = process.env.ODOO_API_KEY ?? "";

// ─── JSON-RPC ─────────────────────────────────────────────────────────────────
let _id = 0;

async function rpc(service, method, args) {
  const res = await fetch(`${BASE}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: ++_id,
      method: "call",
      params: { service, method, args },
    }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.error) {
    throw new Error(json.error.data?.message ?? json.error.message ?? "RPC error");
  }
  return json.result;
}

async function authenticate() {
  const uid = await rpc("common", "authenticate", [DB, USER, KEY, {}]);
  if (!uid) throw new Error("Auth failed — check ODOO_USER and ODOO_API_KEY.");
  return uid;
}

async function searchRead(uid, model, domain, fields, limit = 5) {
  return rpc("object", "execute_kw", [
    DB, uid, KEY, model, "search_read",
    [domain],
    { fields, limit },
  ]);
}

async function modelFields(uid, modelName) {
  return rpc("object", "execute_kw", [
    DB, uid, KEY, "ir.model.fields", "search_read",
    [[["model", "=", modelName]]],
    { fields: ["name", "ttype", "field_description"], limit: 200 },
  ]);
}

// ─── Output helpers ───────────────────────────────────────────────────────────
const HR = "─".repeat(64);

function section(title) {
  console.log(`\n${HR}`);
  console.log(`  ${title}`);
  console.log(HR);
}

function row(col1, col2, col3 = "") {
  console.log(`  ${String(col1).padEnd(36)}${String(col2).padEnd(16)}${col3}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  checkEnv();

  // ── Authenticate ────────────────────────────────────────────────────────────
  section("Authenticating");
  const uid = await authenticate();
  console.log(`  ✓ uid=${uid}  db=${DB}  url=${BASE}`);

  // ── Version ─────────────────────────────────────────────────────────────────
  section("Odoo Version");
  const ver = await rpc("common", "version", []);
  console.log(`  Server : ${ver.server_version}`);
  console.log(`  Serie  : ${ver.server_serie}`);

  // ── Website-related models ───────────────────────────────────────────────────
  section("Website-Related Models");
  const models = await searchRead(
    uid,
    "ir.model",
    [["model", "like", "website"]],
    ["model", "name"],
    50,
  );
  row("model", "label");
  row("─".repeat(35), "─".repeat(15));
  for (const m of models) {
    row(m.model, m.name);
  }

  // ── Per-model field listing + sample records ─────────────────────────────────
  const TARGETS = [
    "res.website",
    "website.page",
    "website.menu",
    "ir.ui.view",
  ];

  for (const modelName of TARGETS) {
    // Fields
    section(`Fields — ${modelName}`);
    try {
      const fields = await modelFields(uid, modelName);
      row("field name", "type", "description");
      row("─".repeat(35), "─".repeat(15), "─".repeat(30));
      for (const f of fields) {
        row(f.name, f.ttype, f.field_description ?? "");
      }
    } catch (e) {
      console.log(`  Error reading fields: ${e.message}`);
    }

    // Sample records
    section(`Sample Records — ${modelName} (limit 3)`);
    try {
      const records = await searchRead(uid, modelName, [], ["id", "name"], 3);
      console.log(JSON.stringify(records, null, 2));
    } catch (e) {
      console.log(`  Error reading records: ${e.message}`);
    }
  }

  // ── Published pages (the main content we care about) ────────────────────────
  section("Published website.page records");
  try {
    const pages = await searchRead(
      uid,
      "website.page",
      [["is_published", "=", true]],
      ["id", "name", "url", "is_published", "website_published", "view_id", "write_date"],
      20,
    );
    console.log(`  Found ${pages.length} published page(s):\n`);
    for (const p of pages) {
      const viewId = Array.isArray(p.view_id) ? p.view_id[0] : p.view_id;
      console.log(`  [${String(p.id).padStart(4)}] ${p.url.padEnd(30)} view_id=${viewId}  "${p.name}"`);
    }
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }

  // ── Top-level menus ─────────────────────────────────────────────────────────
  section("website.menu — top-level items");
  try {
    const menus = await searchRead(
      uid,
      "website.menu",
      [["parent_id", "=", false]],
      ["id", "name", "url", "sequence", "child_id"],
      20,
    );
    console.log(JSON.stringify(menus, null, 2));
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }

  section("Done");
  console.log("  Next steps:");
  console.log("  • Copy a view_id from above and call: GET /api/odoo?model=view&id={view_id}");
  console.log("  • Visit http://localhost:3000/api/odoo for the full debug UI.\n");
}

main().catch((err) => {
  console.error("\n[FATAL]", err.message);
  process.exit(1);
});
