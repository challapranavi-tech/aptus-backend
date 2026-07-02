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
  Bluebeam: "/bluebeam",
  "Chaos Corona": "/chaos-corona",
  Enscape: "/enscape",
  Lumion: "/luminon",
  "Nitro PDF": "/nitro",
  SketchUp: "/sketchup",
  Twinmotion: "/twinmotion",
  "V-Ray": "/v-ray",
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

function localFileToLiveUrl(src) {
  const file = src?.match(/([^/\\]+\.(?:png|jpe?g|webp))(?:\?|$)/i)?.[1];
  if (!file) return undefined;
  const normalized = file
    .replace(/-radt[a-z0-9]+(?=\.)/i, "")
    .replace(/-e\d+(?=\.)/i, "");
  if (/^(Microsoft-|Windows-)/i.test(normalized)) {
    return `https://aptusinfotech.com/wp-content/uploads/2025/08/${normalized}`;
  }
  // ponytail: local _files saves mirror wp-content/uploads/2025/08 asset names
  return `https://aptusinfotech.com/wp-content/uploads/2025/08/${normalized}`;
}

function imgUrlFromImgTag(tag) {
  const srcset = tag.match(/srcset="([^"]+)"/i)?.[1];
  if (srcset) {
    const wp = srcset.match(/https:\/\/aptusinfotech\.com\/wp-content\/uploads\/[^\s,]+/i)?.[0];
    if (wp && !SKIP_IMG.test(wp)) return wp.replace(/&amp;/g, "&");
  }
  const src = tag.match(/\ssrc="([^"]+)"/i)?.[1];
  if (src?.includes("wp-content/uploads")) return src.replace(/&amp;/g, "&");
  if (src) {
    const live = localFileToLiveUrl(src.replace(/&amp;/g, "&"));
    if (live && !SKIP_IMG.test(live)) return live;
  }
  return undefined;
}

function extractOgImage(html) {
  const m = html.match(/property="og:image"\s+content="([^"]+)"/i);
  const u = m?.[1]?.replace(/&amp;/g, "&");
  return u && !SKIP_IMG.test(u) ? u : undefined;
}

function readPostCss(html, htmlPath) {
  const postId = html.match(/class="elementor elementor-(\d+)"/i)?.[1];
  if (!postId) return "";
  const postCss = path.join(`${htmlPath.replace(/\.html$/i, "")}_files`, `post-${postId}.css`);
  return fs.existsSync(postCss) ? fs.readFileSync(postCss, "utf8") : "";
}

function extractGradientEnd(html, htmlPath) {
  const css = readPostCss(html, htmlPath);
  const grad = css.match(/linear-gradient\([^)]*?(#[0-9a-f]{6})\s*100%/i);
  return grad?.[1]?.toLowerCase();
}

function extractBannerSolid(html, htmlPath) {
  const css = readPostCss(html, htmlPath);
  const solid = css.match(
    /elementor-element-[\w]+[^}]*> \.elementor-motion-effects-layer\{background-color:(#[0-9a-f]{6})/i,
  );
  if (solid) return solid[1].toLowerCase();
  const direct = css.match(/background-color:(#[0-9a-f]{6});[^}]*elementor-background-overlay/i);
  return direct?.[1]?.toLowerCase();
}

/** ponytail: Elementor kit-9 globals — only vars seen in hub hero gradients so far. */
const ELEMENTOR_GLOBAL_COLORS = {
  "--e-global-color-secondary": "#67DB85",
  "--e-global-color-primary": "#1352A3",
};

function extractLinearGradient(css) {
  let idx = 0;
  while ((idx = css.indexOf("background-image:", idx)) >= 0) {
    const gradStart = css.indexOf("linear-gradient(", idx);
    if (gradStart < 0 || gradStart > idx + 80) {
      idx += 1;
      continue;
    }
    let depth = 0;
    for (let i = gradStart; i < css.length; i++) {
      if (css[i] === "(") depth++;
      else if (css[i] === ")") {
        depth--;
        if (depth === 0) return css.slice(gradStart, i + 1);
      }
    }
    idx += 1;
  }
  return undefined;
}

function normalizeGradientForCss(grad) {
  if (!grad?.startsWith("linear-gradient")) return grad;
  let out = grad;
  for (const [varName, hex] of Object.entries(ELEMENTOR_GLOBAL_COLORS)) {
    out = out.replace(new RegExp(`var\\(\\s*${varName.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*\\)`, "gi"), hex);
  }
  return out.replace(/\s+/g, " ");
}

function extractHubHeroBg(html, htmlPath) {
  const css = readPostCss(html, htmlPath);
  const bg = css.match(/background-image:\s*url\(["']?(https:\/\/aptusinfotech\.com\/wp-content\/uploads\/[^"')]+)/i);
  if (bg) return bg[1].replace(/&amp;/g, "&");
  return normalizeGradientForCss(extractLinearGradient(css));
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

function isHeroParagraph(p) {
  return (
    p.length > 30 &&
    !/text-token|conversation-turn|data-start|✅|Why Choose Aptus/i.test(p) &&
    !/^[\u2713]/.test(p)
  );
}

function parseInnerHeroSection(section, fallbackImage) {
  const chunks = section.split(/elementor-top-column/gi).slice(1);
  let title;
  let paragraphs = [];
  let heroImage = fallbackImage;
  let subtitle;

  for (const col of chunks) {
    if (/nav-menu--layout-vertical/i.test(col)) continue;

    const h = col.match(/<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i);
    if (h && !title) title = stripHtml(h[1]);

    // ponytail: only copy from the hero column before icon-card inner sections
    const heroChunk = col.split(/elementor-inner-section[\s\S]*?elementor-widget-icon/i)[0] ?? col;
    const sub = heroChunk.match(/<h2[^>]*elementor-heading-title[^>]*>[\s\S]*?<\/h2>[\s\S]*?<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i);
    if (sub && !subtitle) subtitle = stripHtml(sub[1]);

    if (/elementor-widget-text-editor/i.test(heroChunk)) {
      const paras = [...heroChunk.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
        .map((m) => stripHtml(m[1]))
        .filter(isHeroParagraph);
      if (paras.length) paragraphs = paras;
    }

    const introSection = col.match(
      /elementor-inner-section[\s\S]*?elementor-widget-heading[\s\S]*?<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>[\s\S]*?elementor-widget-text-editor[\s\S]*?<p>([\s\S]*?)<\/p>/i,
    );
    if (introSection) {
      if (!subtitle) subtitle = stripHtml(introSection[1]);
      if (!paragraphs.length) {
        const p = stripHtml(introSection[2]);
        if (isHeroParagraph(p)) paragraphs = [p];
      }
    }

    const imgs = [...col.matchAll(/<img[^>]+>/gi)]
      .map((m) => imgUrlFromImgTag(m[0]))
      .filter(Boolean);
    if (imgs.length) heroImage = imgs[imgs.length - 1] ?? heroImage;
  }

  if (!title) {
    const headings = [...section.matchAll(/<h([12])[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h\1>/gi)].map(
      (m) => ({ level: Number(m[1]), text: stripHtml(m[2]) }),
    );
    title = headings.find((h) => h.level === 1)?.text ?? headings.find((h) => h.level === 2)?.text;
  }

  return { title, subtitle, paragraphs, heroImage };
}

function iconFromColumn(col) {
  const token = (col.match(/e-fas-([a-z0-9-]+)|e-far-([a-z0-9-]+)/i)?.[1] ??
    col.match(/e-fas-([a-z0-9-]+)|e-far-([a-z0-9-]+)/i)?.[2] ??
    "").toLowerCase();
  const icons = {
    medal: "medal",
    headset: "headset",
    handshake: "handshake",
    "graduation-cap": "graduation-cap",
    road: "drafting-compass",
    bolt: "stopwatch",
    sync: "shield",
    users: "users",
    "user-friends": "users",
    "hand-holding-usd": "dollar-sign",
    "check-circle": "check-circle",
    "sync-alt": "sync-alt",
    star: "star",
    "puzzle-piece": "puzzle-piece",
    signature: "check-circle",
    "shield-alt": "shield",
    "file-pdf": "cube",
    "eye-dropper": "cube",
    "chart-bar": "cube",
    lightbulb: "cube",
    industry: "cube",
    building: "cube",
    "ruler-combined": "drafting-compass",
    robot: "robot",
    "cloud-upload": "cloud-upload",
    mobile: "mobile",
    "mobile-alt": "mobile",
    cube: "cube",
  };
  return icons[token] ?? "cube";
}

function parseIconCardColumns(chunk) {
  const innerSections = [...chunk.matchAll(/<section class="elementor-section elementor-inner-section[\s\S]*?<\/section>/gi)].map(
    (m) => m[0],
  );
  const sections = innerSections.length ? innerSections : [chunk];
  const items = [];
  for (const innerSection of sections) {
  for (const col of innerSection.split(/elementor-inner-column/gi).slice(1)) {
    const cardTitle = stripHtml(
      col.match(/<h[23][^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h[23]>/i)?.[1] ?? "",
    );
    if (!cardTitle) continue;

    const afterTitle = col.split(/<h[23][^>]*elementor-heading-title[^>]*>[\s\S]*?<\/h[23]>/i)[1] ?? "";
    const bodyMatch = afterTitle.match(
      /elementor-widget-text-editor[\s\S]*?<div class="elementor-widget-container">\s*(?:<p>)?([\s\S]*?)(?:<\/p>)?\s*<\/div>/i,
    );
    const body = bodyMatch ? stripHtml(bodyMatch[1]) : "";

    const imageTag = col.match(/<img[^>]+>/i)?.[0];
    const imageSrc = imageTag ? imgUrlFromImgTag(imageTag) : undefined;

    items.push({
      title: cardTitle,
      body,
      icon: /elementor-widget-icon/i.test(col) ? iconFromColumn(col) : "cube",
      imageSrc,
      imageAlt: imageTag?.match(/alt="([^"]*)"/i)?.[1] || cardTitle,
    });
  }
  }
  return items;
}

function sliceAfterHeading(main, headingRe, stopRes) {
  const m = main.match(headingRe);
  if (!m || m.index === undefined) return null;
  const start = m.index;
  let end = main.length;
  const tail = main.slice(start + 40);
  for (const stopRe of stopRes) {
    const rel = tail.search(stopRe);
    if (rel > 0) end = Math.min(end, start + 40 + rel);
  }
  return main.slice(start, end);
}

function parseCardBand(main, headingRe, stopRes) {
  const m = main.match(headingRe);
  if (!m || m.index === undefined) return null;
  const chunk = sliceAfterHeading(main, headingRe, stopRes);
  if (!chunk) return null;

  const title = stripHtml(
    main.slice(m.index, m.index + 400).match(/<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ??
      m[0].replace(/<[^>]+>/g, ""),
  );
  const beforeGrid = chunk.split(/elementor-inner-section/i)[0];
  const subMatch = beforeGrid.match(
    /<h2[^>]*elementor-heading-title[\s\S]*?<\/h2>[\s\S]*?elementor-widget-text-editor[\s\S]*?<div class="elementor-widget-container">\s*(?:<p>)?([\s\S]*?)(?:<\/p>)?\s*<\/div>/i,
  );
  const subheading = subMatch ? stripHtml(subMatch[1]) : undefined;
  const items = parseIconCardColumns(chunk);
  if (!title || !items.length) return null;
  return { title, subheading, items };
}

function sectionTitleJson(title) {
  const t = title.trim();
  if (/^why choose aptus infotech for\s+/i.test(t)) {
    const rest = t.replace(/^why choose aptus infotech for\s+/i, "").replace(/\?$/, "");
    return { before: "Why Choose Aptus Infotech for", accent: `${rest}?` };
  }
  if (/^benefits of the\s+/i.test(t)) {
    return { before: t };
  }
  if (/^benefits of using\s+/i.test(t)) {
    return { before: "Benefits of Using", accent: t.replace(/^benefits of using\s+/i, "") };
  }
  if (/^software included in\s+/i.test(t)) {
    return { before: t };
  }
  if (/^key features of\s+/i.test(t)) {
    return { before: "Key Features of", accent: t.replace(/^key features of\s+/i, "") };
  }
  return { before: t };
}

function extractTestimonials(main) {
  const idx = main.search(/What Our Clients Say/i);
  if (idx < 0) return null;
  const chunk = main.slice(idx, idx + 12000);
  const beforeGrid = chunk.split(/elementor-inner-section/i)[0];
  const sub = stripHtml(
    beforeGrid.match(
      /What Our Clients Say[\s\S]*?<\/h2>[\s\S]*?elementor-widget-text-editor[\s\S]*?<div class="elementor-widget-container">\s*(?:<p>)?([\s\S]*?)(?:<\/p>)?\s*<\/div>/i,
    )?.[1] ?? "",
  );
  const cols = chunk.split(/elementor-inner-column/gi).slice(1);
  const items = [];
  for (const col of cols) {
    if (!/elementor-widget-text-editor/i.test(col)) continue;
    const editors = [
      ...col.matchAll(
        /elementor-widget-text-editor[\s\S]*?<div class="elementor-widget-container">([\s\S]*?)<\/div>\s*<\/div>/gi,
      ),
    ];
    const quoteRaw = stripHtml(editors[0]?.[1] ?? "");
    const quote = quoteRaw.replace(/^[\s\u201c"]+|[\s\u201d"]+$/g, "");
    if (!quote || quote.length < 20) continue;
    const author = stripHtml(col.match(/<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "");
    const roleBlock = editors[editors.length - 1]?.[1] ?? "";
    const roleParts = [...roleBlock.matchAll(/<p>([\s\S]*?)<\/p>/gi)]
      .map((r) => stripHtml(r[1]))
      .filter((p) => p && p !== quote);
    const rolePlain = stripHtml(roleBlock.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    if (!author) continue;
    const role =
      roleParts.length >= 2
        ? `${roleParts[0].replace(/,\s*$/, "")}, ${roleParts.slice(1).join(", ")}`
        : roleParts.join(", ") || rolePlain;
    items.push({
      quote: quote.replace(/^[\u201c"]|[\u201d"]$/g, ""),
      author,
      role,
    });
    if (items.length >= 3) break;
  }
  if (!items.length) return null;
  return { subheading: sub || undefined, items };
}

function partnershipsBlock() {
  return {
    heading: "Winning together with",
    headingAccent: "Strategic Alliances",
    variant: "alliances",
    logos: [
      { id: "planswift", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/planswift.png", alt: "planswift" },
      { id: "prokon", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/Prokon.png", alt: "Prokon" },
      { id: "sketchup", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/Sketchup.png", alt: "Sketchup" },
      { id: "sophos", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/sophos.png", alt: "sophos" },
      { id: "spectronova", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/spectronova.png", alt: "spectronova" },
      { id: "aconex", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/aconex.png", alt: "aconex" },
      { id: "autodesk", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/Autodesk.png", alt: "Autodesk" },
      { id: "etap", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/etap.png", alt: "etap" },
      { id: "fortinet", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/fortinet.png", alt: "fortinet" },
      { id: "kaspersky", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/kaspersky.png", alt: "kaspersky" },
      { id: "microsoft", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/Microsoft.png", alt: "Microsoft" },
      { id: "lumion", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/lumion.png", alt: "lumion" },
      { id: "paloalto", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/paloalto.png", alt: "paloalto" },
      { id: "vray", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/v.ray_.png", alt: "v.ray" },
      { id: "twinmotion", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/twinmotion.png", alt: "twinmotion" },
    ],
  };
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
  if (productsIdx < 0) {
    const fallback = main.match(/Popular[\s\S]{0,2000}?elementor-inner-section[\s\S]{0,20000}/i)?.[0];
    return fallback ? parseProductCardsFromChunk(fallback).filter((c) => c.imageSrc) : [];
  }
  const whyIdx = main.search(/Why Choose Aptus Infotech/i);
  const end = whyIdx > productsIdx ? whyIdx : productsIdx + 25000;
  return parseProductCardsFromChunk(main.slice(productsIdx, end)).filter((c) => c.imageSrc);
}

function extractProductsSubheading(main) {
  const idx = main.search(/id="Products"/i);
  if (idx < 0) return undefined;
  const chunk = main.slice(Math.max(0, idx - 2500), idx);
  const sub = chunk.match(
    /Popular[\s\S]*?<\/h2>[\s\S]*?elementor-widget-text-editor[\s\S]*?<p>([\s\S]*?)<\/p>/i,
  );
  return sub ? stripHtml(sub[1]) : undefined;
}

function extractMidCta(main) {
  const btnIdx = main.search(/Get Your Quote Now/i);
  if (btnIdx < 0) return undefined;
  const chunk = main.slice(Math.max(0, btnIdx - 1200), btnIdx + 200);
  const h2s = [...chunk.matchAll(/<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/gi)];
  const last = h2s[h2s.length - 1];
  const heading = last ? stripHtml(last[1]) : "";
  if (!heading || /Have questions/i.test(heading)) return undefined;
  const beforeBtn = chunk.slice(0, chunk.search(/Get Your Quote Now/i));
  const sub = stripHtml(
    beforeBtn.match(/<\/h2>[\s\S]*?elementor-widget-text-editor[\s\S]*?<p>([\s\S]*?)<\/p>/i)?.[1] ?? "",
  );
  return {
    heading,
    subheading: sub || undefined,
    actionLabel: "Get Your Quote Now",
    actionHref: "#form",
  };
}

function parseBulletListBand(main, headingRe, stopRes) {
  const chunk = sliceAfterHeading(main, headingRe, stopRes);
  if (!chunk) return null;
  const title = stripHtml(chunk.match(/<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "");
  const items = [...chunk.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) => {
      const bold = m[1].match(/<strong>([\s\S]*?)<\/strong>/i)?.[1];
      const cardTitle = bold ? stripHtml(bold).replace(/:$/, "") : stripHtml(m[1]).split(":")[0]?.trim();
      const body = bold
        ? stripHtml(m[1].replace(/<strong>[\s\S]*?<\/strong>:?\s*/i, ""))
        : stripHtml(m[1]).split(":").slice(1).join(":").trim();
      return { title: cardTitle, body: body || stripHtml(m[1]), icon: "check" };
    })
    .filter((it) => it.title && it.title.length > 3);
  if (!title || !items.length) return null;
  return { title, items };
}

function parseChecklistWhyAptus(main) {
  const idx = main.search(/<h2[^>]*elementor-heading-title[^>]*>\s*Why Choose Aptus Infotech\s*<\/h2>/i);
  if (idx < 0) return null;
  const chunk = main.slice(idx, idx + 4000);
  const items = [...chunk.matchAll(/<p[^>]*>[\s\S]*?<b>([\s\S]*?)<\/b>/gi)].map((m) => ({
    title: stripHtml(m[1]),
    body: "",
    icon: "check-circle",
  }));
  if (!items.length) return null;
  return {
    id: "why-aptus",
    visible: true,
    variant: "value-cards",
    title: { before: "Why Choose Aptus Infotech" },
    align: "center",
    gridColumns: 4,
    items,
  };
}

function extractTopBannerImage(main) {
  const first = splitSections(main)[0];
  if (!first || /<h1[^>]*elementor-heading-title/i.test(first)) return undefined;
  const img = first.match(/<img[^>]+>/i)?.[0];
  return img ? imgUrlFromImgTag(img) : undefined;
}

function parseSolutionIconStrip(main) {
  const idx = main.search(/empower[^<]{0,120}to:/i);
  if (idx < 0) return null;
  const end = main.search(/Why Choose Aptus Infotech/i);
  const chunk = main.slice(idx, end > idx ? end : idx + 12000);
  const items = parseIconCardColumns(chunk).filter((it) => it.title);
  return items.length ? items : null;
}

function normalizePageHref(href) {
  if (!href) return undefined;
  const hash = href.includes("#") ? `#${href.split("#").pop()}` : undefined;
  try {
    const url = new URL(href, "https://aptusinfotech.com");
    if (hash) return hash;
    const path = url.pathname.replace(/\/$/, "");
    return path || "/";
  } catch {
    return href.startsWith("#") ? href : `#${href.replace(/^#/, "")}`;
  }
}

function parseProductCardsFromChunk(chunk) {
  const cards = [];
  const cols = chunk.split(/elementor-inner-column/gi).slice(1);
  for (const col of cols) {
    const imgTag = col.match(/<img[^>]+>/i)?.[0];
    const imageSrc = imgTag ? imgUrlFromImgTag(imgTag) : undefined;
    const title = stripHtml(col.match(/<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "");
    const bodyMatch = col.match(
      /elementor-widget-text-editor[\s\S]*?<div class="elementor-widget-container">\s*(?:<p>)?([\s\S]*?)(?:<\/p>)?\s*<\/div>/i,
    );
    const body = bodyMatch ? stripHtml(bodyMatch[1]) : "";
    if (!title) continue;

    let actionLabel = "Request a Quote";
    let actionHref = "#form";
    let learnMoreHref = PRODUCT_HREF_BY_TITLE[title];
    for (const btn of col.matchAll(
      /<a class="elementor-button[^"]*" href="([^"]+)"[\s\S]*?elementor-button-text">([^<]+)</gi,
    )) {
      const label = stripHtml(btn[2]);
      const href = normalizePageHref(btn[1].replace(/&amp;/g, "&"));
      if (/learn more/i.test(label)) learnMoreHref = href;
      else if (/request a quote/i.test(label)) {
        actionLabel = label;
        actionHref = href ?? "#form";
      }
    }

    cards.push({
      title,
      body,
      imageSrc: imageSrc ?? PRODUCT_IMAGE_BY_TITLE[title],
      imageAlt: title,
      href: learnMoreHref,
      actionLabel,
      actionHref,
    });
  }
  return cards;
}

function extractMultimediaHubSections(main) {
  const sections = [];
  const collectionChunk = sliceAfterHeading(main, /Our Software Collection/i, [/Why Choose Our Software Collection/i]);
  if (collectionChunk) {
    const items = parseProductCardsFromChunk(collectionChunk).filter((c) => c.imageSrc);
    const subheading = stripHtml(
      collectionChunk.match(/<\/h2>[\s\S]*?elementor-widget-text-editor[\s\S]*?<p>([\s\S]*?)<\/p>/i)?.[1] ?? "",
    );
    if (items.length) {
      sections.push({
        id: "software-collection",
        anchorId: "Software",
        visible: true,
        variant: "product-cards",
        title: { before: "Our Software Collection" },
        subheading: subheading || undefined,
        align: "center",
        gridColumns: 3,
        items,
      });
    }
  }

  const whyCollection = parseCardBand(
    main,
    /Why Choose Our Software Collection/i,
    [/Why Choose Aptus Infotech for Multimedia Software/i],
  );
  if (whyCollection) {
    sections.push({
      id: "why-collection",
      visible: true,
      variant: "icon-cards",
      anchorId: "benefits",
      title: sectionTitleJson(whyCollection.title),
      subheading: whyCollection.subheading,
      align: "center",
      gridColumns: 4,
      items: whyCollection.items.map((it) => ({
        title: it.title,
        body: it.body,
        icon: it.icon,
      })),
    });
  }

  const whyAptus = parseCardBand(
    main,
    /Why Choose Aptus Infotech for Multimedia Software/i,
    [/Ready to Transform Your Workflow/i],
  );
  if (whyAptus) {
    sections.push({
      id: "why-aptus",
      visible: true,
      variant: "value-cards",
      title: sectionTitleJson(whyAptus.title),
      subheading: whyAptus.subheading,
      align: "center",
      gridColumns: 4,
      items: whyAptus.items.map((it) => ({
        title: it.title,
        body: it.body,
        icon: it.icon === "cube" ? "medal" : it.icon,
      })),
    });
  }

  return sections;
}

function extractHeroTagline(heroSection) {
  if (!heroSection) return undefined;
  const withP = heroSection.match(/elementor-widget-text-editor[\s\S]*?<p>([\s\S]*?)<\/p>/i)?.[1];
  if (withP) return stripHtml(withP);
  const raw = heroSection.match(
    /elementor-widget-text-editor[\s\S]*?<div class="elementor-widget-container">\s*([\s\S]*?)\s*<\/div>/i,
  )?.[1];
  return raw ? stripHtml(raw) : undefined;
}

function extractHeroActions(heroSection) {
  const fallback = [
    { label: "Request a Quote", href: "#form", tone: "blue" },
    { label: "Renew Subscription", href: "#form", tone: "green" },
    { label: "Browse Products", href: "#products", tone: "sky" },
  ];
  if (!heroSection) return fallback;

  const buttons = [...heroSection.matchAll(
    /<a class="elementor-button[^"]*" href="([^"]+)"[\s\S]*?elementor-button-text">([^<]+)</gi,
  )];
  if (!buttons.length) return fallback;

  const tones = ["blue", "green", "sky"];
  return buttons.map((btn, i) => ({
    label: stripHtml(btn[2]),
    href: normalizePageHref(btn[1].replace(/&amp;/g, "&")) ?? "#form",
    tone: tones[i] ?? "blue",
  }));
}

function extractHubProductSections(main, family) {
  if (family === "multimedia") {
    return extractMultimediaHubSections(main);
  }

  if (family === "microsoft") {
    const sections = [];
    const coreIdx = main.indexOf("Our Core Microsoft");
    const addIdx = main.indexOf("Additional Microsoft Solutions");
    const readyIdx = main.indexOf("Ready to Get Started", addIdx > 0 ? addIdx : 0);
    const coreChunk = coreIdx >= 0 && addIdx > coreIdx ? main.slice(coreIdx, addIdx) : "";
    const additionalChunk = addIdx >= 0 && readyIdx > addIdx ? main.slice(addIdx, readyIdx) : "";
    if (coreChunk) {
      const items = parseProductCardsFromChunk(coreChunk);
      if (items.length) {
        sections.push({
          id: "products-core",
          anchorId: "products",
          visible: true,
          variant: "product-cards",
          title: { before: "Our Core Microsoft 365 Solutions" },
          subheading: stripHtml(coreChunk.match(/<p>([\s\S]*?)<\/p>/i)?.[1] ?? ""),
          align: "center",
          gridColumns: 3,
          items,
        });
      }
    }
    if (additionalChunk) {
      const items = parseProductCardsFromChunk(additionalChunk);
      if (items.length) {
        sections.push({
          id: "products-additional",
          visible: true,
          variant: "product-cards",
          title: { before: "Additional Microsoft Solutions" },
          subheading: stripHtml(additionalChunk.match(/<p>([\s\S]*?)<\/p>/i)?.[1] ?? ""),
          align: "center",
          gridColumns: 4,
          items,
        });
      }
    }
    return sections;
  }

  const products = extractProductCards(main);
  if (!products.length) return [];
  const sections = [
    {
      id: "products",
      anchorId: "products",
      visible: true,
      variant: "product-cards",
      title: {
        before:
          main.match(/<h2[^>]*elementor-heading-title[^>]*>\s*Popular[^<]+/i)?.[0]?.replace(/<[^>]+>/g, "").trim() ??
          `Popular ${family} Products`,
      },
      subheading: family === "adobe" ? extractProductsSubheading(main) : undefined,
      align: "center",
      gridColumns: family === "adobe" ? 4 : products.length <= 3 ? 3 : 4,
      items: products,
    },
  ];
  if (family === "adobe") {
    const whyHub = parseCardBand(
      main,
      /<h2[^>]*elementor-heading-title[^>]*>\s*Why Choose Aptus Infotech\s*<\/h2>/i,
      [/Ready to Get Started/i],
    );
    if (whyHub) {
      sections.push({
        id: "why-aptus",
        visible: true,
        variant: "value-cards",
        title: sectionTitleJson(whyHub.title),
        subheading: whyHub.subheading,
        align: "center",
        gridColumns: 4,
        items: whyHub.items.map((it) => ({
          title: it.title,
          body: it.body,
          icon: it.icon === "cube" ? "medal" : it.icon,
        })),
      });
    }
  }
  return sections;
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
  const bannerSolid = extractBannerSolid(html, htmlPath);
  const gradientEnd = extractGradientEnd(html, htmlPath);
  const hasColoredBanner = Boolean(bannerSolid || gradientEnd);
  const gradientSection = hasColoredBanner
    ? sections.find((s) => isGradientSection(s) || (/<h1[^>]*elementor-heading-title/i.test(s) && isBannerSection(s)))
    : undefined;
  const innerSection = sections.find(hasVerticalNav);
  const banner = gradientSection ? parseBannerSection(gradientSection) : {};
  const inner = innerSection ? parseInnerHeroSection(innerSection, ogImage) : { paragraphs: [], heroImage: ogImage };
  const topBannerImage = !gradientSection ? extractTopBannerImage(main) : undefined;

  const label = banner.title ?? inner.title ?? slugFromRoute(route);
  let heroImage =
    inner.heroImage ?? ogImage ?? PRODUCT_IMAGE_BY_TITLE[banner.title ?? ""] ?? PRODUCT_IMAGE_BY_TITLE[label];
  // ponytail: saved _files hero names often 404 on /2025/08/ — og:image elementor thumb is the live CDN URL
  if (ogImage?.includes("/elementor/thumbs/") && heroImage?.includes("/2025/08/") && /-e\d+-rcu/i.test(heroImage)) {
    heroImage = ogImage;
  }
  const bannerTitle = banner.title ?? (family === "adobe" && bannerSolid && !topBannerImage ? inner.title : undefined);
  const bannerTagline = banner.tagline ?? inner.subtitle;
  const heroTitle = topBannerImage ? (inner.title ?? inner.subtitle) : (inner.subtitle ?? inner.title ?? banner.title);

  const featuresBand = parseCardBand(
    main,
    /<h2[^>]*elementor-heading-title[^>]*>\s*(Powerful Features|Powerful PDF Management Tools|Key Features[^<]*|Software Included in[^<]*)<\/h2>/i,
    [/(Key Benefits|Benefits of|Benefits for Every|Why Choose Adobe)/i],
  );
  const benefitsBand = parseCardBand(
    main,
    /<h2[^>]*elementor-heading-title[^>]*>\s*(Key Benefits|Benefits of the[^<]*|Benefits of Using[^<]*|Benefits for Every[^<]*|Why Choose Adobe[^<]*\?)<\/h2>/i,
    [/Why Choose Aptus Infotech/i],
  );
  const bulletBand = parseBulletListBand(
    main,
    /<h2[^>]*elementor-heading-title[^>]*>\s*[^<]*empower[^<]*to:\s*<\/h2>/i,
    [/Why Choose Aptus Infotech|Winning together/i],
  );
  const solutionIcons = parseSolutionIconStrip(main);
  const whyBand = parseCardBand(
    main,
    /<h2[^>]*elementor-heading-title[^>]*>\s*Why Choose Aptus Infotech for[^<]*<\/h2>/i,
    [/What Our Clients Say|Have questions|Winning together/i],
  );
  const checklistWhy = parseChecklistWhyAptus(main);

  const cardSections = [];
  if (featuresBand) {
    const hasImages = featuresBand.items.some((it) => it.imageSrc);
    cardSections.push({
      id: "features",
      visible: true,
      variant: hasImages ? "product-cards" : "icon-cards",
      gridColumns: hasImages ? 4 : featuresBand.items.length % 3 === 0 ? 3 : undefined,
      title: sectionTitleJson(featuresBand.title),
      subheading: featuresBand.subheading,
      align: "center",
      items: featuresBand.items.map((it) => ({
        title: it.title,
        body: it.body,
        icon: it.icon,
        imageSrc: it.imageSrc,
        imageAlt: it.imageAlt,
      })),
    });
  }
  if (benefitsBand) {
    cardSections.push({
      id: "benefits",
      visible: true,
      variant: "icon-cards",
      anchorId: "benefits",
      title: sectionTitleJson(benefitsBand.title),
      subheading: benefitsBand.subheading,
      align: "center",
      gridColumns: benefitsBand.items.length >= 4 ? 4 : undefined,
      items: benefitsBand.items.map((it) => ({
        title: it.title,
        body: it.body,
        icon: it.icon === "cube" ? "check" : it.icon,
      })),
    });
  }
  if (bulletBand) {
    cardSections.push({
      id: "capabilities",
      visible: true,
      variant: "bullet-list",
      title: { before: bulletBand.title },
      align: "center",
      items: bulletBand.items,
    });
  }
  if (solutionIcons?.length) {
    cardSections.push({
      id: "solutions",
      visible: true,
      variant: "icon-cards",
      align: "center",
      gridColumns: solutionIcons.length >= 5 ? 5 : 4,
      items: solutionIcons.map((it) => ({
        title: it.title,
        body: it.body,
        icon: it.icon === "cube" ? "check" : it.icon,
      })),
    });
  }
  if (whyBand) {
    cardSections.push({
      id: "why-aptus",
      visible: true,
      variant: "value-cards",
      title: sectionTitleJson(whyBand.title),
      subheading: whyBand.subheading,
      align: "center",
      items: whyBand.items.map((it) => ({
        title: it.title,
        body: it.body,
        icon: it.icon === "cube" ? "medal" : it.icon,
      })),
    });
  }
  if (checklistWhy) cardSections.push(checklistWhy);

  const testimonials = extractTestimonials(main);
  const midCta = extractMidCta(main);

  return {
    route,
    slug: slugFromRoute(route),
    family,
    type: "inner",
    gradientEnd,
    bannerSolid: family === "adobe" ? bannerSolid : undefined,
    heroImage,
    odoo: {
      softwareInnerHero: {
        id: "hero",
        visible: true,
        family,
        bannerTitle: hasColoredBanner || bannerTitle ? bannerTitle : undefined,
        bannerTagline: hasColoredBanner || bannerTitle ? bannerTagline : undefined,
        topBannerImage,
        mediaInline: Boolean(topBannerImage),
        title: heroTitle,
        paragraphs: inner.paragraphs ?? [],
        imageSrc: heroImage,
        imageAlt: label,
        ctaLabel: "Request a Quote",
        ctaHref: "#Form",
      },
      cardSections,
      ...(midCta ? { midCta } : {}),
      ...(testimonials
        ? {
            testimonials: {
              visible: true,
              variant: "software-quotes",
              title: { before: "What Our Clients Say" },
              subheading: testimonials.subheading,
              items: testimonials.items,
            },
          }
        : {}),
      partnerships: partnershipsBlock(),
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
  const tagline = extractHeroTagline(heroSection);
  const heroBg = extractHubHeroBg(html, htmlPath);
  const productSections = extractHubProductSections(main, family);
  const midCta = extractMidCta(main);
  const testimonials = extractTestimonials(main);
  const hubFormHeading = main.match(/id="[Ff]orm"[\s\S]{0,1200}?<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i)?.[1];

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
        tagline: tagline ?? headings[1]?.text,
        highlight: headings.find((h) => /best rates|offers best/i.test(h.text))?.text,
        imageSrc: heroBg,
        imageAlt: family,
        actions: extractHeroActions(heroSection),
      },
      cardSections: productSections,
      midCta,
      ...(testimonials
        ? {
            testimonials: {
              visible: true,
              variant: "software-quotes",
              title: { before: "What Our Clients Say" },
              subheading: testimonials.subheading,
              items: testimonials.items,
            },
          }
        : {}),
      partnerships: partnershipsBlock(),
      contactCta: {
        heading: stripHtml(hubFormHeading ?? "") || "Have questions? We can help",
        showForm: true,
        submitLabel: "Submit Now",
        formVariant: family === "adobe" && hubFormHeading ? "quote" : "simple",
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
  fs.writeFileSync(path.join(outDir, `${page.slug}.json`), `${JSON.stringify(page.odoo, null, 2)}\n`, "utf8");
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
  " * Software pages — per-slug banner colors + hub hero backgrounds from live Elementor post CSS.",
  " * Auto-generated by scripts/extract-software-live.mjs",
  " */",
  "",
];

function hubScopeClass(page) {
  if (page.slug === "multimedia-software-solutions") return "multimedia";
  if (page.slug === "software") return "software";
  return page.slug;
}

for (const page of pages) {
  if (page.type === "hub" && page.heroImage) {
    const scope = hubScopeClass(page);
    const bg = page.heroImage.startsWith("linear-gradient")
      ? normalizeGradientForCss(page.heroImage)
      : `url("${page.heroImage}")`;
    cssLines.push(
      `.aptus-software-page--${scope}-hub .aptus-software-hero {`,
      `  background-image: ${bg};`,
      "}",
      "",
    );
  }
  if (page.type !== "inner" || seen.has(page.slug)) continue;
  seen.add(page.slug);
  const vars = [];
  if (page.bannerSolid) vars.push(`  --aptus-banner-solid: ${page.bannerSolid};`);
  if (page.gradientEnd) vars.push(`  --aptus-banner-gradient-end: ${page.gradientEnd};`);
  if (!vars.length) continue;
  cssLines.push(`.aptus-software-page--${page.slug} {`, ...vars, "}", "");
}
fs.writeFileSync(PRODUCT_CSS, `${cssLines.join("\n")}\n`, "utf8");

console.log(`Extracted ${pages.length} software pages → ${JSON_ROOT}`);
