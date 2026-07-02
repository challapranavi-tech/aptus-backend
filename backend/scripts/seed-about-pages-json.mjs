/**
 * Seed all About Us pages from content/odoo-json/*.json into Odoo (website 7).
 * Usage:
 *   node scripts/generate-about-odoo-json.mjs
 *   node --env-file=.env.local scripts/seed-about-pages-json.mjs
 */

import { readFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";

spawnSync("node", ["scripts/generate-about-odoo-json.mjs"], { stdio: "inherit" });

const PAGES = [
  { slug: "our-story", pageId: 249 },
  { slug: "our-team", pageId: 227 },
  { slug: "aptus-policy", pageId: 165 },
  { slug: "why-aptus-infotech", pageId: 250 },
  { slug: "winning-together", pageId: 251 },
  { slug: "aptus-infotech-iso-certifications", pageId: 253 },
  { slug: "career", pageId: 209 },
  { slug: "contact-us", pageId: 211 },
];

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
if (!uid) throw new Error("Odoo auth failed");

for (const page of PAGES) {
  const path = `content/odoo-json/${page.slug}.json`;
  if (!existsSync(path)) throw new Error(`Missing ${path}`);
  const sections = JSON.parse(readFileSync(path, "utf8"));
  await rpc("object", "execute_kw", [
    DB,
    uid,
    KEY,
    "website.page",
    "write",
    [[page.pageId], { [FIELD]: JSON.stringify(sections, null, 2), is_published: true, website_published: true }],
  ]);
  console.log(`Seeded ${page.slug} → page id ${page.pageId}`);
}

console.log("Done. Hard-refresh localhost pages after ~60s.");
