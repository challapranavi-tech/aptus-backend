/**
 * Seed full Page Sections JSON on all Autodesk product pages in Odoo.
 * Usage: node --env-file=.env.local scripts/seed-autodesk-inner-pages-json.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const JSON_DIR = path.join(ROOT, "content", "odoo-json", "autodesk");

const BASE = (process.env.ODOO_URL ?? "").replace(/\/$/, "");
const DB = process.env.ODOO_DB ?? "";
const USER = process.env.ODOO_USER ?? "";
const KEY = process.env.ODOO_API_KEY ?? "";
const FIELD = process.env.ODOO_CMS_PAGE_JSON_FIELD?.trim() || "x_page_sections_json";

const PAGES = [
  { url: "/autocad", file: "autocad.json" },
  { url: "/3ds-max", file: "3ds-max.json" },
  { url: "/revit", file: "revit.json" },
  { url: "/civil-3d", file: "civil-3d.json" },
  { url: "/aec-collection", file: "aec-collection.json" },
  { url: "/autocad-lt", file: "autocad-lt.json" },
  { url: "/bim-collaborate-pro", file: "bim-collaborate-pro.json" },
  { url: "/autodesk-docs", file: "autodesk-docs.json" },
  { url: "/autodesk-build", file: "autodesk-build.json" },
  { url: "/autodesk-takeoff", file: "autodesk-takeoff.json" },
  { url: "/navisworks", file: "navisworks.json" },
];

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

const uid = await rpc("common", "authenticate", [DB, USER, KEY, {}]);
if (!uid) throw new Error("Odoo auth failed");

let seeded = 0;
let missing = 0;

for (const page of PAGES) {
  const filePath = path.join(JSON_DIR, page.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`Skip (JSON missing): ${page.file}`);
    missing += 1;
    continue;
  }

  const jsonString = fs.readFileSync(filePath, "utf8");
  JSON.parse(jsonString);

  const rows = await rpc("object", "execute_kw", [
    DB,
    uid,
    KEY,
    "website.page",
    "search_read",
    [[["url", "=", page.url]], ["id", "url", "name"]],
    { limit: 1, order: "id desc" },
  ]);

  if (!rows[0]) {
    console.warn(`Skip (not found in Odoo): ${page.url}`);
    missing += 1;
    continue;
  }

  await rpc("object", "execute_kw", [
    DB,
    uid,
    KEY,
    "website.page",
    "write",
    [[rows[0].id], { [FIELD]: jsonString, is_published: true, website_published: true }],
  ]);

  console.log(`Seeded ${page.file} → id=${rows[0].id} (${page.url})`);
  seeded += 1;
}

console.log(`\nDone: ${seeded} seeded, ${missing} missing.`);
