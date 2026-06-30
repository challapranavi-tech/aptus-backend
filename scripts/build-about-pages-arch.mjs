/**
 * Build clean Odoo QWeb arch for About Us pages (Odoo website preview).
 * Extracts page body + styles from existing Odoo embed (no nav/footer dupes).
 *
 * Usage:
 *   node --env-file=.env.local scripts/build-about-pages-arch.mjs
 *   node --env-file=.env.local scripts/build-about-pages-arch.mjs our-team
 */

import { mkdirSync, writeFileSync } from "fs";

const PAGES = [
  { slug: "our-team", pageId: 227, viewId: 7128, tName: "website.our-team", label: "Our Team Content" },
  { slug: "aptus-policy", pageId: 165, viewId: 7045, tName: "website.aptus-policy", label: "Aptus Policy Content" },
  { slug: "why-aptus-infotech", pageId: 250, viewId: 7477, tName: "website.why-aptus-infotech", label: "Why Aptus Content" },
  { slug: "winning-together", pageId: 251, viewId: 7478, tName: "website.winning-together", label: "Winning Together Content" },
  {
    slug: "aptus-infotech-iso-certifications",
    pageId: 253,
    viewId: 7480,
    tName: "website.iso-certification",
    label: "ISO Certifications Content",
  },
  { slug: "career", pageId: 209, viewId: 7089, tName: "website.career", label: "Career Content" },
  { slug: "contact-us", pageId: 211, viewId: 7091, tName: "website.contact-us", label: "Contact Us Content" },
];

const onlySlug = process.argv[2];
const targets = onlySlug ? PAGES.filter((p) => p.slug === onlySlug) : PAGES;
if (onlySlug && targets.length === 0) throw new Error(`Unknown slug: ${onlySlug}`);

const BASE = (process.env.ODOO_URL ?? "").replace(/\/$/, "");
const DB = process.env.ODOO_DB ?? "";
const USER = process.env.ODOO_USER ?? "";
const KEY = process.env.ODOO_API_KEY ?? "";

let rpcId = 0;
async function rpc(service, method, args) {
  const res = await fetch(`${BASE}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method: "call", params: { service, method, args } }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.data?.message ?? json.error.message);
  return json.result;
}

function extractEmbeddedBlock(arch) {
  const marker = '<div class="s_embed_code_embedded';
  const first = arch.indexOf(marker);
  const second = arch.indexOf(marker, first + 1);
  const start = second >= 0 ? second : first;
  if (start < 0) return null;
  const slice = arch.slice(start);
  const end = slice.search(/<\/div>\s*<\/section>/);
  return end >= 0 ? slice.slice(0, end) : slice;
}

function extractStyle(embedded) {
  const m = embedded.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (!m) return "";
  return m[1]
    .replace(/^\s*\*\s*\{[^}]*\}\s*/gm, "")
    .replace(/\bbody\s*\{/g, ".aptus-page {")
    .replace(/\bhtml\s*\{/g, ".aptus-page {")
    .replace(/\/\*[^*]*TOP BAR[^*]*\*\//g, "")
    .replace(/\/\*[^*]*HEADER[^*]*\*\//g, "")
    .replace(/\/\*[^*]*SUBMENU[^*]*\*\//g, "")
    .replace(/\/\*[^*]*FOOTER[^*]*\*\//g, "")
    .replace(/\.top-bar[\s\S]*?(?=\/\*|\.page-banner|\.page-header)/g, "")
    .replace(/\.main-header[\s\S]*?(?=\/\*|\.page-banner|\.page-header)/g, "")
    .replace(/\.dropdown[\s\S]*?(?=\/\*|\.page-banner|\.page-header)/g, "")
    .replace(/\.nav-links[\s\S]*?(?=\/\*|\.page-banner|\.page-header)/g, "")
    .replace(/\.footer[\s\S]*?(?=\/\*|@media|$)/g, "")
    .replace(/\.mobile-toggle[\s\S]*?(?=\/\*|\.page-banner|\.page-header)/g, "")
    .trim();
}

function extractBody(embedded) {
  const startPatterns = [/class="page-banner"/, /class="page-header"/];
  let start = -1;
  for (const re of startPatterns) {
    const idx = embedded.search(re);
    if (idx >= 0) {
      start = idx;
      break;
    }
  }
  if (start < 0) throw new Error("No page-banner or page-header in embed");

  const chunk = embedded.slice(start - 5);
  const footerIdx = chunk.indexOf('<footer class="footer"');
  const body = footerIdx >= 0 ? chunk.slice(0, footerIdx) : chunk;
  return body.replace(/&amp;amp;/g, "&amp;").trim();
}

function contactCta() {
  return `
    <section class="contact-form-section">
        <div class="container">
            <h2>Have questions? We can help</h2>
            <div class="subtitle">Our experts can help you find the right solutions for your business.</div>
            <form class="contact-form" action="/contactus" method="post">
                <div class="form-row">
                    <div class="form-group">
                        <label>First Name *</label>
                        <input type="text" name="first_name" required="required"/>
                    </div>
                    <div class="form-group">
                        <label>Last Name *</label>
                        <input type="text" name="last_name" required="required"/>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Email *</label>
                        <input type="email" name="email" placeholder="name@mail.com" required="required"/>
                    </div>
                    <div class="form-group">
                        <label>Phone *</label>
                        <input type="tel" name="phone" placeholder="e.g, +968 0000 0000" required="required"/>
                    </div>
                </div>
                <div class="form-group">
                    <label>Message</label>
                    <textarea name="message" rows="4" placeholder="Message"/>
                </div>
                <button type="submit" class="submit-btn">Submit Now</button>
            </form>
        </div>
    </section>`;
}

function normalizeBody(body) {
  let out = body.trim();
  if (out.includes('class="alliances-section"') && !out.includes("contact-form-section")) {
    const opens = (out.match(/<section\b/gi) || []).length;
    const closes = (out.match(/<\/section>/gi) || []).length;
    if (opens > closes) {
      out += "\n    </div>\n</section>";
    }
  }
  return out.replace(/&amp;amp;/g, "&amp;");
}

function wrapArch(page, style, body) {
  const normalized = normalizeBody(body);
  const needsCta = !normalized.includes("contact-form-section") && page.slug !== "contact-us";
  const inner = `
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
<style>
.aptus-page { font-family: 'Poppins', sans-serif; color: #1a1a2e; }
${style}
</style>
<div class="aptus-page aptus-page--${page.slug.replace(/\//g, "-")}">
${normalized}
${needsCta ? contactCta() : ""}
</div>`.trim();

  return `<t t-name="${page.tName}">
    <t t-call="website.layout">
        <div id="wrap" class="oe_structure oe_empty">
            <section class="s_embed_code pt0 pb0 o_colored_level" data-snippet="s_embed_code" data-name="${page.label}">
                <div class="s_embed_code_embedded o_not_editable container-fluid">${inner}</div>
            </section>
        </div>
    </t>
</t>
`;
}

const uid = await rpc("common", "authenticate", [DB, USER, KEY, {}]);
if (!uid) throw new Error("Odoo auth failed");

mkdirSync("content/odoo-xml", { recursive: true });

for (const page of targets) {
  const views = await rpc("object", "execute_kw", [
    DB, uid, KEY, "ir.ui.view", "read", [[page.viewId], ["arch"]],
  ]);
  const arch = views[0].arch || "";
  const embedded = extractEmbeddedBlock(arch);
  if (!embedded) throw new Error(`No embed block for ${page.slug}`);

  const style = extractStyle(embedded);
  let body = extractBody(embedded);
  if (!body) throw new Error(`No body for ${page.slug}`);

  const xml = wrapArch(page, style, body);
  const out = `content/odoo-xml/${page.slug}.xml`;
  writeFileSync(out, xml, "utf8");
  console.log(`Wrote ${out} (${xml.length} chars) | page ${page.pageId} view ${page.viewId}`);
}
