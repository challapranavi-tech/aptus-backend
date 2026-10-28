#!/usr/bin/env node
/**
 * Compare LIVE WEBSITE/software HTML vs content/odoo-json vs mapPageJson output.
 * Usage: node scripts/audit-software-pages.mjs
 *        node scripts/audit-software-pages.mjs --json  (machine-readable)
 */

import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const LIVE = path.join(ROOT, "LIVE WEBSITE", "software");
const JSON_ROOT = path.join(ROOT, "content", "odoo-json");
const MANIFEST = path.join(ROOT, "data", "software-live-manifest.json");

function stripHtml(s) {
  return (s ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
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

function routeFromHtml(html) {
  for (const re of [/saved from url=\(([^)]+)\)/i, /rel="canonical"\s+href="([^"]+)"/i]) {
    const m = html.match(re);
    if (!m) continue;
    try {
      const u = new URL(m[1].replace(/&amp;/g, "&"));
      return u.pathname.replace(/\/$/, "") || "/";
    } catch {
      /* skip */
    }
  }
  return null;
}

function mainContent(html) {
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if (main) return main;
  const el = html.match(/elementor-location-single[\s\S]*/i)?.[0];
  return el ?? html;
}

function sectionH2s(main) {
  return [...main.matchAll(/<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map((m) => stripHtml(m[1]))
    .filter((t) => t.length > 2);
}

function cardTitlesInSection(chunk) {
  const inner =
    chunk.match(/elementor-inner-section[\s\S]*?<\/section>/i)?.[0] ?? chunk;
  const titles = [];
  for (const col of inner.split(/elementor-inner-column/gi).slice(1)) {
    const t = stripHtml(col.match(/<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "");
    if (t) titles.push(t);
  }
  return titles;
}

function liveBand(main, headingRe) {
  const m = main.match(headingRe);
  if (!m || m.index === undefined) return null;
  const start = m.index;
  const tail = main.slice(start + 40);
  const stops = [
    /Key Benefits|Benefits of/i,
    /Why Choose Aptus/i,
    /What Our Clients/i,
    /Winning together/i,
    /Have questions/i,
    /Ready to (Get Started|Transform)/i,
  ];
  let end = main.length;
  for (const stop of stops) {
    const rel = tail.search(stop);
    if (rel > 80) end = Math.min(end, start + 40 + rel);
  }
  const chunk = main.slice(start, end);
  const title = stripHtml(chunk.match(/<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "");
  return { title, cards: cardTitlesInSection(chunk) };
}

function extractLive(html, type) {
  const main = mainContent(html);
  const h1 = stripHtml(main.match(/<h1[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  const h2s = sectionH2s(main);

  const features = liveBand(
    main,
    /<h2[^>]*elementor-heading-title[^>]*>\s*(Powerful Features|Key Features[^<]*|Software Included in[^<]*)<\/h2>/i,
  );
  const benefits = liveBand(
    main,
    /<h2[^>]*elementor-heading-title[^>]*>\s*(Key Benefits|Benefits of the[^<]*|Benefits of Using[^<]*)<\/h2>/i,
  );
  const whyAptus = liveBand(main, /<h2[^>]*elementor-heading-title[^>]*>\s*Why Choose Aptus Infotech for[^<]*<\/h2>/i);

  const heroImg =
    main.match(/wp-content\/uploads\/[^"'\s]+/i)?.[0] ??
    main.match(/src="([^"]+\.(?:png|jpe?g|webp))"/i)?.[1];

  return {
    type,
    bannerH1: h1 || undefined,
    sectionH2s: h2s,
    features,
    benefits,
    whyAptus,
    hasTestimonials: /What Our Clients Say/i.test(main),
    hasPartnerships: /Winning together with/i.test(main),
    hasContactForm: /Have questions\? We can help/i.test(main),
    hasMidCta: /Ready to (Get Started|Transform)|Get Your Quote Now/i.test(main),
    hasFaq: /\bFAQ\b/i.test(main) || /<h2[^>]*>[\s\S]{0,40}Frequently Asked/i.test(main),
    hasDownloads: /\.pdf|download|brochure/i.test(main),
    heroImageRef: heroImg,
  };
}

function jsonPath(slug, family, type) {
  const candidates = [
    path.join(JSON_ROOT, "overrides", family, `${slug}.json`),
    path.join(JSON_ROOT, family, `${slug}.json`),
    path.join(JSON_ROOT, "overrides", `${slug}.json`),
    path.join(JSON_ROOT, `${slug}.json`),
  ];
  return candidates.find((p) => fs.existsSync(p));
}

function jsonStructure(data) {
  const order = [];
  if (data.softwareInnerHero?.visible !== false && data.softwareInnerHero) order.push("software-inner-hero");
  else if (data.hero?.visible !== false && data.hero) order.push(`hero:${data.hero.variant ?? "default"}`);

  for (const cs of data.cardSections ?? []) {
    if (cs?.visible === false) continue;
    order.push(`features:${cs.id}:${cs.variant ?? "default"}:${cs.items?.length ?? 0}`);
  }
  if (data.cards?.visible !== false && data.cards) {
    order.push(`cards:${data.cards.id ?? "cards"}:${data.cards.items?.length ?? 0}`);
  }
  if (data.midCta?.heading) order.push("midCta");
  if (data.testimonials?.visible !== false && data.testimonials?.items?.length) order.push(`testimonials:${data.testimonials.items.length}`);
  if (data.partnerships?.logos?.length) order.push(`partnerships:${data.partnerships.logos.length}`);
  if (data.faq?.items?.length) order.push(`faq:${data.faq.items.length}`);
  if (data.contactCta || data.showContactCta) order.push("contactCta");
  return order;
}

function jsonCardSections(data) {
  const out = {};
  for (const cs of data.cardSections ?? []) {
    if (cs?.visible === false) continue;
    const title = [cs.title?.before, cs.title?.accent, cs.title?.after].filter(Boolean).join(" ");
    out[cs.id ?? "unknown"] = {
      title,
      count: cs.items?.length ?? 0,
      titles: (cs.items ?? []).map((i) => i.title).filter(Boolean),
      missingImages: (cs.items ?? []).filter((i) => !i.imageSrc && !i.icon).length,
    };
  }
  return out;
}

function mapJson(slug, raw) {
  const script = `
    import { mapPageJson } from ${JSON.stringify(path.join(ROOT, "lib", "odoo", "page-json-mapper.ts"))};
    const raw = process.argv[1];
    const slug = process.argv[2];
    const sections = mapPageJson(raw, { slug });
    if (!sections) { console.log("[]"); process.exit(0); }
    console.log(JSON.stringify(sections.map(s => ({
      type: s.type,
      id: s.id,
      variant: s.data?.variant,
      heading: s.data?.heading ?? s.data?.bannerTitle ?? s.data?.title,
      headingAccent: s.data?.headingAccent,
      itemCount: s.data?.items?.length,
    }))));
  `;
  const r = spawnSync("npx", ["tsx", "-e", script, raw, slug], {
    cwd: ROOT,
    encoding: "utf8",
    shell: true,
    maxBuffer: 10 * 1024 * 1024,
  });
  if (r.status !== 0) return { error: r.stderr?.slice(0, 200) };
  try {
    return JSON.parse(r.stdout.trim() || "[]");
  } catch {
    return { error: "parse failed" };
  }
}

function compareTitles(liveTitles, jsonTitles) {
  const missing = liveTitles.filter((t) => !jsonTitles.some((j) => j.toLowerCase() === t.toLowerCase()));
  const extra = jsonTitles.filter((j) => !liveTitles.some((t) => t.toLowerCase() === j.toLowerCase()));
  return { missing, extra };
}

// ── build HTML index (route+family → file) ──
const htmlByKey = new Map();
for (const file of walkHtml(LIVE)) {
  const html = fs.readFileSync(file, "utf8");
  const route = routeFromHtml(html);
  if (!route) continue;
  const folder = path.basename(path.dirname(file)).toLowerCase();
  const family = {
    adobe: "adobe",
    autodesk: "autodesk",
    microsoft: "microsoft",
    multimedia: "multimedia",
    oracle: "oracle",
    edms: "edms",
    "educational software": "educational",
  }[folder] ?? folder.replace(/\s+/g, "-");
  const slug = route.replace(/^\//, "");
  const isHub = ["/software", "/autodesk", "/adobe", "/microsoft", "/multimedia-software-solutions", "/sketchup"].includes(route);
  const key = `${slug}::${family}`;
  if (!htmlByKey.has(key)) {
    htmlByKey.set(key, { file, html, route, slug, family, type: isHub ? "hub" : "inner" });
  }
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const reports = [];
const seenSlugFamily = new Set();

for (const entry of manifest.pages) {
  const key = `${entry.slug}::${entry.family}`;
  if (seenSlugFamily.has(key)) continue;
  seenSlugFamily.add(key);

  const htmlEntry = htmlByKey.get(key);
  const jp = jsonPath(entry.slug, entry.family, entry.type);
  const issues = [];

  if (!htmlEntry) {
    reports.push({ slug: entry.slug, family: entry.family, type: entry.type, issues: ["NO_LIVE_HTML"] });
    continue;
  }
  if (!jp) {
    reports.push({ slug: entry.slug, family: entry.family, type: entry.type, issues: ["NO_JSON_FILE"] });
    continue;
  }

  const live = extractLive(htmlEntry.html, entry.type);
  const data = JSON.parse(fs.readFileSync(jp, "utf8"));
  const jsonOrder = jsonStructure(data);
  const jsonCards = jsonCardSections(data);
  const mapped = mapJson(entry.slug, fs.readFileSync(jp, "utf8"));
  const mappedOrder = Array.isArray(mapped)
    ? mapped.map((s) => `${s.type}${s.variant ? `:${s.variant}` : ""}${s.itemCount != null ? `(${s.itemCount})` : ""}`)
    : [];

  // Content presence flags
  if (live.hasTestimonials && !data.testimonials?.items?.length) issues.push("MISSING_TESTIMONIALS");
  if (live.hasPartnerships && !data.partnerships?.logos?.length) issues.push("MISSING_PARTNERSHIPS");
  if (live.hasContactForm && !data.contactCta && !data.showContactCta) issues.push("MISSING_CONTACT_FORM");
  if (live.hasMidCta && !data.midCta?.heading) issues.push("MISSING_MID_CTA");
  if (live.hasFaq && !data.faq?.items?.length) issues.push("MISSING_FAQ");
  if (live.hasDownloads && !/download|brochure|pdf/i.test(JSON.stringify(data))) issues.push("MISSING_DOWNLOADS");

  // Card section compare (inner pages)
  if (entry.type === "inner") {
    if (live.features && !jsonCards.features) {
      issues.push(`MISSING_FEATURES_SECTION (live: "${live.features.title}" ${live.features.cards.length} cards)`);
    } else if (live.features && jsonCards.features) {
      if (live.features.title && jsonCards.features.title && live.features.title !== jsonCards.features.title) {
        issues.push(`FEATURES_TITLE_MISMATCH live="${live.features.title}" json="${jsonCards.features.title}"`);
      }
      const { missing, extra } = compareTitles(live.features.cards, jsonCards.features.titles);
      if (missing.length) issues.push(`FEATURES_MISSING_CARDS: ${missing.join(", ")}`);
      if (extra.length) issues.push(`FEATURES_EXTRA_CARDS: ${extra.join(", ")}`);
      if (live.features.cards.length !== jsonCards.features.count) {
        issues.push(`FEATURES_COUNT live=${live.features.cards.length} json=${jsonCards.features.count}`);
      }
    }

    if (live.benefits && !jsonCards.benefits) {
      issues.push(`MISSING_BENEFITS_SECTION (live: "${live.benefits.title}" ${live.benefits.cards.length} cards)`);
    } else if (live.benefits && jsonCards.benefits) {
      if (live.benefits.title !== jsonCards.benefits.title) {
        issues.push(`BENEFITS_TITLE_MISMATCH live="${live.benefits.title}" json="${jsonCards.benefits.title}"`);
      }
      const { missing } = compareTitles(live.benefits.cards, jsonCards.benefits.titles);
      if (missing.length) issues.push(`BENEFITS_MISSING_CARDS: ${missing.join(", ")}`);
      if (live.benefits.cards.length !== jsonCards.benefits.count) {
        issues.push(`BENEFITS_COUNT live=${live.benefits.cards.length} json=${jsonCards.benefits.count}`);
      }
    }

    if (live.whyAptus && !jsonCards["why-aptus"]) {
      issues.push(`MISSING_WHY_APTUS (live: "${live.whyAptus.title}" ${live.whyAptus.cards.length} cards)`);
    } else if (live.whyAptus && jsonCards["why-aptus"]) {
      const { missing } = compareTitles(live.whyAptus.cards, jsonCards["why-aptus"].titles);
      if (missing.length) issues.push(`WHY_APTUS_MISSING_CARDS: ${missing.join(", ")}`);
    }
  }

  // Section order: partnerships before contact
  if (Array.isArray(mapped)) {
    const pi = mapped.findIndex((s) => s.type === "logo-grid");
    const ti = mapped.findIndex((s) => s.type === "testimonials");
    const ci = mapped.findIndex((s) => s.type === "cta");
    if (pi >= 0 && ci >= 0 && pi > ci) issues.push("WRONG_ORDER: partnerships after contact");
    if (ti >= 0 && pi >= 0 && ti > pi) issues.push("WRONG_ORDER: testimonials after partnerships");
    if (live.hasMidCta && !mapped.some((s) => s.id === "page-mid-cta")) issues.push("MAPPER_MISSING_MID_CTA");
  }

  // Hero image
  const jsonHero = data.softwareInnerHero?.imageSrc ?? data.hero?.imageSrc;
  if (entry.heroImage && jsonHero && entry.heroImage !== jsonHero && !jsonHero.includes(path.basename(entry.heroImage))) {
    issues.push(`HERO_IMAGE_MISMATCH manifest≠json`);
  }

  reports.push({
    slug: entry.slug,
    family: entry.family,
    type: entry.type,
    route: entry.route,
    jsonFile: path.relative(ROOT, jp),
    issueCount: issues.length,
    issues,
    live: {
      structure: [
        live.bannerH1 && `banner:${live.bannerH1.slice(0, 40)}`,
        live.features && `features:"${live.features.title}"(${live.features.cards.length})`,
        live.benefits && `benefits:"${live.benefits.title}"(${live.benefits.cards.length})`,
        live.whyAptus && `why-aptus:"${live.whyAptus.title}"(${live.whyAptus.cards.length})`,
        live.hasMidCta && "midCta",
        live.hasTestimonials && "testimonials",
        live.hasPartnerships && "partnerships",
        live.hasContactForm && "contactForm",
        live.hasFaq && "faq",
        live.hasDownloads && "downloads",
      ].filter(Boolean),
      sectionH2s: live.sectionH2s,
    },
    json: { structure: jsonOrder, cards: jsonCards },
    mapped: { structure: mappedOrder },
  });
}

const withIssues = reports.filter((r) => r.issueCount > 0);
const summary = {
  auditedAt: new Date().toISOString(),
  totalPages: reports.length,
  pagesWithIssues: withIssues.length,
  pagesClean: reports.length - withIssues.length,
  issueFrequency: {},
};

for (const r of withIssues) {
  for (const i of r.issues) {
    const key = i.split(":")[0].split(" ")[0];
    summary.issueFrequency[key] = (summary.issueFrequency[key] ?? 0) + 1;
  }
}

const outPath = path.join(ROOT, "data", "software-pages-audit.json");
fs.writeFileSync(outPath, `${JSON.stringify({ summary, reports }, null, 2)}\n`, "utf8");

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ summary, reports: withIssues }, null, 2));
  process.exit(0);
}

console.log(`Software pages audit — ${summary.totalPages} pages, ${summary.pagesWithIssues} with issues\n`);
console.log("Issue frequency:");
for (const [k, v] of Object.entries(summary.issueFrequency).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`);
}
console.log(`\nFull report: ${path.relative(ROOT, outPath)}\n`);

for (const r of withIssues.sort((a, b) => b.issueCount - a.issueCount)) {
  console.log(`── /${r.slug} (${r.family}, ${r.type}) — ${r.issueCount} issues`);
  console.log(`   LIVE:  ${r.live.structure.join(" → ")}`);
  console.log(`   JSON:  ${r.json.structure.join(" → ")}`);
  console.log(`   RENDER:${r.mapped.structure.join(" → ")}`);
  for (const i of r.issues) console.log(`   • ${i}`);
  console.log();
}
