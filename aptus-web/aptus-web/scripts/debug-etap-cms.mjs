/**
 * Debug ETAP CMS fetch — run: node scripts/debug-etap-cms.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadEnvLocal } from "./load-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

loadEnvLocal(ROOT);

const base = (process.env.ODOO_BASE_URL ?? "").replace(/\/$/, "");
const field = process.env.ODOO_CMS_ETAP_JSON_FIELD?.trim() || "x_etap_sections_json";
const pinned = Number(process.env.ODOO_CMS_ETAP_PAGE_ID || 280);
const websiteId = Number(process.env.ODOO_CMS_WEBSITE_ID || 0);

async function odooCall(model, method, body) {
  const response = await fetch(`${base}/json/2/${model}/${method}`, {
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

function extractWrap(raw) {
  const wrapMatch = raw.match(/<div id="wrap"[^>]*>([\s\S]*?)<\/div>\s*(?:<\/t>\s*)*$/i);
  return wrapMatch?.[1]?.trim() || raw.trim();
}

const domain = [["url", "=", "/etap"]];
if (websiteId > 0) domain.push(["website_id", "=", websiteId]);

const rows = await odooCall("website.page", "search_read", {
  domain,
  fields: ["id", "name", "url", "arch_db", field, "is_published", "website_published"],
  limit: 10,
});

const includeUnpublished = process.env.ODOO_CMS_INCLUDE_UNPUBLISHED === "true";
const pool = rows.filter((row) => includeUnpublished || row.is_published || row.website_published);
const page = pool.find((row) => row.id === pinned) ?? pool[0];

if (!page) {
  console.error("No ETAP page found for", { domain, pinned, rowIds: rows.map((r) => r.id) });
  process.exit(1);
}

const html = extractWrap(typeof page.arch_db === "string" ? page.arch_db : "");
const sectionsJson = page[field];
const defaults = JSON.parse(
  fs.readFileSync(path.join(ROOT, "content/odoo-json/etap/etap-sections.json"), "utf8"),
);

let overrides = null;
try {
  overrides = typeof sectionsJson === "string" && sectionsJson.trim() ? JSON.parse(sectionsJson) : null;
} catch (e) {
  console.error("Invalid JSON in Odoo field:", e.message);
  process.exit(1);
}

const hero = overrides?.hero ? { ...defaults.hero, ...overrides.hero } : defaults.hero;

console.log("--- ETAP CMS debug ---");
console.log("Odoo page id:", page.id, "| pinned:", pinned, "| htmlLen:", html.length);
console.log("JSON field:", field, "| jsonLen:", sectionsJson?.length ?? 0);
console.log("Odoo hero.primaryCta:", hero.primaryCta);
console.log("Odoo overview[0]:", (overrides?.overview?.paragraphs?.[0] ?? defaults.overview.paragraphs[0]).slice(0, 90));
console.log("");
console.log("Navbar default (home-data): Request Demo");
console.log("If /etap_new shows 'Request Demo' but Odoo has 'Request a Demo', CMS fetch is broken.");
console.log("If both match Odoo, CMS works — edit a more visible field (e.g. primaryCta.label = TEST).");
