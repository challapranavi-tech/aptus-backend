/**
 * Push clean QWeb arch to Odoo for /our-story (website preview).
 * Usage: node --env-file=.env.local scripts/seed-our-story-arch.mjs
 */

import { readFileSync } from "fs";
import { spawnSync } from "child_process";

spawnSync("node", ["scripts/build-our-story-arch.mjs"], { stdio: "inherit" });

const BASE = (process.env.ODOO_URL ?? "").replace(/\/$/, "");
const DB = process.env.ODOO_DB ?? "";
const USER = process.env.ODOO_USER ?? "";
const KEY = process.env.ODOO_API_KEY ?? "";
const PAGE_ID = 249;
const VIEW_ID = 7476;

const arch = readFileSync("content/odoo-xml/our-story.xml", "utf8");

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

await rpc("object", "execute_kw", [
  DB,
  uid,
  KEY,
  "ir.ui.view",
  "write",
  [[VIEW_ID], { arch, arch_db: arch }],
]);

await rpc("object", "execute_kw", [
  DB,
  uid,
  KEY,
  "website.page",
  "write",
  [[PAGE_ID], { is_published: true, website_published: true }],
]);

console.log(`Seeded QWeb arch on ir.ui.view id=${VIEW_ID} (page ${PAGE_ID} /our-story)`);
console.log("Preview in Odoo Website editor, then hard-refresh.");
