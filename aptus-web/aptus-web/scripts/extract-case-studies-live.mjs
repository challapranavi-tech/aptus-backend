#!/usr/bin/env node
/**
 * Extract case studies page content, images, and styles from LIVE WEBSITE/CASE STUDIES.
 * Usage: node scripts/extract-case-studies-live.mjs
 */

import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LIVE = path.join(ROOT, "..", "..", "LIVE WEBSITE", "CASE STUDIES");
const JSON_OUT = path.join(ROOT, "content", "odoo-json", "case-studies", "aptus-case-studies.json");
const CSS_OUT = path.join(ROOT, "src", "styles", "case-studies-pages.css");
const MEDIA_OUT = path.join(ROOT, "src", "data", "case-studies-media.ts");

const WP_BASE = "https://aptusinfotech.com/wp-content/uploads";
const PARTNER_LOGO_BY_ALT = {
  WatchNet: `${WP_BASE}/2025/05/WatchNet.png`,
  Tyco: `${WP_BASE}/2025/05/Tyco.png`,
  suprema: `${WP_BASE}/2025/05/Suprema.png`,
  Hikvision: `${WP_BASE}/2025/05/Hikvision.png`,
  ZKT: `${WP_BASE}/2025/05/ZKTeco.png`,
};

function stripHtml(s) {
  return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function wpUrlFromImgTag(tag) {
  const srcset = tag.match(/srcset="([^"]+)"/i)?.[1];
  if (srcset) {
    const wp = srcset.match(/https:\/\/aptusinfotech\.com\/wp-content\/uploads\/[^\s,]+/i)?.[0];
    if (wp) return wp.replace(/&amp;/g, "&");
  }
  return undefined;
}

function splitAccentTitle(text) {
  if (!text) return { before: "", accent: "" };
  const words = text.split(/\s+/);
  if (words.length <= 2) return { before: "", accent: text };
  const mid = Math.ceil(words.length / 2);
  return { before: words.slice(0, mid).join(" "), accent: words.slice(mid).join(" ") };
}

function walkHtml(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name.endsWith("_files")) continue;
      out.push(...walkHtml(p));
    } else if (ent.name.endsWith(".html")) out.push(p);
  }
  return out;
}

function extractHeroBg(htmlPath) {
  const postCss = path.join(`${htmlPath.replace(/\.html$/i, "")}_files`, "post-5734.css");
  if (!fs.existsSync(postCss)) return undefined;
  const css = fs.readFileSync(postCss, "utf8");
  return css.match(/background-image:url\("([^"]+)"/)?.[1]?.replace(/&amp;/g, "&");
}

function extractCaseStudyCards(main) {
  const grid = main.match(/id="Case"[\s\S]*?<section class="elementor-section elementor-inner-section[\s\S]*?<\/section>/i)?.[0];
  if (!grid) return [];

  const cols = grid.split(/elementor-inner-column/gi).slice(1);
  const items = [];

  for (const col of cols) {
    const imgTag = col.match(/<img[^>]+>/i)?.[0];
    const imageSrc = imgTag ? wpUrlFromImgTag(imgTag) : undefined;
    const imageAlt = imgTag?.match(/alt="([^"]*)"/i)?.[1] || undefined;
    const title = stripHtml(col.match(/<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "");
    const description = stripHtml(
      col.match(/elementor-widget-text-editor[\s\S]*?<div class="elementor-widget-container">\s*(?:<p>)?([\s\S]*?)(?:<\/p>)?\s*<\/div>/i)?.[1] ?? "",
    );
    const pdfHref = col.match(/href="(https:\/\/aptusinfotech\.com\/wp-content\/uploads\/[^"]+\.pdf)"/i)?.[1];
    if (!title || !pdfHref) continue;
    items.push({ title, description, pdfHref, readMoreLabel: "Read More", imageSrc, imageAlt: imageAlt || title });
  }

  return items;
}

function extractPartnerLogos(html) {
  const seen = new Set();
  const logos = [];
  for (const m of html.matchAll(/swiper-slide-image[^>]*src="[^"]*"[^>]*alt="([^"]*)"/gi)) {
    const alt = m[1]?.trim();
    const src = PARTNER_LOGO_BY_ALT[alt];
    if (!alt || !src || seen.has(alt)) continue;
    seen.add(alt);
    logos.push({ alt, src });
  }
  return logos;
}

const htmlFiles = walkHtml(LIVE);
if (!htmlFiles.length) {
  console.error(`No HTML found in ${LIVE}`);
  process.exit(1);
}

const htmlPath = htmlFiles[0];
const html = fs.readFileSync(htmlPath, "utf8");
const main = html.match(/<main[^>]*id="content"[\s\S]*?<\/main>/i)?.[0] ?? html;

const heroTitle = stripHtml(
  main.match(/<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "Aptus Infotech Customer Success Stories",
);
const heroSubtitle = stripHtml(
  main.match(/elementor-element-e6511b9[\s\S]*?<p>([\s\S]*?)<\/p>/i)?.[1] ??
    "Showcasing successful projects delivered by Aptus Infotech, highlighting our expertise and innovation.",
);
const caseTitle = stripHtml(
  main.match(/id="Case"[\s\S]*?<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ??
    "Real Results From Real Projects",
);

const existing = fs.existsSync(JSON_OUT) ? JSON.parse(fs.readFileSync(JSON_OUT, "utf8")) : {};
const caseItems = extractCaseStudyCards(main);

const payload = {
  ...existing,
  hero: {
    ...(existing.hero ?? { id: "hero", visible: true }),
    title: splitAccentTitle(heroTitle),
    subtitle: heroSubtitle,
    backgroundImage: extractHeroBg(htmlPath),
  },
  caseStudies: {
    ...(existing.caseStudies ?? { id: "caseStudies", visible: true }),
    title: splitAccentTitle(caseTitle),
    items: caseItems.length ? caseItems : existing.caseStudies?.items,
  },
  partnerships: {
    id: "partnerships",
    visible: true,
    title: { before: "Winning together with", accent: "Strategic Alliances" },
    logos: extractPartnerLogos(html),
  },
};

fs.mkdirSync(path.dirname(JSON_OUT), { recursive: true });
fs.writeFileSync(JSON_OUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

const heroBg = payload.hero.backgroundImage ?? "";
const css = `/** Case studies page — extracted from live Elementor post-5734 (/aptus-case-studies). Auto-generated. */

@layer utilities {
  .aptus-case-studies-hero {
    background-color: #000;
    background-image: linear-gradient(rgba(245, 166, 35, 0.7), rgba(245, 166, 35, 0.7)), url("${heroBg}");
    background-position: center;
    background-size: cover;
    color: #fff;
    padding: 4rem 0 6rem;
    text-align: center;
  }

  .aptus-case-studies-hero h1,
  .aptus-case-studies-hero h1 span {
    color: #fff;
  }

  .aptus-case-studies-hero h1 {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 600;
    line-height: 1.2;
    margin: 0 auto;
    max-width: 900px;
  }

  .aptus-case-studies-hero p {
    color: #fff;
    font-size: 1.1875rem;
    line-height: 1.6;
    margin: 1rem auto 0;
    max-width: 760px;
  }

  .aptus-case-studies-section-title,
  .aptus-case-studies-section-title span {
    color: #f5a623;
  }

  .aptus-case-studies-section-title {
    font-size: 1.875rem;
    font-weight: 600;
    text-align: center;
  }

  .aptus-case-study-card {
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    text-align: center;
  }

  .aptus-case-study-card__image {
    display: block;
    margin: 0 auto;
    max-height: 200px;
    object-fit: contain;
    padding: 0.5rem;
    width: auto;
  }

  .aptus-case-study-card__body {
    color: #695b5b;
    flex: 1;
    font-size: 0.75rem;
    line-height: 1.5;
    padding: 0 0.5rem 0.75rem;
  }

  .aptus-case-study-card__title {
    font-size: 1rem;
    font-weight: 600;
    padding: 0.5rem;
  }

  .aptus-case-study-card__title a {
    color: inherit;
    text-decoration: none;
  }

  .aptus-case-study-card__title a:hover {
    color: #1352a3;
  }

  .aptus-case-studies-grid {
    margin: 0 auto;
    max-width: 1000px;
  }

  .aptus-case-studies-partners img {
    border-radius: 15rem;
    height: auto;
    max-height: 80px;
    object-fit: contain;
    width: auto;
  }

  .aptus-case-studies-transform {
    background-color: #13934b14;
  }
}
`;

fs.writeFileSync(CSS_OUT, css, "utf8");

const ts = `/** Auto-generated by scripts/extract-case-studies-live.mjs — do not edit by hand */

export const CASE_STUDIES_HERO_IMAGE = ${JSON.stringify(heroBg)};

export const CASE_STUDIES_PARTNER_LOGOS = ${JSON.stringify(payload.partnerships.logos, null, 2)} as const;
`;
fs.writeFileSync(MEDIA_OUT, ts, "utf8");

console.log(`Extracted case studies → ${JSON_OUT}`);
console.log(`  hero bg: ${heroBg || "(none)"}`);
console.log(`  case cards: ${caseItems.length}`);
console.log(`  partner logos: ${payload.partnerships.logos.length}`);
