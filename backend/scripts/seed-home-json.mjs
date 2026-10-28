/**
 * Seed website.page `/` x_homepage_sections_json from content/odoo-json/home.json.
 *
 * Usage (from backend/):
 *   node --env-file=.env.local scripts/seed-home-json.mjs
 *
 * Optional:
 *   DRY_RUN=1  — print target page, do not write
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const HOME_JSON = path.join(ROOT, "content", "odoo-json", "home.json");

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
const WEBSITE_ID = Number(process.env.ODOO_WEBSITE_ID || 7);
const FIELD = "x_homepage_sections_json";
const DRY = process.env.DRY_RUN === "1";

if (!BASE || !DB || !USER || !KEY) {
  console.error("Missing ODOO_URL / ODOO_DB / ODOO_USER / ODOO_API_KEY");
  process.exit(1);
}
if (!fs.existsSync(HOME_JSON)) {
  console.error("Missing", HOME_JSON);
  process.exit(1);
}

const jsonString = fs.readFileSync(HOME_JSON, "utf8");
JSON.parse(jsonString); // validate

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

console.log(`Odoo ${BASE} db=${DB} website=${WEBSITE_ID} user=${USER}`);

const uid = await rpc("common", "authenticate", [DB, USER, KEY, {}]);
if (!uid) {
  console.error("Auth failed — generate a production API key for this user/DB");
  process.exit(1);
}
console.log(`Authenticated uid=${uid}`);

// Confirm field exists
try {
  await rpc("object", "execute_kw", [
    DB,
    uid,
    KEY,
    "website.page",
    "search_read",
    [[]],
    { fields: ["id", FIELD], limit: 1 },
  ]);
} catch (e) {
  console.error(
    `Field ${FIELD} missing on website.page — create the Text field in Odoo first.`,
  );
  console.error(String(e.message ?? e));
  process.exit(1);
}

const pages = await rpc("object", "execute_kw", [
  DB,
  uid,
  KEY,
  "website.page",
  "search_read",
  [[["website_id", "=", WEBSITE_ID], ["url", "in", ["/", "/home"]]]],
  {
    fields: ["id", "name", "url", "is_published", "website_published", FIELD],
    limit: 5,
  },
]);

if (!pages.length) {
  console.error(`No home page (url / or /home) on website_id=${WEBSITE_ID}`);
  const sites = await rpc("object", "execute_kw", [
    DB,
    uid,
    KEY,
    "website",
    "search_read",
    [[]],
    { fields: ["id", "name", "domain"], limit: 20 },
  ]);
  console.error("Available websites:", sites);
  process.exit(1);
}

const page = pages.find((p) => p.url === "/") ?? pages[0];
const existingLen =
  typeof page[FIELD] === "string"
    ? page[FIELD].length
    : page[FIELD]
      ? JSON.stringify(page[FIELD]).length
      : 0;

console.log("Target page:", {
  id: page.id,
  name: page.name,
  url: page.url,
  published: page.is_published ?? page.website_published,
  existingJsonLen: existingLen,
  newJsonLen: jsonString.length,
});

if (DRY) {
  console.log("DRY_RUN=1 — no write");
  process.exit(0);
}

await rpc("object", "execute_kw", [
  DB,
  uid,
  KEY,
  "website.page",
  "write",
  [
    [page.id],
    {
      [FIELD]: jsonString,
      is_published: true,
    },
  ],
]);

console.log(`Seeded ${FIELD} on website.page id=${page.id} and set published=true`);
