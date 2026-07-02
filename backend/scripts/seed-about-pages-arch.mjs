/**
 * Push clean QWeb arch for all About Us pages (except our-story — use seed-our-story-arch.mjs).
 * Usage: node --env-file=.env.local scripts/seed-about-pages-arch.mjs
 */

import { readFileSync } from "fs";
import { spawnSync } from "child_process";

const PAGES = [
  { slug: "our-team", pageId: 227, viewId: 7128 },
  { slug: "aptus-policy", pageId: 165, viewId: 7045 },
  { slug: "why-aptus-infotech", pageId: 250, viewId: 7477 },
  { slug: "winning-together", pageId: 251, viewId: 7478 },
  { slug: "aptus-infotech-iso-certifications", pageId: 253, viewId: 7480 },
  { slug: "career", pageId: 209, viewId: 7089 },
  { slug: "contact-us", pageId: 211, viewId: 7091 },
];

spawnSync("node", ["scripts/build-about-pages-arch.mjs"], { stdio: "inherit" });

const BASE = (process.env.ODOO_URL ?? "").replace(/\/$/, "");
const DB = process.env.ODOO_DB ?? "";
const USER = process.env.ODOO_USER ?? "";
const KEY = process.env.ODOO_API_KEY ?? "";

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
  const arch = readFileSync(`content/odoo-xml/${page.slug}.xml`, "utf8");
  await rpc("object", "execute_kw", [
    DB, uid, KEY, "ir.ui.view", "write", [[page.viewId], { arch, arch_db: arch }],
  ]);
  await rpc("object", "execute_kw", [
    DB, uid, KEY, "website.page", "write", [[page.pageId], { is_published: true, website_published: true }],
  ]);
  console.log(`Seeded ${page.slug} → view ${page.viewId} (page ${page.pageId})`);
}

console.log("Done. Preview pages in Odoo Website editor.");
