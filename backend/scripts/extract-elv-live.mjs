#!/usr/bin/env node
/**
 * Extract ELV hub + inner page content, images, and banner styles from LIVE WEBSITE/ELV.
 * Usage: node scripts/extract-elv-live.mjs
 */

import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LIVE = path.join(ROOT, "LIVE WEBSITE", "ELV");
const JSON_ROOT = path.join(ROOT, "content", "odoo-json");
const ELV_JSON_ROOT = path.join(JSON_ROOT, "elv");
const MANIFEST_PATH = path.join(ROOT, "data", "elv-live-manifest.json");
const MEDIA_TS = path.join(ROOT, "data", "elv-product-media.ts");
const PRODUCT_CSS = path.join(ROOT, "styles", "elv-product-pages.css");

const HUB_ROUTE = "/elv-solutions";
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
    } catch {
      /* next */
    }
  }
  return null;
}

function slugFromRoute(route) {
  return route.replace(/^\/+/, "").toLowerCase() || "home";
}

function stripHtml(s) {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function isElvBannerSection(section) {
  if (isGradientSection(section)) return true;
  return (
    /<h[12][^>]*elementor-heading-title/i.test(section) &&
    /elementor-widget-button/i.test(section) &&
    /background_background&quot;:&quot;classic&quot;|background_background":"classic"/i.test(section)
  );
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

function postCssPath(htmlPath) {
  const postId = fs.readFileSync(htmlPath, "utf8").match(/class="elementor elementor-(\d+)"/i)?.[1];
  if (!postId) return null;
  const p = path.join(`${htmlPath.replace(/\.html$/i, "")}_files`, `post-${postId}.css`);
  return fs.existsSync(p) ? p : null;
}

function extractGradientEnd(htmlPath) {
  const postCss = postCssPath(htmlPath);
  if (!postCss) return undefined;
  const css = fs.readFileSync(postCss, "utf8");
  const grad = css.match(/linear-gradient\([^)]*?(#[0-9a-f]{6})\s*100%/i);
  return grad?.[1]?.toLowerCase();
}

function extractBannerBgImage(htmlPath) {
  const postCss = postCssPath(htmlPath);
  if (!postCss) return undefined;
  const css = fs.readFileSync(postCss, "utf8");
  const bg = css.match(/background-image:\s*url\(["']?(https:\/\/aptusinfotech\.com\/wp-content\/uploads\/[^"')]+)/i);
  return bg?.[1]?.replace(/&amp;/g, "&");
}

function parseBannerSection(section) {
  const headings = [...section.matchAll(/<h([12])[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h\1>/gi)].map(
    (m) => ({ level: Number(m[1]), text: stripHtml(m[2]) }),
  );
  const pMatch = section.match(
    /elementor-widget-text-editor[\s\S]*?<div class="elementor-widget-container">\s*(?:<p>)?([\s\S]*?)(?:<\/p>)?\s*<\/div>/i,
  );
  return {
    title: headings[0]?.text,
    tagline: pMatch ? stripHtml(pMatch[1]) : undefined,
  };
}

const FEATURES_BLOCK_START =
  /Powerful\s+Features|Key\s+Features|Key\s+System\s+Features|Key\s+CCTV|Comprehensive\s+Features|Key\s+Networking/i;

/** Map Elementor FA icon suffix → PillarIcon name in Features.tsx */
const FA_ICON_MAP = {
  "mobile-alt": "mobile",
  fingerprint: "fingerprint",
  "shield-alt": "shield",
  "user-shield": "shield",
  headset: "headset",
  users: "users",
  "user-friends": "user-friends",
  handshake: "handshake",
  "check-circle": "check-circle",
  "dollar-sign": "dollar-sign",
  clock: "stopwatch",
  stopwatch: "stopwatch",
  lightbulb: "lightbulb",
  robot: "robot",
  "cloud-upload-alt": "cloud-upload",
  "graduation-cap": "graduation-cap",
  medal: "medal",
  bullseye: "bullseye",
  "hand-holding-usd": "hand-holding-usd",
  "credit-card": "credit-card",
  "calendar-alt": "calendar-alt",
  database: "database",
  "reply-all": "reply-all",
  "user-nurse": "user-nurse",
  hospital: "hospital",
  certificate: "certificate",
  screwdriver: "screwdriver",
  "drafting-compass": "drafting-compass",
  "phone-alt": "mobile",
  "map-marker-alt": "cube",
  cog: "cube",
  cogs: "cube",
  wifi: "cube",
  "network-wired": "cube",
  "shield-check": "shield",
  lock: "shield",
};

function iconFromColumn(col, fallback = "cube") {
  const m = col.match(/e-fa[brs]-([a-z0-9-]+)/i);
  if (!m) return fallback;
  const fa = m[1].toLowerCase();
  return FA_ICON_MAP[fa] ?? fallback;
}

function sectionH2Title(slice) {
  const beforeGrid = slice.split(/elementor-inner-section/i)[0] ?? slice;
  return stripHtml(beforeGrid.match(/<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "");
}

function cardBodyFromColumn(col) {
  const editor = col.match(
    /elementor-widget-text-editor[\s\S]*?<div class="elementor-widget-container">([\s\S]*?)<\/div>\s*<\/div>/i,
  );
  if (!editor) return "";
  const inner = editor[1];
  const fromP = inner.match(/<p>([\s\S]*?)<\/p>/i)?.[1];
  return stripHtml(fromP ?? inner);
}

function sectionSubheading(slice) {
  return stripHtml(slice.match(/elementor-widget-text-editor[\s\S]*?<p>([\s\S]*?)<\/p>/i)?.[1] ?? "");
}

function extractFeatureBlocks(main) {
  const block = sliceBetween(main, FEATURES_BLOCK_START, /Why\s+Choose\s+Aptus/i);
  if (!block) return null;

  const benefitsIdx = block.search(/Benefits\s+of/i);
  const featuresSlice = benefitsIdx >= 0 ? block.slice(0, benefitsIdx) : block;
  let benefitsSlice = "";
  if (benefitsIdx >= 0) {
    const h2Start = block.lastIndexOf("<h2", benefitsIdx);
    benefitsSlice = block.slice(h2Start >= 0 ? h2Start : benefitsIdx);
  }

  return {
    featuresTitle: sectionH2Title(featuresSlice),
    featuresSub: sectionSubheading(featuresSlice),
    features: extractColumnCards(featuresSlice),
    benefitsTitle: benefitsSlice ? sectionH2Title(benefitsSlice) : "",
    benefitsSub: benefitsSlice ? sectionSubheading(benefitsSlice) : "",
    benefits: benefitsSlice ? extractColumnCards(benefitsSlice) : [],
  };
}

function hasPartnershipsBand(main) {
  return /Winning\s+together\s+with/i.test(main);
}

function parseInnerHeroSection(section, fallbackImage) {
  const headings = [...section.matchAll(/<h([12])[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h\1>/gi)].map(
    (m) => ({ level: Number(m[1]), text: stripHtml(m[2]) }),
  );
  const editor = section.match(
    /elementor-widget-text-editor[\s\S]*?<div class="elementor-widget-container">([\s\S]*?)<\/div>\s*<\/div>/i,
  );
  let paragraphs = [];
  if (editor) {
    const fromP = [...editor[1].matchAll(/<p>([\s\S]*?)<\/p>/gi)].map((m) => stripHtml(m[1])).filter(Boolean);
    paragraphs = fromP.length
      ? fromP
      : editor[1]
          .split(/\n\s*\n/)
          .map((chunk) => stripHtml(chunk))
          .filter((s) => s.length > 20);
  }
  const imgs = [...section.matchAll(/<img[^>]+>/gi)].map((m) => imgUrlFromImgTag(m[0])).filter(Boolean);
  const heroImage =
    imgs.find((u) => /1024|683x|673x|scaled|\.png|\.jpg/i.test(u)) ?? imgs[0] ?? fallbackImage;
  const title = headings.find((h) => h.level === 2)?.text ?? headings[0]?.text;
  return { title, paragraphs, heroImage };
}

function extractHeadings(main) {
  const headings = [];
  const re = /<h([12])[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(main))) {
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
  return items.slice(0, 12);
}

function enrichFeatureBodies(items, paragraphs) {
  const bodies = paragraphs.filter((p) => p.length > 15 && p.length < 400);
  return items.map((it, i) => ({ ...it, body: it.body || bodies[i] || "" }));
}

function sliceBetween(main, startRe, endRe) {
  const textStart = main.search(startRe);
  if (textStart < 0) return "";
  const h2Start = main.lastIndexOf("<h2", textStart);
  const start = h2Start >= 0 ? h2Start : textStart;
  const rest = main.slice(start);
  const end = rest.slice(1).search(endRe);
  return end < 0 ? rest : rest.slice(0, end + 1);
}

function extractColumnCards(slice, { requireButton = false, iconFallback = "cube" } = {}) {
  const cards = [];
  for (const col of slice.split(/elementor-inner-column/gi).slice(1)) {
    const title = stripHtml(col.match(/<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "");
    const body = cardBodyFromColumn(col);
    const hrefRaw = col.match(/elementor-button[^>]*href="([^"]+)"/i)?.[1]?.replace(/&amp;/g, "&");
    if (!title || !body) continue;
    if (requireButton && !hrefRaw) continue;
    let href;
    try {
      href = hrefRaw ? new URL(hrefRaw, "https://aptusinfotech.com").pathname.replace(/\/$/, "") : undefined;
    } catch {
      href = undefined;
    }
    const card = { title, body, icon: iconFromColumn(col, iconFallback) };
    if (href) {
      card.href = href;
      card.actionLabel = "Read More";
      card.actionHref = href;
    }
    cards.push(card);
  }
  return cards;
}

function extractElvServiceCards(main) {
  const slice = sliceBetween(main, /Our\s+Services/i, /Why\s+Choose\s+ELV/i);
  return extractColumnCards(slice, { requireButton: true });
}

function extractTestimonialsFromMain(main) {
  const slice = sliceBetween(
    main,
    /What\s+Our\s+Clients\s+Say|Client\s+Success\s+Stories/i,
    /Winning\s+together|Have\s+questions|id="Form"/i,
  );
  if (!slice) return undefined;

  const subheading = stripHtml(
    slice.match(/elementor-widget-text-editor[\s\S]*?<p>([\s\S]*?)<\/p>/i)?.[1] ?? "",
  );
  const items = [];
  for (const col of slice.split(/elementor-inner-column/gi).slice(1)) {
    const paragraphs = [...col.matchAll(/elementor-widget-text-editor[\s\S]*?<p>([\s\S]*?)<\/p>/gi)].map(
      (m) => stripHtml(m[1]),
    );
    const author = stripHtml(col.match(/<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "");
    const quote = paragraphs.find((p) => p.startsWith("\u201c") || p.startsWith('"')) ?? paragraphs[0] ?? "";
    const role = paragraphs.filter((p) => p !== quote).join(", ");
    if (!author || !quote) continue;
    items.push({ quote, author, role });
  }
  if (!items.length) return undefined;

  const titleH2 = stripHtml(
    slice.match(/<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "What Our Clients Say",
  );
  const title =
    /Client\s+Success\s+Stories/i.test(titleH2)
      ? { before: "Client Success", accent: "Stories" }
      : { before: "What Our", accent: "Clients Say" };

  return {
    visible: true,
    variant: "software-quotes",
    title,
    subheading: subheading || undefined,
    items: items.slice(0, 3),
  };
}

function extractMidCta(main) {
  const h2Match = main.match(/<h2[^>]*elementor-heading-title[^>]*>\s*Ready\s+to[\s\S]*?<\/h2>/i);
  if (!h2Match) return undefined;
  const heading = stripHtml(h2Match[0]);
  const slice = sliceBetween(
    main.slice(h2Match.index ?? 0),
    /^/m,
    /What\s+Our\s+Clients\s+Say|Winning\s+together|Have\s+questions|id="Form"/i,
  );
  const description = stripHtml(slice.match(/elementor-widget-text-editor[\s\S]*?<p>([\s\S]*?)<\/p>/i)?.[1] ?? "");
  const actionHref = slice.match(/elementor-button[^>]*href="([^"]+)"/i)?.[1]?.replace(/&amp;/g, "&");
  return {
    heading,
    description: description || undefined,
    actionLabel:
      stripHtml(slice.match(/elementor-button-text[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? "") ||
      "Get Your Quote Now",
    actionHref: actionHref?.includes("#") ? "#form" : (actionHref ?? "#form"),
  };
}

function contactCta(description) {
  return {
    heading: "Have questions? We can help",
    description,
    showForm: true,
    submitLabel: "Submit Now",
    formVariant: "simple",
    layout: "light",
  };
}

function splitAccentTitle(text) {
  if (!text) return { before: "", accent: "" };
  const words = text.split(/\s+/);
  if (words.length <= 2) return { before: "", accent: text };
  const mid = Math.ceil(words.length / 2);
  return { before: words.slice(0, mid).join(" "), accent: words.slice(mid).join(" ") };
}

function buildSoftwareInnerHero({ banner, inner, heroImage, label }) {
  return {
    id: "hero",
    visible: true,
    family: "elv",
    bannerTitle: banner.title,
    bannerTagline: banner.tagline,
    title: inner.title ?? banner.title,
    paragraphs: inner.paragraphs,
    imageSrc: heroImage,
    imageAlt: label,
    ctaLabel: "Request a Quote",
    ctaHref: "#form",
  };
}

function buildInnerJson({ route, html, htmlPath, main, sections }) {
  const ogImage = extractOgImage(html);
  const bannerSection = sections.find(isElvBannerSection);
  const innerSection = sections.find(hasVerticalNav);
  const banner = bannerSection ? parseBannerSection(bannerSection) : {};
  const inner = innerSection ? parseInnerHeroSection(innerSection, ogImage) : { paragraphs: [], heroImage: ogImage };
  const headings = extractHeadings(main);
  const allParas = [...main.matchAll(/elementor-widget-text-editor[\s\S]*?<p>([\s\S]*?)<\/p>/gi)]
    .map((m) => stripHtml(m[1]))
    .filter((p) => p.length > 20);

  const label = banner.title ?? inner.title ?? slugFromRoute(route);
  const heroImage = inner.heroImage ?? ogImage;

  const featureBlocks = extractFeatureBlocks(main);
  const features = featureBlocks?.features ?? [];
  const benefits = featureBlocks?.benefits ?? [];

  const whyAptusSlice = sliceBetween(
    main,
    /Why\s+Choose\s+Aptus/i,
    /What\s+Our\s+Clients\s+Say|Client\s+Success\s+Stories|Ready\s+to|Winning\s+together|Have\s+questions|id="Form"/i,
  );
  const whyAptus = extractColumnCards(whyAptusSlice, { iconFallback: "medal" });

  const testimonials = extractTestimonialsFromMain(main);
  const midCta = extractMidCta(main);
  const formSlice = sliceBetween(main, /Have\s+questions/i, /<\/main>/i);
  const formDescription = stripHtml(
    formSlice.match(/elementor-widget-text-editor[\s\S]*?<p>([\s\S]*?)<\/p>/i)?.[1] ?? "",
  );

  const cardSections = [];
  if (features.length) {
    cardSections.push({
      id: "features",
      visible: true,
      variant: "icon-cards",
      title: { before: featureBlocks?.featuresTitle || "Key Features" },
      subheading: featureBlocks?.featuresSub || allParas.find((p) => p.length < 120),
      align: "center",
      items: features,
    });
  }
  if (benefits.length) {
    cardSections.push({
      id: "benefits",
      visible: true,
      variant: "icon-cards",
      title: { before: featureBlocks?.benefitsTitle || "Benefits" },
      subheading: featureBlocks?.benefitsSub || undefined,
      align: "center",
      items: benefits,
    });
  }
  if (whyAptus.length) {
    const whyTitle = headings.find((h) => /why choose aptus/i.test(h.text))?.text ?? `Why Choose Aptus Infotech for ${label}?`;
    cardSections.push({
      id: "why-aptus",
      visible: true,
      variant: "value-cards",
      title: splitAccentTitle(whyTitle),
      align: "center",
      items: whyAptus,
    });
  }

  const odoo = {
    softwareInnerHero: buildSoftwareInnerHero({ banner, inner, heroImage, label }),
    cardSections,
    testimonials,
    showPartnerships: hasPartnershipsBand(main),
    contactCta: contactCta(formDescription || undefined),
  };
  if (midCta) odoo.midCta = midCta;

  return {
    route,
    slug: slugFromRoute(route),
    type: "inner",
    heroImage,
    bannerBgImage: extractBannerBgImage(htmlPath),
    gradientEnd: extractGradientEnd(htmlPath),
    odoo,
  };
}

function buildHubJson({ route, html, htmlPath, main, sections }) {
  const ogImage = extractOgImage(html);
  const bannerSection = sections.find(isElvBannerSection);
  const innerSection = sections.find(hasVerticalNav);
  const banner = bannerSection ? parseBannerSection(bannerSection) : {};
  const inner = innerSection ? parseInnerHeroSection(innerSection, ogImage) : { paragraphs: [], heroImage: ogImage };
  const headings = extractHeadings(main);
  const services = extractElvServiceCards(main);

  const whyElvSlice = sliceBetween(main, /Why\s+Choose\s+ELV\s+Solutions/i, /Why\s+Choose\s+Aptus/i);
  const whyElvItems = extractColumnCards(whyElvSlice, { iconFallback: "medal" });

  const whyAptusSlice = sliceBetween(
    main,
    /Why\s+Choose\s+Aptus\s+Infotech\s+for\s+ELV/i,
    /Ready\s+to|What\s+Our\s+Clients\s+Say|Client\s+Success\s+Stories|Winning\s+together|Have\s+questions|id="Form"/i,
  );
  const whyAptusItems = extractColumnCards(whyAptusSlice, { iconFallback: "check-circle" });

  const testimonials = extractTestimonialsFromMain(main);
  const midCta = extractMidCta(main);
  const formSlice = sliceBetween(main, /Have\s+questions/i, /<\/main>/i);
  const formDescription = stripHtml(
    formSlice.match(/elementor-widget-text-editor[\s\S]*?<p>([\s\S]*?)<\/p>/i)?.[1] ?? "",
  );

  const heroImage = inner.heroImage ?? ogImage;
  const cardSections = [];
  if (services.length) {
    cardSections.push({
      id: "services",
      visible: true,
      variant: "icon-cards",
      title: { before: "Our", accent: "Services" },
      subheading: "Comprehensive ELV solutions for all your building needs",
      align: "center",
      items: services,
    });
  }
  if (whyElvItems.length) {
    const whyElvSubheading = stripHtml(
      whyElvSlice.match(/elementor-widget-text-editor[\s\S]*?<p>([\s\S]*?)<\/p>/i)?.[1] ?? "",
    );
    cardSections.push({
      id: "why-elv",
      visible: true,
      variant: "value-cards",
      title: { before: "Why Choose", accent: "ELV Solutions" },
      subheading: whyElvSubheading || "Experience the advantages of working with industry experts",
      align: "center",
      items: whyElvItems,
    });
  }
  if (whyAptusItems.length) {
    cardSections.push({
      id: "why-aptus",
      visible: true,
      variant: "value-cards",
      title: { before: "Why Choose Aptus Infotech for", accent: "ELV?" },
      align: "center",
      items: whyAptusItems,
    });
  }

  return {
    route,
    slug: slugFromRoute(route),
    type: "hub",
    heroImage,
    gradientEnd: extractGradientEnd(htmlPath),
    odoo: {
      softwareInnerHero: buildSoftwareInnerHero({
        banner,
        inner,
        heroImage,
        label: "ELV Solutions",
      }),
      cardSections,
      midCta,
      testimonials,
      showPartnerships: hasPartnershipsBand(main),
      contactCta: contactCta(
        formDescription || "Our experts can help you to implement the right ELV Solution for your business.",
      ),
    },
  };
}

function writeJson(page) {
  fs.mkdirSync(ELV_JSON_ROOT, { recursive: true });
  const outPath =
    page.type === "hub"
      ? path.join(JSON_ROOT, `${page.slug}.json`)
      : path.join(ELV_JSON_ROOT, `${page.slug}.json`);
  fs.writeFileSync(outPath, `${JSON.stringify(page.odoo, null, 2).trim()}\n`, "utf8");
}

const pages = [];
for (const file of walkHtml(LIVE)) {
  const html = fs.readFileSync(file, "utf8");
  const route = routeFromHtml(html);
  if (!route) continue;

  const main = mainContent(html);
  const sections = splitSections(main);
  const isHub = route === HUB_ROUTE;

  pages.push(
    isHub
      ? buildHubJson({ route, html, htmlPath: file, main, sections })
      : buildInnerJson({ route, html, htmlPath: file, main, sections }),
  );
}

pages.sort((a, b) => a.route.localeCompare(b.route));
for (const page of pages) writeJson(page);

const manifest = {
  generatedAt: new Date().toISOString(),
  pages: pages.map((p) => ({
    route: p.route,
    slug: p.slug,
    type: p.type,
    heroImage: p.heroImage,
    bannerBgImage: p.bannerBgImage,
    gradientEnd: p.gradientEnd,
  })),
};
fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

const innerSlugs = pages.filter((p) => p.type === "inner").map((p) => p.slug);
const heroMap = Object.fromEntries(
  pages.filter((p) => p.heroImage).map((p) => [p.slug, p.heroImage]),
);
const bannerBgMap = Object.fromEntries(
  pages.filter((p) => p.bannerBgImage).map((p) => [p.slug, p.bannerBgImage]),
);

let ts = `/** Auto-generated by scripts/extract-elv-live.mjs — do not edit by hand */\n\n`;
ts += `export const ELV_INNER_SLUGS = ${JSON.stringify(innerSlugs, null, 2)} as const;\n`;
ts += `export type ElvInnerSlug = (typeof ELV_INNER_SLUGS)[number];\n\n`;
ts += `export const ELV_HERO_IMAGES: Record<string, string> = ${JSON.stringify(heroMap, null, 2)};\n\n`;
ts += `export const ELV_BANNER_BG_IMAGES: Record<string, string> = ${JSON.stringify(bannerBgMap, null, 2)};\n\n`;
ts += `export function elvHeroImage(slug: string): string | undefined {\n  return ELV_HERO_IMAGES[slug];\n}\n\n`;
ts += `export function elvBannerBgImage(slug: string): string | undefined {\n  return ELV_BANNER_BG_IMAGES[slug];\n}\n\n`;
ts += `export function isElvInnerSlug(slug: string): boolean {\n  return (ELV_INNER_SLUGS as readonly string[]).includes(slug);\n}\n\n`;
ts += `export function isElvHubSlug(slug: string): boolean {\n  return slug === "elv-solutions";\n}\n`;
fs.writeFileSync(MEDIA_TS, ts, "utf8");

const cssLines = [
  "/**",
  " * ELV pages — per-slug banner gradients and photo backgrounds from live Elementor post CSS.",
  " * Auto-generated by scripts/extract-elv-live.mjs",
  " */",
  "",
];

const hubPage = pages.find((p) => p.type === "hub");
if (hubPage?.gradientEnd) {
  cssLines.push(
    `.aptus-elv-page--${hubPage.slug} {`,
    `  --aptus-banner-gradient-end: ${hubPage.gradientEnd};`,
    "}",
    "",
  );
}

for (const page of pages) {
  if (page.type === "inner" && page.bannerBgImage) {
    cssLines.push(
      `.aptus-elv-page--${page.slug} .aptus-software-page-banner {`,
      `  --aptus-banner-bg-image: url("${page.bannerBgImage}");`,
      "}",
      "",
    );
  }
}
fs.writeFileSync(PRODUCT_CSS, `${cssLines.join("\n")}\n`, "utf8");

console.log(`Extracted ${pages.length} ELV pages → ${JSON_ROOT}`);

// ponytail: self-check — UPS must have features + benefits after extract
const upsJson = JSON.parse(fs.readFileSync(path.join(ELV_JSON_ROOT, "ups.json"), "utf8"));
const upsIds = upsJson.cardSections?.map((s) => s.id) ?? [];
if (!upsIds.includes("features") || !upsIds.includes("benefits")) {
  throw new Error(`extract-elv-live: ups.json missing sections (got ${upsIds.join(", ")})`);
}
