/**
 * Clear ETAP global CSS/JS from Odoo website custom assets.
 * Usage: node --env-file=.env.local scripts/clear-etap-custom-assets.mjs
 */
const BASE = process.env.ODOO_URL.replace(/\/$/, "");
const DB = process.env.ODOO_DB;
const USER = process.env.ODOO_USER;
const KEY = process.env.ODOO_API_KEY;
const WID = Number(process.env.ODOO_WEBSITE_ID || 7);

const CLEAN_SCSS = `//
// This file is meant to regroup your design customizations.
//
`;
const CLEAN_JS = "";

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
  if (json.error) throw new Error(JSON.stringify(json.error, null, 2));
  return json.result;
}

const uid = await rpc("common", "authenticate", [DB, USER, KEY, {}]);
const kw = (model, method, args, kwargs = {}) =>
  rpc("object", "execute_kw", [DB, uid, KEY, model, method, args, kwargs]);

const PATHS = [
  {
    url: "/_custom/web.assets_frontend/website/static/src/scss/user_custom_rules.scss",
    content: CLEAN_SCSS,
  },
  {
    url: "/_custom/web.assets_frontend_lazy/website/static/src/js/user_custom_javascript.js",
    content: CLEAN_JS,
  },
];

for (const { url, content } of PATHS) {
  const atts = await kw(
    "ir.attachment",
    "search_read",
    [[["url", "=", url], ["website_id", "=", WID]]],
    { fields: ["id", "name"], limit: 1 },
  );
  if (!atts[0]) {
    console.log("SKIP (not found):", url);
    continue;
  }
  await kw("ir.attachment", "write", [[atts[0].id], {
    datas: Buffer.from(content, "utf8").toString("base64"),
    mimetype: url.endsWith(".scss") ? "text/scss" : "text/javascript",
  }]);
  const [check] = await kw("ir.attachment", "read", [[atts[0].id]], { fields: ["raw", "write_date"] });
  console.log(`CLEARED ${atts[0].name} (id ${atts[0].id}) → ${(check.raw || "").length} bytes`);
}

for (const bundle of ["web._assets_primary_variables", "web.assets_frontend"]) {
  const res = await fetch(`${BASE}/web/assets/debug/${bundle}.css?website_id=${WID}`);
  const text = await res.text();
  const failed = text.includes("css_error_message");
  console.log(`${bundle}: ${failed ? "FAIL" : "OK"} (${text.length} bytes)`);
  if (failed) {
    const m = text.match(/content: "([^"]+)/);
    if (m) console.log(" ", m[1].slice(0, 200).replace(/\\A/g, " "));
  }
}
