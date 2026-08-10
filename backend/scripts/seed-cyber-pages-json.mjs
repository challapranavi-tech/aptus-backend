/**
 * One-shot: seed cyber-security family pages into Odoo from local JSON.
 * Usage: node --env-file=.env.local scripts/seed-cyber-pages-json.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const JSON_ROOT = path.join(ROOT, "content", "odoo-json");
const MANIFEST = path.join(ROOT, "data", "software-live-manifest.json");

const BASE = (process.env.ODOO_URL ?? "").replace(/\/$/, "");
const DB = process.env.ODOO_DB ?? "";
const USER = process.env.ODOO_USER ?? "";
const KEY = process.env.ODOO_API_KEY ?? "";
const FIELD = process.env.ODOO_CMS_PAGE_JSON_FIELD?.trim() || "x_page_sections_json";
const WEBSITE_ID = Number(process.env.ODOO_WEBSITE_ID ?? 7);

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

function jsonPathForPage(page) {
  const candidates = [
    path.join(JSON_ROOT, "overrides", page.family, `${page.slug}.json`),
    path.join(JSON_ROOT, page.family, `${page.slug}.json`),
    path.join(JSON_ROOT, "overrides", `${page.slug}.json`),
    path.join(JSON_ROOT, `${page.slug}.json`),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? candidates[1];
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const uid = await rpc("common", "authenticate", [DB, USER, KEY, {}]);
if (!uid) throw new Error("Odoo auth failed");

const pages = manifest.pages.filter((p) => p.family === "cyber-security");
let seeded = 0;
let missing = 0;

for (const page of pages) {
  const filePath = jsonPathForPage(page);
  if (!fs.existsSync(filePath)) {
    console.warn(`Skip (no JSON): ${page.route}`);
    missing++;
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
    [[["url", "=", page.route], ["website_id", "=", WEBSITE_ID]], ["id", "url"]],
    { limit: 1, order: "id desc" },
  ]);

  if (!rows[0]) {
    console.warn(`Skip (Odoo missing on website ${WEBSITE_ID}): ${page.route}`);
    missing++;
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

  console.log(`Seeded ${page.route} → id=${rows[0].id} (${jsonString.length} bytes)`);
  seeded++;
}

console.log(`\nDone: ${seeded} seeded, ${missing} missing.`);
