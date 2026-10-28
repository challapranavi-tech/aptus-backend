/**
 * Debug: dump our-team page raw Odoo fields + mapped sections.
 * Usage: node --env-file=.env.local scripts/debug-our-team.mjs
 */

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

const uid = await rpc("common", "authenticate", [DB, USER, KEY, {}]);
const pages = await rpc("object", "execute_kw", [
  DB, uid, KEY, "website.page", "search_read",
  [[["url", "=", "/our-team"]], ["id", "name", "url", "is_published", "website_published", "view_id", FIELD, "write_date"]],
]);
const page = pages[0];
console.log("PAGE:", { id: page.id, name: page.name, url: page.url, published: page.is_published, write_date: page.write_date });

const jsonRaw = page[FIELD];
console.log("\n--- x_page_sections_json (raw) ---");
if (!jsonRaw || jsonRaw === "false") {
  console.log("(empty)");
} else {
  try {
    const parsed = JSON.parse(jsonRaw);
    console.log(JSON.stringify(parsed, null, 2));
    console.log("\nteam.members count:", parsed.team?.members?.length ?? 0);
  } catch (e) {
    console.log("parse error:", e.message);
    console.log(String(jsonRaw).slice(0, 500));
  }
}

const viewId = page.view_id[0];
const views = await rpc("object", "execute_kw", [
  DB, uid, KEY, "ir.ui.view", "read", [[viewId], ["arch"]],
]);
const arch = views[0].arch || "";
console.log("\n--- QWeb arch ---");
console.log("length:", arch.length);
for (const needle of ["Rajesh Malaviya", "Mubin Mir", "team-card", "team-grid"]) {
  console.log(needle + ":", arch.includes(needle));
}
