/**
 * Patches the home page x_homepage_sections_json in Odoo to add missing
 * href / buttonLabel fields on feature rows (needed for "READ MORE" buttons).
 *
 * Safe to re-run: reads the live JSON first, only adds fields that are absent,
 * then writes back.
 *
 * Usage:
 *   node --env-file=.env.local scripts/patch-home-features.mjs
 */

const BASE = (process.env.ODOO_URL ?? "").replace(/\/$/, "");
const DB   = process.env.ODOO_DB ?? "";
const USER = process.env.ODOO_USER ?? "";
const KEY  = process.env.ODOO_API_KEY ?? "";
const HOME_PAGE_ID = 226; // website.page id for "/"

if (!BASE || !DB || !USER || !KEY) {
  console.error("Missing Odoo env vars (ODOO_URL, ODOO_DB, ODOO_USER, ODOO_API_KEY)");
  process.exit(1);
}

let _id = 0;
async function rpc(service, method, args) {
  const res = await fetch(`${BASE}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++_id, method: "call",
      params: { service, method, args } }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.data?.message ?? json.error.message);
  return json.result;
}

// ponytail: per-feature patches keyed by eyebrow label.
// Add/update entries here when Odoo staging data drifts from production.
const FEATURE_PATCHES = {
  "ELV & Security": {
    href:        "/elv-solutions",
    buttonLabel: "Read More",
    titleBefore: "Aptus Infotech's comprehensive",  // live site text
  },
  "Software": {
    href:        "/software",
    buttonLabel: "Read More",
    // titleBefore: no change needed; "Aptus Infotech's Value Added" matches live
  },
};

const uid = await rpc("common", "authenticate", [DB, USER, KEY, {}]);
if (!uid) { console.error("Odoo auth failed"); process.exit(1); }
console.log(`Authenticated as uid ${uid}`);

// Read current JSON
const [page] = await rpc("object", "execute_kw", [
  DB, uid, KEY,
  "website.page", "read",
  [[HOME_PAGE_ID], ["x_homepage_sections_json"]],
]);

if (!page?.x_homepage_sections_json) {
  console.error("x_homepage_sections_json is empty on page", HOME_PAGE_ID);
  process.exit(1);
}

const data = JSON.parse(page.x_homepage_sections_json);

if (!Array.isArray(data.features)) {
  console.error("No features[] array in home JSON");
  process.exit(1);
}

let changed = false;
for (const feature of data.features) {
  const patch = FEATURE_PATCHES[feature.eyebrow];
  if (!patch) continue;

  if (patch.href && !feature.href) {
    feature.href = patch.href;
    changed = true;
    console.log(`  + href="${patch.href}" → "${feature.eyebrow}"`);
  }
  if (patch.buttonLabel && !feature.buttonLabel) {
    feature.buttonLabel = patch.buttonLabel;
    changed = true;
    console.log(`  + buttonLabel="${patch.buttonLabel}" → "${feature.eyebrow}"`);
  }
  if (patch.titleBefore && feature.title?.before !== patch.titleBefore) {
    if (!feature.title) feature.title = {};
    feature.title.before = patch.titleBefore;
    changed = true;
    console.log(`  + title.before="${patch.titleBefore}" → "${feature.eyebrow}"`);
  }
}

if (!changed) {
  console.log("Nothing to patch — href/buttonLabel already present on all features.");
  process.exit(0);
}

await rpc("object", "execute_kw", [
  DB, uid, KEY,
  "website.page", "write",
  [[HOME_PAGE_ID], { x_homepage_sections_json: JSON.stringify(data) }],
]);

console.log("Patched home page JSON in Odoo. Trigger revalidate or wait ~60 s for ISR.");
