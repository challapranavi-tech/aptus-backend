#!/usr/bin/env node
/**
 * Extract software page content, images, and banner gradients from LIVE WEBSITE/software.
 * Usage: node scripts/extract-software-live.mjs
 */

import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LIVE = path.join(ROOT, "LIVE WEBSITE", "software");
const JSON_ROOT = path.join(ROOT, "content", "odoo-json");
const OVERRIDE_ROOT = path.join(JSON_ROOT, "overrides");
const MANIFEST_PATH = path.join(ROOT, "data", "software-live-manifest.json");
const MEDIA_TS = path.join(ROOT, "data", "software-product-media.ts");
const PRODUCT_CSS = path.join(ROOT, "styles", "software-product-pages.css");

const HUB_ROUTES = new Set([
  "/software",
  "/autodesk",
  "/adobe",
  "/microsoft",
  "/multimedia-software-solutions",
]);

const FAMILY_BY_FOLDER = {
  adobe: "adobe",
  autodesk: "autodesk",
  microsoft: "microsoft",
  multimedia: "multimedia",
  oracle: "oracle",
  edms: "edms",
  "educational software": "educational",
};

const PRODUCT_IMAGE_BY_TITLE = {
  "Adobe Photoshop": "https://aptusinfotech.com/wp-content/uploads/2025/08/Adobe-Photoshop.png",
  "Adobe Illustrator": "https://aptusinfotech.com/wp-content/uploads/2025/08/adobe-illustrato.png",
  "Adobe InDesign": "https://aptusinfotech.com/wp-content/uploads/2025/08/Adobe-InDesign.png",
  "Adobe Acrobat Pro": "https://aptusinfotech.com/wp-content/uploads/2025/08/Adobe-Acrobat-Pro.png",
  "Adobe Premiere Pro": "https://aptusinfotech.com/wp-content/uploads/2025/08/Adobe-Premiere-Pro.png",
  "Microsoft 365 Apps": "https://aptusinfotech.com/wp-content/uploads/2025/08/Microsoft-365-Apps.png",
  "Microsoft 365 Business": "https://aptusinfotech.com/wp-content/uploads/2025/08/Microsoft-365-Business.png",
  "Microsoft Power BI": "https://aptusinfotech.com/wp-content/uploads/2025/08/Microsoft-Power-BI.png",
  "Microsoft Visio": "https://aptusinfotech.com/wp-content/uploads/2025/10/Microsoft_Visio.png",
};

const PRODUCT_HREF_BY_TITLE = {
  "AutoCAD": "/autocad",
  Revit: "/revit",
  "3ds Max": "/3ds-max",
  "Autodesk Docs": "/autodesk-docs",
  Navisworks: "/navisworks",
  "Civil 3D": "/civil-3d",
  "Adobe Photoshop": "/adobe-photoshop",
  "Adobe Illustrator": "/adobe-illustrator",
  "Adobe InDesign": "/adobe-business-creative-solutions",
  "Adobe Acrobat Pro": "/adobe-acrobat-pro",
  "Adobe Premiere Pro": "/adobe-premiere-pro",
  "Microsoft 365 Apps": "/microsoft-365-apps",
  "Microsoft 365 Business": "/microsoft-365-business",
  "Microsoft Power BI": "/power-bi",
  "Microsoft Visio": "/microsoft-visio",
};

const SKIP_IMG = /logo|cropped-Aptus|Aptus-infotech-orignal|favicon|icon-/i;

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

function routeFromHtml(html) {
  for (const re of [/saved from url=\(([^)]+)\)/i, /rel="canonical"\s+href="([^"]+)"/i]) {
    const m = html.match(re);
    if (!m) continue;
    try {
      return new URL(m[1].replace(/&amp;/g, "&")).pathname.replace(/\/$/, "") || "/";
    } catch { /* next */ }
  }
  return null;
}

function slugFromRoute(route) {
  return route.replace(/^\/+/, "").toLowerCase() || "home";
}

function stripHtml(s) {
  return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function mainContent(html) {
  return html.match(/<main[^>]*id="content"[\s\S]*?<\/main>/i)?.[0] ?? html;
}

function splitSections(main) {
  const parts = main.split(/<section class="elementor-section elementor-top-section/gi);
  return parts.slice(1).map((p) => `<section class="elementor-section elementor-top-section${p}`);
}

function isGradientSection(section) {
  return /background_background&quot;:&quot;gradient&quot;|background_background":"gradient"/i.test(section);
}

function isBannerSection(section) {
  if (isGradientSection(section)) return true;
  return /<h1[^>]*elementor-heading-title/i.test(section) && /elementor-widget-button/i.test(section);
}

function hasVerticalNav(section) {
  return /layout&quot;:&quot;vertical&quot;|nav-menu--layout-vertical/i.test(section);
}

function imgUrlFromImgTag(tag) {
  const srcset = tag.match(/srcset="([^"]+)"/i)?.[1];
  if (srcset) {
    const wp = srcset.match(/https:\/\/aptusinfotech\.com\/wp-content\/uploads\/[^\s,]+/i)?.[0];
    if (wp && !SKIP_IMG.test(wp)) return wp.replace(/&amp;/g, "&");
  }
  const src = tag.match(/\ssrc="([^"]+)"/i)?.[1];
  if (src?.includes("wp-content/uploads")) return src.replace(/&amp;/g, "&");
  return undefined;
}

function extractOgImage(html) {
  const m = html.match(/property="og:image"\s+content="([^"]+)"/i);
  const u = m?.[1]?.replace(/&amp;/g, "&");
  return u && !SKIP_IMG.test(u) ? u : undefined;
}

function extractGradientEnd(html, htmlPath) {
  const postId = html.match(/class="elementor elementor-(\d+)"/i)?.[1];
  if (!postId) return undefined;
  const postCss = path.join(`${htmlPath.replace(/\.html$/i, "")}_files`, `post-${postId}.css`);
  if (!fs.existsSync(postCss)) return undefined;
  const css = fs.readFileSync(postCss, "utf8");
  const grad = css.match(/linear-gradient\([^)]*?(#[0-9a-f]{6})\s*100%/i);
  if (grad) return grad[1].toLowerCase();
  return undefined;
}

function extractHubHeroBg(html, htmlPath) {
  const postId = html.match(/class="elementor elementor-(\d+)"/i)?.[1];
  if (!postId) return undefined;
  const postCss = path.join(`${htmlPath.replace(/\.html$/i, "")}_files`, `post-${postId}.css`);
  if (!fs.existsSync(postCss)) return undefined;
  const css = fs.readFileSync(postCss, "utf8");
  const bg = css.match(/background-image:\s*url\(["']?(https:\/\/aptusinfotech\.com\/wp-content\/uploads\/[^"')]+)/i);
  return bg?.[1]?.replace(/&amp;/g, "&");
}

function parseBannerSection(section) {
  const headings = [...section.matchAll(/<h([12])[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({
    level: Number(m[1]),
    text: stripHtml(m[2]),
  }));
  const pMatch = section.match(/elementor-widget-text-editor[\s\S]*?<div class="elementor-widget-container">\s*(?:<p>)?([\s\S]*?)(?:<\/p>)?\s*<\/div>/i);
  const tagline = pMatch ? stripHtml(pMatch[1]) : undefined;
  return {
    title: headings.find((h) => h.level === 1)?.text ?? headings[0]?.text,
    tagline,
  };
}

function parseInnerHeroSection(section, fallbackImage) {
  const headings = [...section.matchAll(/<h([12])[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({
    level: Number(m[1]),
    text: stripHtml(m[2]),
  }));
  const editor = section.match(/elementor-widget-text-editor[\s\S]*?<div class="elementor-widget-container">([\s\S]*?)<\/div>\s*<\/div>/i);
  const paragraphs = editor
    ? [...editor[1].matchAll(/<p>([\s\S]*?)<\/p>/gi)].map((m) => stripHtml(m[1])).filter(Boolean)
    : [];
  const imgs = [...section.matchAll(/<img[^>]+>/gi)]
    .map((m) => imgUrlFromImgTag(m[0]))
    .filter(Boolean);
  const heroImage = imgs.find((u) => /1024|683x|scaled|\.png|\.jpg/i.test(u)) ?? imgs[0] ?? fallbackImage;
  const title = headings.find((h) => h.level === 1)?.text ?? headings.find((h) => h.level === 2)?.text;
  return { title, paragraphs, heroImage };
}

function extractHeadingsAfter(main, startIdx = 0) {
  const headings = [];
  const re = /<h([12])[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  let i = 0;
  while ((m = re.exec(main))) {
    if (i++ < startIdx) continue;
    const text = stripHtml(m[2]);
    if (text && !/^(Company|Reach Us)$/i.test(text)) headings.push({ level: Number(m[1]), text });
  }
  return headings;
}

function buildFeatureItems(headings, startRe, stopRe) {
  const items = [];
  let inSection = false;
  for (const h of headings) {
    if (startRe.test(h.text)) {
      inSection = true;
      continue;
    }
    if (inSection && stopRe.test(h.text)) break;
    if (inSection && h.level === 2 && h.text.length < 80) items.push({ title: h.text, body: "" });
  }
  return items.slice(0, 8);
}

function enrichFeatureBodies(items, paragraphs) {
  const bodies = paragraphs.filter((p) => p.length > 20 && p.length < 280);
  return items.map((it, i) => ({ ...it, body: it.body || bodies[i] || "" }));
}

function extractProductCards(main) {
  const productsIdx = main.search(/id="Products"/i);
  const grid =
    productsIdx >= 0
      ? main.slice(productsIdx, productsIdx + 25000)
      : main.match(/Popular[\s\S]{0,2000}?elementor-inner-section[\s\S]{0,20000}/i)?.[0];
  if (!grid) return [];

  const cards = [];
  const cols = grid.split(/elementor-inner-column/gi).slice(1);
  for (const col of cols) {
    const imgTag = col.match(/<img[^>]+>/i)?.[0];
    const imageSrc = imgTag ? imgUrlFromImgTag(imgTag) : undefined;
    const title = stripHtml(col.match(/<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "");
    const body = stripHtml(col.match(/elementor-widget-text-editor[\s\S]*?<p>([\s\S]*?)<\/p>/i)?.[1] ?? "");
    if (!title || !(imageSrc ?? PRODUCT_IMAGE_BY_TITLE[title])) continue;
    cards.push({
      title,
      body,
      imageSrc: imageSrc ?? PRODUCT_IMAGE_BY_TITLE[title],
      imageAlt: title,
      href: PRODUCT_HREF_BY_TITLE[title],
      actionLabel: "Request a Quote",
    });
  }
  return cards;
}

function splitAccentTitle(text) {
  if (!text) return { before: "", accent: "" };
  const words = text.split(/\s+/);
  if (words.length <= 2) return { before: "", accent: text };
  const mid = Math.ceil(words.length / 2);
  return { before: words.slice(0, mid).join(" "), accent: words.slice(mid).join(" ") };
}

function buildInnerJson({ route, family, html, htmlPath, main, sections }) {
  const ogImage = extractOgImage(html);
  const gradientSection = sections.find(isBannerSection);
  const innerSection = sections.find(hasVerticalNav);
  const banner = gradientSection ? parseBannerSection(gradientSection) : {};
  const inner = innerSection ? parseInnerHeroSection(innerSection, ogImage) : { paragraphs: [], heroImage: ogImage };
  const headings = extractHeadingsAfter(main, 0);
  const allParas = [...main.matchAll(/elementor-widget-text-editor[\s\S]*?<p>([\s\S]*?)<\/p>/gi)]
    .map((m) => stripHtml(m[1]))
    .filter((p) => p.length > 30);

  const label = banner.title ?? inner.title ?? slugFromRoute(route);
  const heroImage =
    inner.heroImage ?? ogImage ?? PRODUCT_IMAGE_BY_TITLE[banner.title ?? ""] ?? PRODUCT_IMAGE_BY_TITLE[label];
  const features = enrichFeatureBodies(
    buildFeatureItems(headings, /key features|powerful features|capabilities/i, /benefits|why choose/i),
    allParas,
  );
  const benefits = enrichFeatureBodies(
    buildFeatureItems(headings, /benefits|key benefits/i, /why choose/i),
    allParas,
  );
  const whyAptus = enrichFeatureBodies(
    buildFeatureItems(headings, /why choose aptus/i, /ready to|what our|have questions|winning together/i),
    allParas,
  );

  const cardSections = [];
  if (features.length) {
    cardSections.push({
      id: "features",
      visible: true,
      variant: "icon-cards",
      title: { before: "Key Features of", accent: label.replace(/^Autodesk\s+/i, "") },
      subheading: "Discover the capabilities that make this solution industry-leading",
      align: "center",
      items: features.map((it) => ({ title: it.title, body: it.body, icon: "cube" })),
    });
  }
  if (benefits.length) {
    cardSections.push({
      id: "benefits",
      visible: true,
      variant: "icon-cards",
      anchorId: "benefits",
      title: { before: "Benefits of Using", accent: label },
      align: "center",
      items: benefits.map((it) => ({ title: it.title, body: it.body, icon: "check" })),
    });
  }
  if (whyAptus.length) {
    cardSections.push({
      id: "why-aptus",
      visible: true,
      variant: "value-cards",
      title: { before: "Why Choose Aptus Infotech for", accent: `${label}?` },
      align: "center",
      items: whyAptus.map((it) => ({ title: it.title, body: it.body, icon: "medal" })),
    });
  }

  return {
    route,
    slug: slugFromRoute(route),
    family,
    type: "inner",
    gradientEnd: extractGradientEnd(html, htmlPath),
    heroImage,
    odoo: {
      softwareInnerHero: {
        id: "hero",
        visible: true,
        family,
        bannerTitle: banner.title,
        bannerTagline: banner.tagline,
        title: inner.title ?? banner.title,
        paragraphs: inner.paragraphs?.length ? inner.paragraphs : allParas.slice(0, 3),
        imageSrc: heroImage,
        imageAlt: label,
        ctaLabel: "Request a Quote",
        ctaHref: "#form",
      },
      cardSections,
      contactCta: {
        heading: "Have questions? We can help",
        showForm: true,
        submitLabel: "Submit Now",
        formVariant: "simple",
        layout: "light",
      },
    },
  };
}

function buildHubJson({ route, family, html, htmlPath, main, sections }) {
  const heroSection = sections.find(isBannerSection) ?? sections[0];
  const headings = [...(heroSection?.matchAll(/<h([12])[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h\1>/gi) ?? [])].map(
    (m) => ({ level: Number(m[1]), text: stripHtml(m[2]) }),
  );
  const paragraphs = [...(heroSection?.matchAll(/elementor-widget-text-editor[\s\S]*?<p>([\s\S]*?)<\/p>/gi) ?? [])].map(
    (m) => stripHtml(m[1]),
  );
  const heroBg = extractHubHeroBg(html, htmlPath);
  const products = extractProductCards(main);

  return {
    route,
    slug: slugFromRoute(route),
    family,
    type: "hub",
    heroImage: heroBg,
    odoo: {
      hero: {
        id: "hero",
        visible: true,
        variant: "software-landing",
        title: splitAccentTitle(headings[0]?.text ?? family),
        tagline: paragraphs[0] ?? headings[1]?.text,
        highlight: headings.find((h) => /best rates|offers best/i.test(h.text))?.text,
        imageSrc: heroBg,
        imageAlt: family,
        actions: [
          { label: "Request a Quote", href: "#form", tone: "blue" },
          { label: "Renew Subscription", href: "#form", tone: "green" },
          { label: "Browse Products", href: "#products", tone: "sky" },
        ],
      },
      cardSections: products.length
        ? [
            {
              id: "products",
              visible: true,
              variant: "product-cards",
              title: { before: headings.find((h) => /popular/i.test(h.text))?.text ?? `Popular ${family} Products` },
              subheading: paragraphs.find((p) => p.length > 40) ?? paragraphs[0],
              align: "center",
              items: products,
            },
          ]
        : [],
      midCta: {
        heading: "Ready to Get Started?",
        actionLabel: "Get Your Quote Now",
        actionHref: "#form",
      },
      contactCta: {
        heading: "Have questions? We can help",
        showForm: true,
        submitLabel: "Submit Now",
        formVariant: "simple",
        layout: "light",
      },
    },
  };
}

function overridePath(page) {
  const rel = page.type === "hub" ? `${page.slug}.json` : path.join(page.family, `${page.slug}.json`);
  return path.join(OVERRIDE_ROOT, rel);
}

function writeJson(page) {
  const outDir = page.type === "hub" ? JSON_ROOT : path.join(JSON_ROOT, page.family);
  fs.mkdirSync(outDir, { recursive: true });
  const ovr = overridePath(page);
  const payload = fs.existsSync(ovr) ? fs.readFileSync(ovr, "utf8") : JSON.stringify(page.odoo, null, 2);
  fs.writeFileSync(path.join(outDir, `${page.slug}.json`), `${payload.trim()}\n`, "utf8");
}

// ── scan ───────────────────────────────────────────────────
const pages = [];
for (const file of walkHtml(LIVE)) {
  const html = fs.readFileSync(file, "utf8");
  const route = routeFromHtml(html);
  if (!route) continue;

  const folder = path.basename(path.dirname(file)).toLowerCase();
  const family = FAMILY_BY_FOLDER[folder] ?? folder.replace(/\s+/g, "-");
  const main = mainContent(html);
  const sections = splitSections(main);
  const isHub = HUB_ROUTES.has(route) || /software solutions/i.test(path.basename(file));

  pages.push(
    isHub
      ? buildHubJson({ route, family, html, htmlPath: file, main, sections })
      : buildInnerJson({ route, family, html, htmlPath: file, main, sections }),
  );
}

pages.sort((a, b) => a.route.localeCompare(b.route));

fs.mkdirSync(JSON_ROOT, { recursive: true });
for (const page of pages) writeJson(page);

const manifest = {
  generatedAt: new Date().toISOString(),
  pages: pages.map((p) => ({
    route: p.route,
    slug: p.slug,
    family: p.family,
    type: p.type,
    heroImage: p.heroImage,
    gradientEnd: p.gradientEnd,
  })),
};
fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

const innerPages = pages.filter((p) => p.type === "inner" && p.heroImage);
const heroMap = Object.fromEntries(innerPages.map((p) => [p.slug, p.heroImage]));
const families = [...new Set(innerPages.map((p) => p.family))].sort();

let ts = `/** Auto-generated by scripts/extract-software-live.mjs — do not edit by hand */\n\n`;
ts += `export const SOFTWARE_FAMILIES = ${JSON.stringify(families, null, 2)} as const;\n`;
ts += `export type SoftwareFamily = (typeof SOFTWARE_FAMILIES)[number];\n\n`;
ts += `export const SOFTWARE_PRODUCT_HERO_IMAGES: Record<string, string> = ${JSON.stringify(heroMap, null, 2)};\n\n`;
ts += `export function softwareHeroImage(slug: string): string | undefined {\n  return SOFTWARE_PRODUCT_HERO_IMAGES[slug];\n}\n\n`;
ts += `export function isSoftwareInnerSlug(slug: string): boolean {\n  return slug in SOFTWARE_PRODUCT_HERO_IMAGES;\n}\n`;
fs.writeFileSync(MEDIA_TS, ts, "utf8");

const seen = new Set();
const cssLines = [
  "/**",
  " * Software inner pages — per-slug banner gradients from live Elementor post CSS.",
  " * Auto-generated by scripts/extract-software-live.mjs",
  " */",
  "",
];
for (const page of pages) {
  if (page.type !== "inner" || !page.gradientEnd || seen.has(page.slug)) continue;
  seen.add(page.slug);
  cssLines.push(`.aptus-software-page--${page.slug} {`, `  --aptus-banner-gradient-end: ${page.gradientEnd};`, "}", "");
}
fs.writeFileSync(PRODUCT_CSS, `${cssLines.join("\n")}\n`, "utf8");

console.log(`Extracted ${pages.length} software pages → ${JSON_ROOT}`);
