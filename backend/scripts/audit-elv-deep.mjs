#!/usr/bin/env node
/** Deep ELV audit — content, sections, assets vs live HTML */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LIVE = path.join(ROOT, "LIVE WEBSITE", "ELV");
const JSON_ROOT = path.join(ROOT, "content", "odoo-json", "elv");
const HUB_JSON = path.join(ROOT, "content", "odoo-json", "elv-solutions.json");

function walkHtml(dir) {
  const out = [];
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

function sliceBetween(main, startRe, endRe) {
  const start = main.search(startRe);
  if (start < 0) return "";
  const rest = main.slice(start);
  const end = rest.slice(1).search(endRe);
  return end < 0 ? rest : rest.slice(0, end + 1);
}

function extractColumnCards(slice, { requireButton = false } = {}) {
  const cards = [];
  for (const col of slice.split(/elementor-inner-column/gi).slice(1)) {
    const title = stripHtml(col.match(/<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "");
    const body = stripHtml(col.match(/elementor-widget-text-editor[\s\S]*?<p>([\s\S]*?)<\/p>/i)?.[1] ?? "");
    const hrefRaw = col.match(/elementor-button[^>]*href="([^"]+)"/i)?.[1];
    if (!title || !body) continue;
    if (requireButton && !hrefRaw) continue;
    cards.push({ title, body });
  }
  return cards;
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

function splitSections(main) {
  const parts = main.split(/<section class="elementor-section elementor-top-section/gi);
  return parts.slice(1).map((p) => `<section class="elementor-section elementor-top-section${p}`);
}

function imgUrlFromImgTag(tag) {
  const srcset = tag.match(/srcset="([^"]+)"/i)?.[1];
  if (srcset) {
    const wp = srcset.match(/https:\/\/aptusinfotech\.com\/wp-content\/uploads\/[^\s,]+/i)?.[0];
    if (wp) return wp.replace(/&amp;/g, "&");
  }
  const src = tag.match(/\ssrc="([^"]+)"/i)?.[1];
  if (src?.includes("wp-content/uploads")) return src.replace(/&amp;/g, "&");
  return undefined;
}

function parseInnerHeroSection(section, fallbackImage) {
  const headings = [...section.matchAll(/<h([12])[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h\1>/gi)].map(
    (m) => ({ level: Number(m[1]), text: stripHtml(m[2]) }),
  );
  const editor = section.match(
    /elementor-widget-text-editor[\s\S]*?<div class="elementor-widget-container">([\s\S]*?)<\/div>\s*<\/div>/i,
  );
  const paragraphs = editor
    ? [...editor[1].matchAll(/<p>([\s\S]*?)<\/p>/gi)].map((m) => stripHtml(m[1])).filter(Boolean)
    : [];
  const imgs = [...section.matchAll(/<img[^>]+>/gi)].map((m) => imgUrlFromImgTag(m[0])).filter(Boolean);
  const heroImage = imgs.find((u) => /1024|683x|673x|scaled|\.png|\.jpg/i.test(u)) ?? imgs[0] ?? fallbackImage;
  const title = headings.find((h) => h.level === 2)?.text ?? headings[0]?.text;
  return { title, paragraphs, heroImage };
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

function extractOgImage(html) {
  const m = html.match(/property="og:image"\s+content="([^"]+)"/i);
  return m?.[1]?.replace(/&amp;/g, "&");
}

function extractLivePage(html, isHub) {
  const main = mainContent(html);
  const sections = splitSections(main);
  const bannerSection = sections.find(isElvBannerSection);
  const innerSection = sections.find(hasVerticalNav);
  const ogImage = extractOgImage(html);
  const banner = bannerSection ? parseBannerSection(bannerSection) : {};
  const inner = innerSection ? parseInnerHeroSection(innerSection, ogImage) : { paragraphs: [], heroImage: ogImage };

  const featuresSlice = isHub
    ? sliceBetween(main, /Our\s+Services/i, /Why\s+Choose\s+ELV/i)
    : sliceBetween(main, /Key\s+Features|Powerful\s+Features|Key\s+Networking|capabilities|technologies/i, /Why\s+Choose\s+Aptus/i);

  const featuresTitle = stripHtml(
    featuresSlice.match(/<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "",
  );
  const featuresSub = stripHtml(
    featuresSlice.match(/elementor-widget-text-editor[\s\S]*?<p>([\s\S]*?)<\/p>/i)?.[1] ?? "",
  );

  const features = extractColumnCards(featuresSlice);
  const whyAptus = extractColumnCards(
    sliceBetween(main, /Why\s+Choose\s+Aptus/i, /What\s+Our|Ready\s+to|Winning|Have\s+questions/i),
  );
  const whyElv = isHub
    ? extractColumnCards(sliceBetween(main, /Why\s+Choose\s+ELV\s+Solutions/i, /Why\s+Choose\s+Aptus/i))
    : [];
  const services = isHub
    ? extractColumnCards(sliceBetween(main, /Our\s+Services/i, /Why\s+Choose\s+ELV/i), { requireButton: true })
    : [];

  const hasTestimonials = /What\s+Our\s+Clients\s+Say|Client\s+Success\s+Stories/i.test(main);
  const hasMidCta = /Ready\s+to/i.test(main);
  const midCtaHeading = stripHtml(
    main.match(/<h2[^>]*elementor-heading-title[^>]*>\s*Ready\s+to[\s\S]*?<\/h2>/i)?.[0] ?? "",
  );
  const hasPartnerships = /Winning\s+together/i.test(main);
  const partnershipLogos = (main.match(/wp-content\/uploads[^"']+\.(png|jpg|webp|svg)/gi) ?? []).length;

  return {
    banner,
    inner,
    featuresTitle,
    featuresSub,
    features,
    whyAptus,
    whyElv,
    services,
    hasTestimonials,
    hasMidCta,
    midCtaHeading,
    hasPartnerships,
    partnershipLogos,
  };
}

const results = [];

for (const file of walkHtml(LIVE)) {
  const html = fs.readFileSync(file, "utf8");
  const route = routeFromHtml(html);
  if (!route) continue;

  const slug = slugFromRoute(route);
  const isHub = route === "/elv-solutions";
  const jsonPath = isHub ? HUB_JSON : path.join(JSON_ROOT, `${slug}.json`);
  if (!fs.existsSync(jsonPath)) {
    results.push({ slug, route, critical: [`No JSON at ${jsonPath}`] });
    continue;
  }

  const json = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const live = extractLivePage(html, isHub);
  const issues = [];

  const hero = json.softwareInnerHero ?? {};
  if (live.banner.title && hero.bannerTitle !== live.banner.title) {
    issues.push({ cat: "content", msg: `Banner title mismatch: JSON="${hero.bannerTitle}" live="${live.banner.title}"` });
  }
  if (live.banner.tagline && hero.bannerTagline !== live.banner.tagline) {
    issues.push({ cat: "content", msg: `Banner tagline mismatch` });
  }
  if (live.inner.title && hero.title !== live.inner.title) {
    issues.push({ cat: "content", msg: `Hero title mismatch: JSON="${hero.title}" live="${live.inner.title}"` });
  }
  if (live.inner.paragraphs.length && (!hero.paragraphs || hero.paragraphs.length === 0)) {
    issues.push({ cat: "content", msg: `Missing ${live.inner.paragraphs.length} hero paragraph(s) in JSON` });
  } else if (live.inner.paragraphs.length && hero.paragraphs?.length) {
    const liveFirst = live.inner.paragraphs[0].slice(0, 60);
    const jsonFirst = hero.paragraphs[0]?.slice(0, 60) ?? "";
    if (liveFirst !== jsonFirst) {
      issues.push({ cat: "content", msg: `Hero paragraph text differs` });
    }
  }
  if (live.inner.heroImage && hero.imageSrc && !hero.imageSrc.includes(live.inner.heroImage.split("/").pop()?.split("-")[0] ?? "___")) {
    // loose image check
    if (hero.imageSrc !== live.inner.heroImage) {
      issues.push({ cat: "assets", msg: `Hero image URL differs` });
    }
  }

  // Card sections
  const cardSections = json.cardSections ?? [];
  const featuresSec = cardSections.find((c) => c.id === "features" || c.id === "services");
  if (featuresSec && live.featuresTitle) {
    const jsonTitle = [featuresSec.title?.before, featuresSec.title?.accent].filter(Boolean).join(" ");
    if (jsonTitle && live.featuresTitle && jsonTitle.toLowerCase() !== live.featuresTitle.toLowerCase()) {
      issues.push({ cat: "structure", msg: `Features section title: JSON="${jsonTitle}" live="${live.featuresTitle}"` });
    }
  }

  const compareCards = (liveCards, jsonItems, label) => {
    if (!liveCards.length) return;
    if (!jsonItems?.length) {
      issues.push({ cat: "content", msg: `Missing ${label} cards (${liveCards.length} on live)` });
      return;
    }
    if (liveCards.length !== jsonItems.length) {
      issues.push({ cat: "content", msg: `${label} card count: JSON=${jsonItems.length} live=${liveCards.length}` });
    }
    for (let i = 0; i < Math.min(liveCards.length, jsonItems.length); i++) {
      if (liveCards[i].title !== jsonItems[i].title) {
        issues.push({ cat: "content", msg: `${label} card ${i + 1} title: JSON="${jsonItems[i].title}" live="${liveCards[i].title}"` });
      }
      if (liveCards[i].body && jsonItems[i].body && liveCards[i].body.slice(0, 50) !== jsonItems[i].body.slice(0, 50)) {
        issues.push({ cat: "content", msg: `${label} "${liveCards[i].title}" body text differs` });
      }
    }
    const liveTitles = liveCards.map((c) => c.title);
    const jsonTitles = jsonItems.map((i) => i.title);
    const missing = liveTitles.filter((t) => !jsonTitles.includes(t));
    if (missing.length) issues.push({ cat: "content", msg: `${label} missing cards: ${missing.join(", ")}` });
  };

  if (isHub) {
    const servicesSec = cardSections.find((c) => c.id === "services");
    compareCards(live.services, servicesSec?.items, "Services");
    const whyElvSec = cardSections.find((c) => c.id === "why-elv");
    compareCards(live.whyElv, whyElvSec?.items, "Why ELV");
  } else {
    const featSec = cardSections.find((c) => c.id === "features");
    compareCards(live.features, featSec?.items, "Features");
  }

  const whySec = cardSections.find((c) => c.id === "why-aptus");
  compareCards(live.whyAptus, whySec?.items, "Why Aptus");

  // Missing sections
  if (live.hasTestimonials && !json.testimonials) {
    issues.push({ cat: "sections", msg: "Missing testimonials / Client Success Stories section" });
  }
  if (isHub && live.hasMidCta && !json.midCta) {
    issues.push({ cat: "sections", msg: `Missing mid-page CTA: "${live.midCtaHeading}"` });
  }
  if (!isHub && live.hasMidCta && !json.midCta) {
    issues.push({ cat: "sections", msg: `Missing mid-page CTA: "${live.midCtaHeading}"` });
  }

  // Generic icons
  const allIcons = cardSections.flatMap((c) => (c.items ?? []).map((i) => i.icon)).filter(Boolean);
  if (allIcons.length && allIcons.every((ic) => ic === "cube" || ic === "medal" || ic === "check-circle")) {
    issues.push({ cat: "assets", msg: "All card icons are generic placeholders (cube/medal) — live uses unique icons per card" });
  }

  // Wrong copy from other pages
  const jsonStr = JSON.stringify(json);
  if (/AutoCAD|Revit|BIM/i.test(jsonStr) && !/autocad/i.test(route)) {
    issues.push({ cat: "content", msg: "JSON contains AutoCAD/Revit copy on non-AutoCAD page" });
  }

  results.push({
    slug,
    route,
    isHub,
    issueCount: issues.length,
    issues,
    liveStructure: {
      sections: [
        "banner",
        "hero+nav",
        isHub ? `services(${live.services.length})` : `features(${live.features.length})`,
        isHub ? `why-elv(${live.whyElv.length})` : null,
        `why-aptus(${live.whyAptus.length})`,
        live.hasMidCta ? "mid-cta" : null,
        live.hasTestimonials ? "testimonials" : null,
        live.hasPartnerships ? "partnerships" : null,
        "contact-form",
      ].filter(Boolean),
    },
    jsonStructure: {
      sections: [
        "softwareInnerHero",
        ...cardSections.map((c) => `${c.id}(${(c.items ?? []).length})`),
        json.midCta ? "midCta" : null,
        json.testimonials ? `testimonials(${json.testimonials.items?.length ?? 0})` : null,
        json.showPartnerships ? "partnerships" : null,
        json.contactCta ? "contactCta" : null,
      ].filter(Boolean),
    },
  });
}

results.sort((a, b) => b.issueCount - a.issueCount || a.route.localeCompare(b.route));

console.log("\n=== DEEP ELV AUDIT ===\n");
let total = 0;
for (const r of results) {
  total += r.issueCount;
  const pct = r.issueCount === 0 ? "~95%+" : r.issueCount <= 2 ? "~85-90%" : r.issueCount <= 5 ? "~70-80%" : "<70%";
  console.log(`\n## ${r.route}`);
  console.log(`Estimated accuracy: ${pct} | Issues: ${r.issueCount}`);
  console.log(`Live:  ${r.liveStructure.sections.join(" → ")}`);
  console.log(`JSON:  ${r.jsonStructure.sections.join(" → ")}`);
  for (const i of r.issues) console.log(`  [${i.cat}] ${i.msg}`);
}

console.log(`\n=== TOTAL: ${total} issues across ${results.length} pages ===\n`);

fs.writeFileSync(path.join(ROOT, "scripts", "elv-deep-audit.json"), JSON.stringify(results, null, 2));
