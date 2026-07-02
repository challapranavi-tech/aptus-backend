#!/usr/bin/env node
/**
 * Generate Odoo QWeb templates for software pages (Autodesk hub + inner products)
 * from content/odoo-json. Mirrors live Elementor layout used by Next.js.
 *
 * Usage: node scripts/generate-software-xml.mjs
 *        node scripts/generate-software-xml.mjs --family autodesk
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LIVE_AUTODESK = path.join(ROOT, "LIVE WEBSITE", "software", "autodesk");
const LIVE_ADOBE = path.join(ROOT, "LIVE WEBSITE", "software", "adobe");
const JSON_ROOT = path.join(ROOT, "content", "odoo-json");
const OUT_DIR = path.join(ROOT, "content", "odoo-xml");
const PRODUCT_CSS = path.join(ROOT, "styles", "software-product-pages.css");

const familyArg = process.argv.find((a) => a.startsWith("--family="))?.split("=")[1] ?? "autodesk";

const AUTODESK_SIDEBAR = [
  ["AutoCAD", "/autocad"],
  ["3ds Max", "/3ds-max"],
  ["Revit", "/revit"],
  ["Civil 3D", "/civil-3d"],
  ["AEC Collection", "/aec-collection"],
  ["AutoCAD LT", "/autocad-lt"],
  ["BIM Collaborate Pro", "/bim-collaborate-pro"],
  ["Autodesk Docs", "/autodesk-docs"],
  ["Autodesk Build", "/autodesk-build"],
  ["Autodesk Takeoff", "/autodesk-takeoff"],
  ["Navisworks", "/navisworks"],
];

const ADOBE_SIDEBAR = [
  ["Adobe Business & Creative Solutions", "/adobe-business-creative-solutions"],
  ["Adobe Acrobat Pro", "/adobe-acrobat-pro"],
  ["Adobe Illustrator", "/adobe-illustrator"],
  ["Adobe Photoshop", "/adobe-photoshop"],
  ["Adobe Premiere Pro", "/adobe-premiere-pro"],
];

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const FORM_ANCHOR = "#Form";

function formHref(href) {
  return href?.replace("#form", FORM_ANCHOR).replace("#Form", FORM_ANCHOR) ?? FORM_ANCHOR;
}

function titleHtml(t) {
  if (!t) return "";
  const before = esc(t.before ?? "");
  const accent = t.accent ? ` <span>${esc(t.accent)}</span>` : "";
  const after = t.after ? ` ${esc(t.after)}` : "";
  return `${before}${accent}${after}`.trim();
}

function readBannerTheme(slug) {
  const css = fs.readFileSync(PRODUCT_CSS, "utf8");
  const grad = css.match(
    new RegExp(`\\.aptus-software-page--${slug.replace(/-/g, "\\-")}\\s*\\{[^}]*--aptus-banner-gradient-end:\\s*(#[0-9a-f]+)`, "i"),
  )?.[1];
  const solid = css.match(
    new RegExp(`\\.aptus-software-page--${slug.replace(/-/g, "\\-")}\\s*\\{[^}]*--aptus-banner-solid:\\s*(#[0-9a-f]+)`, "i"),
  )?.[1];
  const hubBg = css.match(
    new RegExp(
      `\\.aptus-software-page--${slug.replace(/-/g, "\\-")}-hub\\s+\\.aptus-software-hero\\s*\\{[^}]*background-image:\\s*([^;]+)`,
      "i",
    ),
  )?.[1];
  return { grad, solid, hubBg: hubBg?.trim() };
}

function buildIconMap() {
  const icons = {};
  const re =
    /<svg[^>]*class="[^"]*e-fa[brs]-([a-z0-9-]+)[^"]*"[^>]*viewBox="([^"]+)"[^>]*>([\s\S]*?)<\/svg>/gi;
  for (const dir of [LIVE_AUTODESK, LIVE_ADOBE]) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".html")) continue;
      const html = fs.readFileSync(path.join(dir, f), "utf8");
      let m;
      while ((m = re.exec(html))) {
        const [, nm, viewBox, inner] = m;
        if (icons[nm]) continue;
        const paths = [...inner.matchAll(/<path\b[^>]*?\/?>(?:<\/path>)?/gi)]
          .map((p) => p[0].replace(/\s*fill="[^"]*"/gi, "").replace(/<\/path>/gi, "").replace(/\s*\/?>$/, "/>"))
          .join("");
        if (paths) icons[nm] = { viewBox, paths };
      }
    }
  }
  return icons;
}

const ICONS = buildIconMap();

const iconSvg = (name) => {
  const i = name && ICONS[name];
  if (!i) return "";
  return `<svg class="sw-icon" viewBox="${i.viewBox}" fill="currentColor" aria-hidden="true">${i.paths}</svg>`;
};

const STYLE = `
.aptus-sw-page { font-family: 'Poppins', sans-serif; color: #1a1a2e; background: #fff; overflow-x: hidden; }
.aptus-sw-page .container { max-width: 1200px; width: 90%; margin: 0 auto; }
.aptus-sw-page h2 { font-size: 34px; color: #1a1a2e; margin: 0 0 10px; }
.aptus-sw-page p { line-height: 1.7; color: #475569; }

.sw-banner { position: relative; padding: 90px 0; text-align: center; color: #fff; background-size: cover; background-position: center; }
.sw-banner::before { content: ""; position: absolute; inset: 0; background: linear-gradient(120deg, rgba(10,22,55,.75), rgba(19,82,163,.55)); }
.sw-banner--solid::before { background: rgba(0,0,0,.35); }
.sw-banner--gradient::before { background: linear-gradient(135deg, rgba(19,82,163,.92) 0%, var(--sw-banner-end, #f2295b) 100%); opacity: .95; }
.sw-banner .container { position: relative; z-index: 1; }
.sw-banner h1 { font-size: 40px; margin: 0 0 14px; color: #fff; }
.sw-banner p { color: #e6eefb; max-width: 720px; margin: 0 auto 26px; font-size: 18px; }

.sw-btn { display: inline-block; background: #1352a3; color: #fff; border: none; padding: 14px 34px; border-radius: 40px; font-size: 16px; font-weight: 600; cursor: pointer; text-decoration: none; transition: .3s; margin: 4px; }
.sw-btn:hover { background: #0e3d7a; transform: translateY(-2px); }
.sw-btn--light { background: #fff; color: #1352a3; }
.sw-btn--green { background: #67db85; color: #0a1637; }
.sw-btn--sky { background: #38b6ff; color: #fff; }

.sw-hero { padding: 60px 0; }
.sw-hero .container { display: flex; flex-wrap: wrap; gap: 40px; align-items: flex-start; }
.sw-hero-sidebar { flex: 0 0 220px; }
.sw-hero-sidebar ul { list-style: none; margin: 0; padding: 0; }
.sw-hero-sidebar a { display: block; padding: 10px 14px; color: #334155; text-decoration: none; border-radius: 8px; font-size: 14px; line-height: 1.4; transition: .2s; }
.sw-hero-sidebar a:hover, .sw-hero-sidebar a.is-active { background: #1352a3; color: #fff; }
.sw-hero-text { flex: 1 1 320px; }
.sw-hero-text h2 { color: #1352a3; }
.sw-hero-media { flex: 1 1 360px; text-align: center; }
.sw-hero-media img { max-width: 100%; border-radius: 18px; }

.sw-hub-hero { position: relative; padding: 100px 0; color: #fff; background-size: cover; background-position: center; text-align: center; }
.sw-hub-hero::before { content: ""; position: absolute; inset: 0; background: linear-gradient(120deg, rgba(10,22,55,.82), rgba(19,82,163,.65)); }
.sw-hub-hero .container { position: relative; z-index: 1; max-width: 900px; }
.sw-hub-hero h1 { font-size: 44px; margin: 0 0 16px; color: #fff; }
.sw-hub-hero h1 span { color: #38b6ff; }
.sw-hub-hero .sw-highlight { display: inline-block; background: rgba(255,255,255,.15); padding: 8px 18px; border-radius: 999px; margin-bottom: 18px; font-weight: 600; }
.sw-hub-actions { margin-top: 28px; }

.sw-section { padding: 60px 0; }
.sw-section--band { background: #f1f5fb; }
.sw-section-head { text-align: center; max-width: 760px; margin: 0 auto 40px; }
.sw-section-head h2 span { color: #38b6ff; }
.sw-section-sub { color: #64748b; margin-top: 8px; }

.sw-card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.sw-card-grid--value { grid-template-columns: repeat(4, 1fr); }
.sw-card-grid--product { grid-template-columns: repeat(4, 1fr); }
.sw-card-grid--five { grid-template-columns: repeat(5, 1fr); }
.sw-top-banner img { width: 100%; max-height: 520px; object-fit: cover; display: block; }
.sw-card { background: #fff; border: 1px solid #e6ecf5; border-radius: 16px; padding: 28px 24px; text-align: center; box-shadow: 0 6px 18px rgba(15,40,90,.05); transition: .3s; height: 100%; }
.sw-card:hover { transform: translateY(-4px); box-shadow: 0 16px 34px rgba(15,40,90,.12); }
.sw-card h3 { font-size: 18px; color: #1a1a2e; margin: 14px 0 8px; }
.sw-card p { font-size: 14px; }
.sw-card-icon { display: flex; justify-content: center; }
.sw-icon { width: 46px; height: 46px; color: #1352a3; }
.sw-card-img img { max-height: 120px; width: auto; object-fit: contain; }
.sw-card-link { text-decoration: none; color: inherit; display: block; }

.sw-midcta { background: linear-gradient(120deg, #1352a3, #0a1637); color: #fff; padding: 60px 0; text-align: center; }
.sw-midcta h2 { color: #fff; }

.sw-quote-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.sw-quote { background: #fff; border-radius: 16px; padding: 28px; box-shadow: 0 6px 18px rgba(15,40,90,.06); }
.sw-quote-text { font-style: italic; color: #334155; }
.sw-quote-author { font-weight: 700; color: #1352a3; margin-top: 14px; }
.sw-quote-role { font-size: 13px; color: #64748b; }

.sw-alliances { padding: 60px 0; text-align: center; }
.sw-alliances h2 span { color: #38b6ff; }
.sw-alliance-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 18px; margin-top: 34px; }
.sw-alliance { width: 120px; height: 80px; background: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; padding: 12px; box-shadow: 0 5px 15px rgba(0,0,0,.07); }
.sw-alliance img { max-width: 100%; max-height: 54px; }

.sw-contact { background: #e8f7f2; color: #1a1a2e; padding: 60px 0; text-align: center; }
.sw-contact h2 { color: #1a1a2e; margin-bottom: 28px; }
.sw-form { max-width: 800px; margin: 0 auto; }
.sw-form-row { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px; }
.sw-form-group { flex: 1; text-align: left; }
.sw-form-group label { display: block; margin-bottom: 8px; font-weight: 500; color: #334155; }
.sw-form-group input, .sw-form-group textarea { width: 100%; padding: 12px 15px; border: none; border-radius: 8px; font-family: 'Poppins', sans-serif; font-size: 14px; }

@media (max-width: 900px) {
  .sw-card-grid, .sw-card-grid--value, .sw-card-grid--product, .sw-quote-grid { grid-template-columns: 1fr; }
  .sw-banner h1, .sw-hub-hero h1 { font-size: 30px; }
  .sw-hero-sidebar { flex: 1 1 100%; }
}
`;

function renderCardSection(cs, opts = {}) {
  const { quoteToForm = false } = opts;
  const heading = titleHtml(cs.title);
  const sub = cs.subheading ? `<p class="sw-section-sub">${esc(cs.subheading)}</p>` : "";
  const isProduct = cs.variant === "product-cards";
  const isValue = cs.variant === "value-cards";
  const isBenefits = cs.id === "benefits" && (cs.gridColumns === 4 || (cs.items?.length ?? 0) >= 4);
  const gridCls = isProduct
    ? "sw-card-grid sw-card-grid--product"
    : isValue || isBenefits
      ? "sw-card-grid sw-card-grid--value"
      : cs.gridColumns === 5
        ? "sw-card-grid sw-card-grid--five"
        : "sw-card-grid";
  const anchor = cs.anchorId ?? cs.id;
  const cards = (cs.items ?? [])
    .map((it) => {
      const img = it.imageSrc
        ? `<img src="${esc(it.imageSrc)}" alt="${esc(it.imageAlt ?? it.title ?? "")}" loading="lazy"/>`
        : "";
      const media = img
        ? `<div class="sw-card-img">${quoteToForm && it.href ? `<a href="${esc(it.href)}">` : ""}${img}${quoteToForm && it.href ? "</a>" : ""}</div>`
        : it.icon
          ? `<div class="sw-card-icon">${iconSvg(it.icon)}</div>`
          : "";
      const body = it.body ? `<p>${esc(it.body)}</p>` : "";
      const action = quoteToForm && it.actionLabel
        ? `\n              <a class="sw-btn" href="${esc(FORM_ANCHOR)}">${esc(it.actionLabel)}</a>`
        : it.href
          ? `\n              <a class="sw-btn" href="${esc(it.href)}">${esc(it.actionLabel ?? "Learn More")}</a>`
          : "";
      return `            <div class="sw-card${isValue ? " sw-card--value" : ""}">
${media ? "              " + media + "\n" : ""}              <h3>${esc(it.title ?? "")}</h3>
${body ? "              " + body + "\n" : ""}${action}
            </div>`;
    })
    .join("\n");
  const bandCls = isValue || cs.id === "why-aptus" ? "" : isBenefits || cs.id === "benefits" ? " sw-section--band" : "";
  return `        <section class="sw-section${bandCls}"${anchor ? ` id="${esc(anchor)}"` : ""}>
            <div class="container">
                <div class="sw-section-head">
                    <h2>${heading}</h2>
                    ${sub}
                </div>
                <div class="${gridCls}">
${cards}
                </div>
            </div>
        </section>`;
}

function renderTestimonials(t) {
  if (!t || t.visible === false) return "";
  const cards = (t.items ?? [])
    .map(
      (q) => `            <div class="sw-quote">
                <p class="sw-quote-text">${esc(q.quote ?? "")}</p>
                <div class="sw-quote-author">${esc(q.author ?? "")}</div>
                ${q.role ? `<div class="sw-quote-role">${esc(q.role)}</div>` : ""}
            </div>`,
    )
    .join("\n");
  return `        <section class="sw-section sw-section--band">
            <div class="container">
                <div class="sw-section-head">
                    <h2>${titleHtml(t.title)}</h2>
                    ${t.subheading ? `<p class="sw-section-sub">${esc(t.subheading)}</p>` : ""}
                </div>
                <div class="sw-quote-grid">
${cards}
                </div>
            </div>
        </section>`;
}

function renderAlliances(p) {
  if (!p?.logos?.length) return "";
  const grid = p.logos
    .map(
      (l) =>
        `                <div class="sw-alliance"><img src="${esc(l.src)}" alt="${esc(l.alt ?? "Partner")}" loading="lazy"/></div>`,
    )
    .join("\n");
  return `        <section class="sw-alliances">
            <div class="container">
                <h2>${esc(p.heading ?? "Winning together with")} <span>${esc(p.headingAccent ?? "Strategic Alliances")}</span></h2>
                <div class="sw-alliance-grid">
${grid}
                </div>
            </div>
        </section>`;
}

function renderContact(c) {
  if (!c) return "";
  return `        <section class="sw-contact" id="Form">
            <div class="container">
                <h2>${esc(c.heading ?? "Have questions? We can help")}</h2>
                <form class="sw-form" action="/contactus" method="post">
                    <div class="sw-form-row">
                        <div class="sw-form-group"><label>First Name *</label><input type="text" name="first_name" required="required"/></div>
                        <div class="sw-form-group"><label>Last Name *</label><input type="text" name="last_name" required="required"/></div>
                    </div>
                    <div class="sw-form-row">
                        <div class="sw-form-group"><label>Email *</label><input type="email" name="email" placeholder="name@mail.com" required="required"/></div>
                        <div class="sw-form-group"><label>Phone *</label><input type="tel" name="phone" placeholder="e.g, +968 0000 0000" required="required"/></div>
                    </div>
                    <div class="sw-form-group"><label>Message</label><textarea name="message" rows="4" placeholder="Message"/></div>
                    <button type="submit" class="sw-btn">${esc(c.submitLabel ?? "Submit Now")}</button>
                </form>
            </div>
        </section>`;
}

function renderMidCta(c) {
  if (!c) return "";
  return `        <section class="sw-midcta">
            <div class="container">
                <h2>${esc(c.heading ?? "")}</h2>
                ${c.subheading ? `<p class="sw-section-sub">${esc(c.subheading)}</p>` : ""}
                <a class="sw-btn sw-btn--light" href="${esc(formHref(c.actionHref))}">${esc(c.actionLabel ?? "Get a Quote")}</a>
            </div>
        </section>`;
}

function renderSidebar(currentSlug, family = "autodesk") {
  const links = family === "adobe" ? ADOBE_SIDEBAR : AUTODESK_SIDEBAR;
  const label = family === "adobe" ? "Adobe Products" : "Autodesk Products";
  const items = links.map(([labelText, href]) => {
    const active = href.replace(/^\//, "") === currentSlug ? ' class="is-active"' : "";
    return `                        <li><a href="${esc(href)}"${active}>${esc(labelText)}</a></li>`;
  }).join("\n");
  return `                <aside class="sw-hero-sidebar" aria-label="${esc(label)}">
                    <ul>
${items}
                    </ul>
                </aside>`;
}


function buildInnerXml(slug, j) {
  const hero = j.softwareInnerHero ?? {};
  const family = hero.family ?? "autodesk";
  const theme = readBannerTheme(slug);
  const showBanner = Boolean(hero.bannerTitle || hero.bannerTagline);
  const bannerCls = theme.solid
    ? `class="sw-banner sw-banner--solid" style="background-color:${theme.solid}"`
    : theme.grad
      ? `class="sw-banner sw-banner--gradient" style="--sw-banner-end:${theme.grad}"`
      : `class="sw-banner sw-banner--gradient"`;

  const banner = showBanner
    ? `        <section ${bannerCls}>
            <div class="container">
                <h1>${esc(hero.bannerTitle ?? hero.title ?? "")}</h1>
                ${hero.bannerTagline ? `<p>${esc(hero.bannerTagline)}</p>` : ""}
                <a class="sw-btn sw-btn--light" href="${esc(formHref(hero.ctaHref))}">${esc(hero.ctaLabel ?? "Request a Quote")}</a>
            </div>
        </section>`
    : "";

  const topBanner = hero.topBannerImage
    ? `        <section class="sw-top-banner">
            <img src="${esc(hero.topBannerImage)}" alt="${esc(hero.imageAlt ?? hero.title ?? "")}" loading="lazy"/>
        </section>`
    : "";

  const heroParas = (hero.paragraphs ?? []).map((p) => `                <p>${esc(p)}</p>`).join("\n");
  const heroSection = `        <section class="sw-hero">
            <div class="container">
${renderSidebar(slug, family)}
                <div class="sw-hero-text">
                    <h2>${esc(hero.title ?? "")}</h2>
${heroParas}
                    <a class="sw-btn" href="${esc(formHref(hero.ctaHref))}">${esc(hero.ctaLabel ?? "Request a Quote")}</a>
                </div>
                <div class="sw-hero-media">
                    <img src="${esc(hero.imageSrc ?? "")}" alt="${esc(hero.imageAlt ?? hero.title ?? "")}" loading="lazy"/>
                </div>
            </div>
        </section>`;

  const body = [
    topBanner,
    banner,
    heroSection,
    ...(j.cardSections ?? []).map(renderCardSection),
    renderMidCta(j.midCta),
    renderTestimonials(j.testimonials),
    renderAlliances(j.partnerships),
    renderContact(j.contactCta),
  ]
    .filter(Boolean)
    .join("\n");

  const familyLabel = family.charAt(0).toUpperCase() + family.slice(1);
  return wrapXml(`software-${slug}`, `${familyLabel} ${slug}`, body, slug);
}

function buildHubXml(slug, j, { label, quoteToForm = false } = {}) {
  const hero = j.hero ?? {};
  const theme = readBannerTheme(`${slug}-hub`);
  const bg =
    hero.imageSrc ??
    theme.hubBg?.replace(/^url\(["']?|["']?\)$/g, "") ??
    "https://aptusinfotech.com/wp-content/uploads/2025/08/Unlock-the-Power-of-Autodesk.png";
  const hubHero = `        <section class="sw-hub-hero" style="background-image:url('${esc(bg)}')">
            <div class="container">
                ${hero.highlight ? `<div class="sw-highlight">${esc(hero.highlight)}</div>` : ""}
                <h1>${esc(hero.title?.before ?? "")}${hero.title?.accent ? ` <span>${esc(hero.title.accent)}</span>` : ""}</h1>
                ${hero.tagline ? `<p>${esc(hero.tagline)}</p>` : ""}
                <div class="sw-hub-actions">
                    ${(hero.actions ?? [])
                      .map((a) => {
                        const cls =
                          a.tone === "green" ? "sw-btn sw-btn--green" : a.tone === "sky" ? "sw-btn sw-btn--sky" : "sw-btn";
                        return `<a class="${cls}" href="${esc(formHref(a.href))}">${esc(a.label)}</a>`;
                      })
                      .join("\n                    ")}
                </div>
            </div>
        </section>`;

  const body = [
    hubHero,
    ...(j.cardSections ?? []).map((cs) => renderCardSection(cs, { quoteToForm })),
    renderMidCta(j.midCta),
    renderContact(j.contactCta),
  ]
    .filter(Boolean)
    .join("\n");

  return wrapXml(`software-${slug}`, label ?? `${slug} hub`, body, `${slug}-hub`);
}

function wrapXml(name, label, body, scope) {
  return `<t t-name="website.${name}">
    <t t-call="website.layout">
        <div id="wrap" class="oe_structure oe_empty">
            <section class="s_embed_code pt0 pb0 o_colored_level" data-snippet="s_embed_code" data-name="${esc(label)}">
                <div class="s_embed_code_embedded o_not_editable container-fluid"><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
<style>${STYLE}</style>
<div class="aptus-sw-page aptus-sw-page--${esc(scope)}">
${body}
</div></div>
            </section>
        </div>
    </t>
</t>
`;
}

const HUB_FAMILIES = {
  autodesk: { label: "Autodesk hub", quoteToForm: false },
  adobe: { label: "Adobe hub", quoteToForm: true },
};

function main() {
  const hubCfg = HUB_FAMILIES[familyArg];
  if (!hubCfg) {
    console.error(`ponytail: unsupported hub family ${familyArg}, use: ${Object.keys(HUB_FAMILIES).join(", ")}`);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  let count = 0;

  const hubPath = path.join(JSON_ROOT, `${familyArg}.json`);
  if (fs.existsSync(hubPath)) {
    const hub = JSON.parse(fs.readFileSync(hubPath, "utf8"));
    fs.writeFileSync(path.join(OUT_DIR, `${familyArg}.xml`), buildHubXml(familyArg, hub, hubCfg));
    console.log(`✓ ${familyArg}.xml (hub)`);
    count++;
  }

  if (familyArg !== "autodesk" && familyArg !== "adobe") {
    console.log(`\nWrote ${count} software QWeb templates → ${OUT_DIR}/`);
    return;
  }

  const innerDir = path.join(JSON_ROOT, familyArg);
  for (const file of fs.readdirSync(innerDir).filter((f) => f.endsWith(".json"))) {
    const slug = file.replace(/\.json$/, "");
    const j = JSON.parse(fs.readFileSync(path.join(innerDir, file), "utf8"));
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.xml`), buildInnerXml(slug, j));
    console.log(`✓ ${slug}.xml (${j.cardSections?.length ?? 0} sections)`);
    count++;
  }

  console.log(`\nWrote ${count} software QWeb templates → ${OUT_DIR}/`);
}

main();
