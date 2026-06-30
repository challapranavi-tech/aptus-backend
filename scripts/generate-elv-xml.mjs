#!/usr/bin/env node
/**
 * Generate Odoo-friendly QWeb website templates for every ELV page from the page JSON,
 * inlining the exact Font Awesome SVGs + per-page alliance logos lifted from the live site.
 * Output mirrors the existing content/odoo-xml/*.xml pattern (s_embed_code + inline <style>).
 *
 * Usage: node scripts/generate-elv-xml.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LIVE = path.join(ROOT, "LIVE WEBSITE", "ELV");
const JSON_DIR = path.join(ROOT, "content", "odoo-json", "elv");
const OUT_DIR = path.join(ROOT, "content", "odoo-xml");
const MEDIA_TS = path.join(ROOT, "data", "elv-product-media.ts");

// ---------- helpers ----------
const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function stripHtml(s) {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;/g, "\u2019")
    .replace(/\s+/g, " ")
    .trim();
}

function readMediaMap(name) {
  const src = fs.readFileSync(MEDIA_TS, "utf8");
  const block = src.match(new RegExp(`${name}[^=]*=\\s*{([\\s\\S]*?)};`))?.[1] ?? "";
  const map = {};
  for (const m of block.matchAll(/"([^"]+)":\s*"([^"]+)"/g)) map[m[1]] = m[2];
  return map;
}
const HERO_IMG = readMediaMap("ELV_HERO_IMAGES");
const BANNER_BG = readMediaMap("ELV_BANNER_BG_IMAGES");

// icon SVGs from live (name -> {viewBox, paths})
function buildIconMap() {
  const icons = {};
  const re =
    /<svg[^>]*class="[^"]*e-fa[brs]-([a-z0-9-]+)[^"]*"[^>]*viewBox="([^"]+)"[^>]*>([\s\S]*?)<\/svg>/gi;
  for (const f of fs.readdirSync(LIVE)) {
    if (!f.endsWith(".html")) continue;
    const html = fs.readFileSync(path.join(LIVE, f), "utf8");
    let m;
    while ((m = re.exec(html))) {
      const [, nm, viewBox, inner] = m;
      if (icons[nm]) continue;
      const paths = [...inner.matchAll(/<path\b[^>]*?\/?>(?:<\/path>)?/gi)]
        .map((p) =>
          p[0].replace(/\s*fill="[^"]*"/gi, "").replace(/<\/path>/gi, "").replace(/\s*\/?>$/, "/>"),
        )
        .join("");
      if (paths) icons[nm] = { viewBox, paths };
    }
  }
  return icons;
}
const ICONS = buildIconMap();

const iconSvg = (name) => {
  const i = name && ICONS[name];
  if (!i) return "";
  return `<svg class="elv-icon" viewBox="${i.viewBox}" fill="currentColor" aria-hidden="true">${i.paths}</svg>`;
};

// Shared "Strategic Alliances" partner set (canonical hosted logos, matching the
// project's existing content/odoo-xml pages). The live per-page carousels are subsets
// of this same partner roster; using the canonical URLs avoids broken hashed local paths.
const UP = "https://aptusinfotech.com/wp-content/uploads/2025/05";
const ALLIANCES = [
  ["APC", "APC"], ["Vertiv", "Vertiv"], ["Norden-300x180", "Norden"], ["Suprema", "Suprema"],
  ["Tyco", "Tyco"], ["FERMAX-1", "FERMAX"], ["Microsens", "Microsens"], ["LS-Cables", "LS Cables"],
  ["Logitech", "Logitech"], ["Honeywell", "Honeywell"], ["Hikvision", "Hikvision"], ["Fanvil", "Fanvil"],
  ["FAAC", "FAAC"], ["Extron", "Extron"], ["EATON", "EATON"], ["BFT", "BFT"], ["ZKTeco", "ZKTeco"],
  ["Yealink", "Yealink"], ["WatchNet", "WatchNet"], ["URMET", "URMET"], ["TOA", "TOA"],
  ["Schneider", "Schneider"], ["PELCO", "PELCO"], ["Panduit", "Panduit"], ["Nice", "Nice"],
  ["Opterna", "Opterna"], ["Axis", "Axis"], ["Avigilon", "Avigilon"], ["AKCP", "AKCP"],
].map(([file, alt]) => ({ src: `${UP}/${file}.png`, alt }));

// Live ELV inner-page sidebar (matches vertical nav on aptusinfotech.com ELV pages)
const ELV_SIDEBAR = [
  ["Access Control System", "/access-control-system"],
  ["Thermal Scanners", "/thermal-scanners"],
  ["CCTV", "/cctv-camera"],
  ["Gate Automation", "/gate-automation"],
  ["Smart Homes", "/home-automation"],
  ["Audio/Video Solutions", "/audio-video-solutions"],
  ["Telephone Systems", "/telephone-systems"],
  ["Network and Structured Cabling", "/network-and-structured-cabling-solutions"],
  ["UPS", "/ups"],
  ["SMATV/ IPTV", "/smatv-iptv"],
  ["Guest Room Management", "/guest-room-management"],
  ["Nurse Call System", "/nurse-calling-system"],
  ["Queue Management System", "/rsi-queue-management"],
  ["Data Center Solutions", "/data-center-solutions"],
  ["Conference room solution", "/conference-room-solution"],
  ["Switching and Routing", "/switching-and-routing"],
].map(([label, href]) => ({ label, href }));

const FORM_ANCHOR = "#Form";

const titleHtml = (t) => {
  if (!t) return "";
  const before = esc(t.before ?? "");
  const accent = t.accent ? ` <span>${esc(t.accent)}</span>` : "";
  const after = t.after ? ` ${esc(t.after)}` : "";
  return `${before}${accent}${after}`.trim();
};

// ---------- section renderers ----------
function renderCardSection(cs) {
  const heading = titleHtml(cs.title);
  const sub = cs.subheading ? `<p class="elv-section-sub">${esc(cs.subheading)}</p>` : "";
  const isProduct = cs.variant === "product-cards";
  const isValue = cs.variant === "value-cards";
  const isBenefits = cs.id === "benefits" && (cs.gridColumns === 4 || (cs.items?.length ?? 0) === 4);
  const gridCls = isProduct
    ? "elv-card-grid elv-card-grid--product"
    : isValue || isBenefits
      ? "elv-card-grid elv-card-grid--value"
      : "elv-card-grid";
  const cards = (cs.items ?? [])
    .map((it) => {
      const media = it.imageSrc
        ? `<div class="elv-card-img"><img src="${esc(it.imageSrc)}" alt="${esc(it.imageAlt ?? it.title ?? "")}" loading="lazy"/></div>`
        : it.icon
          ? `<div class="elv-card-icon">${iconSvg(it.icon)}</div>`
          : "";
      const body = it.bullets?.length
        ? `<ul>${it.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`
        : it.body
          ? `<p>${esc(it.body)}</p>`
          : "";
      return `            <div class="elv-card${isValue ? " elv-card--value" : ""}">
${media ? "              " + media + "\n" : ""}              <h3>${esc(it.title ?? "")}</h3>
${body ? "              " + body + "\n" : ""}            </div>`;
    })
    .join("\n");
  const bandCls =
    isValue || cs.id === "why-aptus"
      ? ""
      : isBenefits || cs.id === "benefits"
        ? " elv-section--band"
        : "";
  return `        <section class="elv-section${bandCls}">
            <div class="container">
                <div class="elv-section-head">
                    <h2>${heading}</h2>
                    ${sub}
                </div>
                <div class="${gridCls}">
${cards}
                </div>
            </div>
        </section>`;
}

function renderMidCta(c) {
  if (!c) return "";
  return `        <section class="elv-midcta">
            <div class="container">
                <h2>${esc(c.heading ?? "")}</h2>
                ${c.description ? `<p>${esc(c.description)}</p>` : ""}
                <a class="elv-btn elv-btn--light" href="${esc(formHref(c.actionHref))}">${esc(c.actionLabel ?? "Get a Quote")}</a>
            </div>
        </section>`;
}

function renderTestimonials(t) {
  if (!t || t.visible === false) return "";
  const cards = (t.items ?? [])
    .map((q) => {
      const roleLines = [q.role, q.company]
        .filter(Boolean)
        .map((line) => `<div class="elv-quote-role">${esc(line)}</div>`)
        .join("\n                ");
      return `            <div class="elv-quote">
                <p class="elv-quote-text">${esc(q.quote ?? "")}</p>
                <div class="elv-quote-author">${esc(q.author ?? "")}</div>
                ${roleLines}
            </div>`;
    })
    .join("\n");
  return `        <section class="elv-section elv-section--band">
            <div class="container">
                <div class="elv-section-head">
                    <h2>${titleHtml(t.title)}</h2>
                    ${t.subheading ? `<p class="elv-section-sub">${esc(t.subheading)}</p>` : ""}
                </div>
                <div class="elv-quote-grid">
${cards}
                </div>
            </div>
        </section>`;
}

function renderAlliances(partnerships, fallbackLogos) {
  const logos =
    partnerships?.logos?.length
      ? partnerships.logos.map((l) => ({ src: l.src, alt: l.alt ?? "Partner" }))
      : fallbackLogos;
  if (!logos.length) return "";
  const heading = partnerships?.heading ?? "Winning together with";
  const accent = partnerships?.headingAccent ?? "Strategic Alliances";
  const grid = logos
    .map(
      (l) =>
        `                <div class="elv-alliance"><img src="${esc(l.src)}" alt="${esc(l.alt)}" loading="lazy"/></div>`,
    )
    .join("\n");
  return `        <section class="elv-alliances">
            <div class="container">
                <h2>${esc(heading)} <span>${esc(accent)}</span></h2>
                <div class="elv-alliance-grid">
${grid}
                </div>
            </div>
        </section>`;
}

const CONTACT = (heading, submit, layout) => {
  const light = layout === "light";
  return `        <section class="elv-contact${light ? " elv-contact--light" : ""}" id="Form">
            <div class="container">
                <h2>${esc(heading ?? "Have questions? We can help")}</h2>
                <form class="elv-form" action="/contactus" method="post">
                    <div class="elv-form-row">
                        <div class="elv-form-group"><label>First Name *</label><input type="text" name="first_name" required="required"/></div>
                        <div class="elv-form-group"><label>Last Name *</label><input type="text" name="last_name" required="required"/></div>
                    </div>
                    <div class="elv-form-row">
                        <div class="elv-form-group"><label>Email *</label><input type="email" name="email" placeholder="name@mail.com" required="required"/></div>
                        <div class="elv-form-group"><label>Phone *</label><input type="tel" name="phone" placeholder="e.g, +968 0000 0000" required="required"/></div>
                    </div>
                    <div class="elv-form-group"><label>Message</label><textarea name="message" rows="4" placeholder="Message"/></div>
                    <button type="submit" class="elv-btn">${esc(submit ?? "Submit Now")}</button>
                </form>
            </div>
        </section>`;
};

// ---------- stylesheet (shared, mirrors live ELV look + existing odoo-xml palette) ----------
const STYLE = `
.aptus-elv-page { font-family: 'Poppins', sans-serif; color: #1a1a2e; background: #fff; overflow-x: hidden; }
.aptus-elv-page .container { max-width: 1200px; width: 90%; margin: 0 auto; }
.aptus-elv-page h2 { font-size: 34px; color: #1a1a2e; margin: 0 0 10px; }
.aptus-elv-page p { line-height: 1.7; color: #475569; }

.elv-banner { position: relative; padding: 90px 0; text-align: center; color: #fff; background-size: cover; background-position: center; }
.elv-banner::before { content: ""; position: absolute; inset: 0; background: linear-gradient(120deg, rgba(10,22,55,.88), rgba(19,82,163,.78)); }
.elv-banner .container { position: relative; z-index: 1; }
.elv-banner h1 { font-size: 40px; margin: 0 0 14px; color: #fff; }
.elv-banner p { color: #e6eefb; max-width: 720px; margin: 0 auto 26px; font-size: 18px; }

.elv-btn { display: inline-block; background: #1352a3; color: #fff; border: none; padding: 14px 34px; border-radius: 40px; font-size: 16px; font-weight: 600; cursor: pointer; text-decoration: none; transition: .3s; }
.elv-btn:hover { background: #0e3d7a; transform: translateY(-2px); }
.elv-btn--light { background: #fff; color: #1352a3; }

.elv-hero { padding: 60px 0; }
.elv-hero .container { display: flex; flex-wrap: wrap; gap: 40px; align-items: flex-start; }
.elv-hero-sidebar { flex: 0 0 220px; }
.elv-hero-sidebar ul { list-style: none; margin: 0; padding: 0; }
.elv-hero-sidebar a { display: block; padding: 10px 14px; color: #334155; text-decoration: none; border-radius: 8px; font-size: 14px; line-height: 1.4; transition: .2s; }
.elv-hero-sidebar a:hover, .elv-hero-sidebar a.is-active { background: #1352a3; color: #fff; }
.elv-hero-text { flex: 1 1 320px; }
.elv-hero-text h2 { color: #1352a3; }
.elv-hero-media { flex: 1 1 360px; text-align: center; }
.elv-hero-media img { max-width: 100%; border-radius: 18px; }

.elv-section { padding: 60px 0; }
.elv-section--band { background: #f1f5fb; }
.elv-section-head { text-align: center; max-width: 760px; margin: 0 auto 40px; }
.elv-section-head h2 span { color: #38b6ff; }
.elv-section-sub { color: #64748b; margin-top: 8px; }

.elv-card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.elv-card-grid--value { grid-template-columns: repeat(4, 1fr); }
.elv-card-grid--product { grid-template-columns: repeat(4, 1fr); }
.elv-card { background: #fff; border: 1px solid #e6ecf5; border-radius: 16px; padding: 28px 24px; text-align: center; box-shadow: 0 6px 18px rgba(15,40,90,.05); transition: .3s; }
.elv-card:hover { transform: translateY(-4px); box-shadow: 0 16px 34px rgba(15,40,90,.12); }
.elv-card h3 { font-size: 18px; color: #1a1a2e; margin: 14px 0 8px; }
.elv-card p { font-size: 14px; }
.elv-card--value { background: #fff; }
.elv-card-icon { display: flex; justify-content: center; }
.elv-icon { width: 46px; height: 46px; color: #1352a3; }
.elv-card-img img { max-height: 120px; width: auto; object-fit: contain; }

.elv-midcta { background: linear-gradient(120deg, #1352a3, #0a1637); color: #fff; padding: 60px 0; text-align: center; }
.elv-midcta h2 { color: #fff; }
.elv-midcta p { color: #dbe6f7; max-width: 680px; margin: 0 auto 26px; }

.elv-quote-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.elv-quote { background: #fff; border-radius: 16px; padding: 28px; box-shadow: 0 6px 18px rgba(15,40,90,.06); }
.elv-quote-text { font-style: italic; color: #334155; }
.elv-quote-author { font-weight: 700; color: #1352a3; margin-top: 14px; }
.elv-quote-role { font-size: 13px; color: #64748b; }

.elv-alliances { padding: 60px 0; text-align: center; }
.elv-alliances h2 span { color: #38b6ff; }
.elv-alliance-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 18px; margin-top: 34px; }
.elv-alliance { width: 120px; height: 80px; background: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; padding: 12px; box-shadow: 0 5px 15px rgba(0,0,0,.07); }
.elv-alliance img { max-width: 100%; max-height: 54px; }

.elv-contact { background: #003049; color: #fff; padding: 60px 0; text-align: center; }
.elv-contact--light { background: #e8f7f2; color: #1a1a2e; }
.elv-contact--light h2 { color: #1a1a2e; }
.elv-contact--light .elv-form-group label { color: #334155; }
.elv-contact h2 { color: #fff; margin-bottom: 28px; }
.elv-form { max-width: 800px; margin: 0 auto; }
.elv-form-row { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px; }
.elv-form-group { flex: 1; text-align: left; }
.elv-form-group label { display: block; margin-bottom: 8px; font-weight: 500; }
.elv-form-group input, .elv-form-group textarea { width: 100%; padding: 12px 15px; border: none; border-radius: 8px; font-family: 'Poppins', sans-serif; font-size: 14px; }

@media (max-width: 900px) {
  .elv-card-grid, .elv-card-grid--value, .elv-card-grid--product, .elv-quote-grid { grid-template-columns: 1fr; }
  .elv-banner h1 { font-size: 30px; }
  .elv-hero-sidebar { flex: 1 1 100%; }
}
`;

function renderSidebar(currentSlug) {
  const items = ELV_SIDEBAR.map(({ label, href }) => {
    const active = href.replace(/^\//, "") === currentSlug ? ' class="is-active"' : "";
    return `                        <li><a href="${esc(href)}"${active}>${esc(label)}</a></li>`;
  }).join("\n");
  return `                <aside class="elv-hero-sidebar" aria-label="ELV Solutions">
                    <ul>
${items}
                    </ul>
                </aside>`;
}

function formHref(href) {
  return href?.replace("#form", FORM_ANCHOR) ?? FORM_ANCHOR;
}

// ---------- per-page build ----------
function buildXml(slug, j) {
  const hero = j.softwareInnerHero ?? {};
  const bannerBg = BANNER_BG[slug] ?? "";
  const heroImg = hero.imageSrc ?? HERO_IMG[slug] ?? "";

  const banner = `        <section class="elv-banner" style="background-image:url('${esc(bannerBg)}');">
            <div class="container">
                <h1>${esc(hero.bannerTitle ?? "")}</h1>
                ${hero.bannerTagline ? `<p>${esc(hero.bannerTagline)}</p>` : ""}
                <a class="elv-btn elv-btn--light" href="${esc(formHref(hero.ctaHref))}">${esc(hero.ctaLabel ?? "Request a Quote")}</a>
            </div>
        </section>`;

  const heroParas = (hero.paragraphs ?? []).map((p) => `                <p>${esc(p)}</p>`).join("\n");
  const heroSection = `        <section class="elv-hero">
            <div class="container">
${renderSidebar(slug)}
                <div class="elv-hero-text">
                    <h2>${esc(hero.title ?? "")}</h2>
${heroParas}
                    <a class="elv-btn" href="${esc(formHref(hero.ctaHref))}">${esc(hero.ctaLabel ?? "Request a Quote")}</a>
                </div>
                <div class="elv-hero-media">
                    <img src="${esc(heroImg)}" alt="${esc(hero.imageAlt ?? hero.bannerTitle ?? "")}" loading="lazy"/>
                </div>
            </div>
        </section>`;

  const cardSections = (j.cardSections ?? []).map(renderCardSection).join("\n");

  const body = [
    banner,
    heroSection,
    cardSections,
    renderMidCta(j.midCta),
    renderTestimonials(j.testimonials),
    j.partnerships?.logos?.length || j.showPartnerships === true
      ? renderAlliances(j.partnerships, ALLIANCES)
      : "",
    CONTACT(j.contactCta?.heading, j.contactCta?.submitLabel, j.contactCta?.layout),
  ]
    .filter(Boolean)
    .join("\n");

  return `<t t-name="website.elv-${slug}">
    <t t-call="website.layout">
        <div id="wrap" class="oe_structure oe_empty">
            <section class="s_embed_code pt0 pb0 o_colored_level" data-snippet="s_embed_code" data-name="ELV ${slug}">
                <div class="s_embed_code_embedded o_not_editable container-fluid"><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
<style>${STYLE}</style>
<div class="aptus-elv-page aptus-elv-page--${slug}">
${body}
</div></div>
            </section>
        </div>
    </t>
</t>
`;
}

// ---------- run ----------
const KEYWORD_TO_SLUG = [
  ["Access Control", "access-control-system"],
  ["CCTV", "cctv-camera"],
  ["Nurse Calling", "nurse-calling-system"],
  ["Switching and Routing", "switching-and-routing"],
  ["Conference room", "conference-room-solution"],
  ["Data Center", "data-center-solutions"],
  ["Network &", "network-and-structured-cabling-solutions"],
  ["Audio Video", "audio-video-solutions"],
  ["RSI Queue", "rsi-queue-management"],
  ["Gate Automation", "gate-automation"],
  ["Guest Room", "guest-room-management"],
  ["Home Automation", "home-automation"],
  ["SMATV", "smatv-iptv"],
  ["Telephone", "telephone-systems"],
  ["Thermal Scanners", "thermal-scanners"],
  ["UPS Systems", "ups"],
];

const liveBySlug = {};
for (const f of fs.readdirSync(LIVE)) {
  if (!f.endsWith(".html")) continue;
  const hit = KEYWORD_TO_SLUG.find(([kw]) => f.includes(kw));
  if (hit) liveBySlug[hit[1]] = path.join(LIVE, f);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
let count = 0;
for (const [slug, file] of Object.entries(liveBySlug)) {
  const jpath = path.join(JSON_DIR, slug + ".json");
  if (!fs.existsSync(jpath)) continue;
  const j = JSON.parse(fs.readFileSync(jpath, "utf8"));
  const xml = buildXml(slug, j);
  fs.writeFileSync(path.join(OUT_DIR, slug + ".xml"), xml);
  const logoCount =
    j.partnerships?.logos?.length ?? (j.showPartnerships === true ? ALLIANCES.length : 0);
  count++;
  console.log(`✓ ${slug}.xml  (${j.cardSections?.length ?? 0} card sections, ${logoCount} logos)`);
}
console.log(`\nWrote ${count} ELV QWeb templates -> content/odoo-xml/`);
