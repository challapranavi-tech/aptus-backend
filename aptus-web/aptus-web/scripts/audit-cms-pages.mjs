/**
 * CMS audit: duplicate URLs, home page candidates, recommended env pins.
 * Usage: node scripts/audit-cms-pages.mjs
 */

import path from "path";
import { fileURLToPath } from "url";
import { loadEnvLocal } from "./load-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

loadEnvLocal(ROOT);

async function odooCall(model, method, body) {
  const baseUrl = (process.env.ODOO_BASE_URL ?? "").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/json/2/${model}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.ODOO_API_KEY ?? ""}`,
      "Content-Type": "application/json",
      "X-Odoo-Database": process.env.ODOO_DB ?? "",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

function extractWrapHtml(raw) {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed.includes("<t ")) return trimmed;
  const wrapMatch = trimmed.match(/<div id="wrap"[^>]*>([\s\S]*?)<\/div>\s*(?:<\/t>\s*)*$/i);
  if (wrapMatch?.[1]) return wrapMatch[1].trim();
  return trimmed.replace(/<t[^>]*>/gi, "").replace(/<\/t>/gi, "").trim();
}

function htmlLength(page) {
  const archDb = typeof page.arch_db === "string" ? page.arch_db : "";
  const arch = typeof page.arch === "string" ? page.arch : "";
  const raw = archDb || arch;
  return extractWrapHtml(raw).length;
}

function websiteLabel(page) {
  if (Array.isArray(page.website_id)) return `${page.website_id[0]} (${page.website_id[1]})`;
  return page.website_id ?? "none";
}

function isPublished(page) {
  return Boolean(page.is_published || page.website_published);
}

const FIELDS = [
  "id",
  "name",
  "url",
  "arch_db",
  "arch",
  "is_published",
  "website_published",
  "website_id",
  "website_meta_title",
  "website_meta_description",
];

const pages = await odooCall("website.page", "search_read", {
  domain: [],
  fields: FIELDS,
  limit: 500,
});

const cmsWebsiteId = Number(process.env.ODOO_CMS_WEBSITE_ID || 0) || null;
const pinnedId = Number(process.env.ODOO_CMS_HOME_PAGE_ID || 0) || null;

console.log("=== Odoo CMS Audit ===\n");
console.log(`Total pages: ${pages.length}`);
console.log(`Published: ${pages.filter(isPublished).length}`);
console.log(`Draft: ${pages.filter((p) => !isPublished(p)).length}`);
console.log(`ODOO_CMS_WEBSITE_ID: ${cmsWebsiteId ?? "(not set)"}`);
console.log(`ODOO_CMS_HOME_PAGE_ID: ${pinnedId ?? "(not set)"}`);
console.log(`ODOO_CMS_INCLUDE_UNPUBLISHED: ${process.env.ODOO_CMS_INCLUDE_UNPUBLISHED ?? "false"}`);
console.log(`ODOO_CMS_PREFER_PUBLISHED: ${process.env.ODOO_CMS_PREFER_PUBLISHED ?? "false"}\n`);

// Duplicate URLs
const byUrl = new Map();
for (const page of pages) {
  const url = page.url || "/";
  if (!byUrl.has(url)) byUrl.set(url, []);
  byUrl.get(url).push(page);
}

const duplicates = [...byUrl.entries()].filter(([, rows]) => rows.length > 1);
console.log(`=== Duplicate URLs (${duplicates.length}) ===\n`);
for (const [url, rows] of duplicates.sort((a, b) => b[1].length - a[1].length)) {
  console.log(`${url} (${rows.length} records):`);
  for (const row of rows) {
    console.log(
      `  id=${row.id}  ${isPublished(row) ? "PUB" : "DRAFT"}  website=${websiteLabel(row)}  html=${htmlLength(row)} chars`,
    );
  }
  console.log("");
}

// Home page candidates
const homePages = pages.filter((p) => p.url === "/" || p.url === "" || !p.url);
console.log("=== Home page candidates ===\n");
for (const page of homePages.sort((a, b) => htmlLength(b) - htmlLength(a))) {
  const onTargetWebsite =
    cmsWebsiteId && Array.isArray(page.website_id)
      ? page.website_id[0] === cmsWebsiteId
      : null;
  console.log(
    [
      `id=${page.id}`,
      isPublished(page) ? "PUB" : "DRAFT",
      `website=${websiteLabel(page)}`,
      onTargetWebsite === true ? "✓ target website" : onTargetWebsite === false ? "✗ other website" : "",
      `html=${htmlLength(page)} chars`,
      pinnedId === page.id ? "← PINNED" : "",
    ]
      .filter(Boolean)
      .join("  "),
  );
}

// Recommend best home page
let pool = homePages;
if (cmsWebsiteId) {
  const onWebsite = pool.filter(
    (p) => Array.isArray(p.website_id) && p.website_id[0] === cmsWebsiteId,
  );
  if (onWebsite.length) pool = onWebsite;
}

const ranked = pool
  .map((p) => ({ page: p, len: htmlLength(p), pub: isPublished(p) }))
  .filter((x) => x.len >= 200)
  .sort((a, b) => {
    if (a.pub !== b.pub) return a.pub ? -1 : 1;
    return b.len - a.len;
  });

console.log("\n=== Recommended ODOO_CMS_HOME_PAGE_ID ===\n");
if (ranked.length) {
  const best = ranked[0].page;
  console.log(`Recommended: ODOO_CMS_HOME_PAGE_ID=${best.id}`);
  console.log(`  name="${best.name}"  published=${isPublished(best)}  website=${websiteLabel(best)}  html=${htmlLength(best)} chars`);
  if (pinnedId && pinnedId !== best.id) {
    const pinned = homePages.find((p) => p.id === pinnedId);
    if (pinned) {
      console.log(`\nCurrent pin id=${pinnedId}: html=${htmlLength(pinned)} chars  published=${isPublished(pinned)}`);
    } else {
      console.log(`\nWarning: pinned id=${pinnedId} not found among home candidates`);
    }
  }
} else {
  console.log("No home page with html >= 200 chars on target website.");
}

console.log("\n=== Suggested .env.local additions ===\n");
console.log("# Pin the aptusinfotech.com homepage (website_id=7)");
if (ranked.length) {
  console.log(`ODOO_CMS_HOME_PAGE_ID=${ranked[0].page.id}`);
}
console.log("ODOO_CMS_PREFER_PUBLISHED=true");
console.log("# Set false once duplicate draft home pages are archived in Odoo");
console.log("# ODOO_CMS_INCLUDE_UNPUBLISHED=false");
