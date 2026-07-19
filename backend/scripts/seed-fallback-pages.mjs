/**
 * Seed pages that currently fall back to content/odoo-json into Odoo staging.
 * Creates ir.ui.view + website.page when missing; writes JSON + publishes when present.
 *
 * Usage: node --env-file=.env.local scripts/seed-fallback-pages.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const JSON_ROOT = path.join(ROOT, "content", "odoo-json");

const BASE = (process.env.ODOO_URL ?? "").replace(/\/$/, "");
const DB = process.env.ODOO_DB ?? "";
const USER = process.env.ODOO_USER ?? "";
const KEY = process.env.ODOO_API_KEY ?? "";
const WEBSITE_ID = Number(process.env.ODOO_WEBSITE_ID || 7);
const FIELD = process.env.ODOO_CMS_PAGE_JSON_FIELD?.trim() || "x_page_sections_json";
const CASE_FIELD =
  process.env.ODOO_CMS_CASE_STUDIES_JSON_FIELD?.trim() || "x_case_studies_sections_json";

const PAGES = [
  { slug: "cctv-camera", file: "elv/cctv-camera.json" },
  { slug: "aptus-case-studies", file: "case-studies/aptus-case-studies.json", caseStudies: true },
  { slug: "luminon", file: "multimedia/luminon.json" },
  { slug: "ansys", file: "educational/ansys.json" },
  { slug: "ibm-spss-software", file: "educational/ibm-spss-software.json" },
  { slug: "matlab", file: "educational/matlab.json" },
  { slug: "turnitin", file: "educational/turnitin.json" },
  { slug: "plainswift", file: "quantity-takeoff/plainswift.json" },
  { slug: "rib-costx", file: "quantity-takeoff/rib-costx.json" },
  { slug: "computers-structures", file: "structural/computers-structures.json" },
  { slug: "prokon", file: "structural/prokon.json" },
  { slug: "antivirus-and-data-security", file: "cyber-security/antivirus-and-data-security.json" },
  { slug: "cype", file: "cype.json" },
  { slug: "elv-solutions", file: "elv-solutions.json" },
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

function titleFromSlug(slug) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function viewKey(slug) {
  return `website.aptus_${slug.replace(/-/g, "_")}`;
}

function minimalArch(slug) {
  const key = viewKey(slug);
  return `<t t-name="${key}">
    <t t-call="website.layout">
        <div id="wrap" class="oe_structure">
            <section class="s_text_block pt32 pb32">
                <div class="container">
                    <p>Content served by Next.js from page JSON.</p>
                </div>
            </section>
        </div>
    </t>
</t>`;
}

const uid = await rpc("common", "authenticate", [DB, USER, KEY, {}]);
if (!uid) throw new Error("Odoo auth failed");

let seeded = 0;
let created = 0;

for (const page of PAGES) {
  const filePath = path.join(JSON_ROOT, page.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`Skip (no JSON): ${page.slug}`);
    continue;
  }
  const jsonString = fs.readFileSync(filePath, "utf8");
  JSON.parse(jsonString);

  const url = `/${page.slug}`;
  const name = titleFromSlug(page.slug);
  const vals = {
    [page.caseStudies ? CASE_FIELD : FIELD]: jsonString,
    is_published: true,
    website_published: true,
  };

  const rows = await rpc("object", "execute_kw", [
    DB,
    uid,
    KEY,
    "website.page",
    "search_read",
    [[["url", "=", url], ["website_id", "=", WEBSITE_ID]], ["id", "url"]],
    { limit: 1, order: "id desc" },
  ]);

  if (rows[0]) {
    await rpc("object", "execute_kw", [
      DB,
      uid,
      KEY,
      "website.page",
      "write",
      [[rows[0].id], vals],
    ]);
    console.log(`Updated ${url} → id=${rows[0].id}`);
    seeded++;
    continue;
  }

  const arch = minimalArch(page.slug);
  const viewId = await rpc("object", "execute_kw", [
    DB,
    uid,
    KEY,
    "ir.ui.view",
    "create",
    [
      {
        name,
        type: "qweb",
        key: viewKey(page.slug),
        arch,
        arch_db: arch,
      },
    ],
  ]);

  const newId = await rpc("object", "execute_kw", [
    DB,
    uid,
    KEY,
    "website.page",
    "create",
    [
      {
        name,
        url,
        website_id: WEBSITE_ID,
        view_id: viewId,
        ...vals,
      },
    ],
  ]);
  console.log(`Created ${url} → id=${newId} view=${viewId}`);
  created++;
}

console.log(`\nDone: ${seeded} updated, ${created} created.`);
