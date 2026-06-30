#!/usr/bin/env node
/**
 * Audit ELV pages: compare LIVE WEBSITE/ELV HTML vs content/odoo-json/elv/*.json
 */
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

function splitSections(main) {
  const parts = main.split(/<section class="elementor-section elementor-top-section/gi);
  return parts.slice(1).map((p) => `<section class="elementor-section elementor-top-section${p}`);
}

function extractHeadings(main) {
  const headings = [];
  const re = /<h([123])[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(main))) {
    const text = stripHtml(m[2]);
    if (text && !/^(Company|Reach Us)$/i.test(text)) headings.push({ level: Number(m[1]), text });
  }
  return headings;
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

function extractLiveStructure(html, isHub) {
  const main = mainContent(html);
  const headings = extractHeadings(main);
  const sections = [];

  // Top-level section detection by major H2 headings
  const h2s = headings.filter((h) => h.level === 2).map((h) => h.text);

  if (isHub) {
    const services = extractColumnCards(sliceBetween(main, /Our\s+Services/i, /Why\s+Choose\s+ELV/i), {
      requireButton: true,
    });
    const whyElv = extractColumnCards(sliceBetween(main, /Why\s+Choose\s+ELV\s+Solutions/i, /Why\s+Choose\s+Aptus/i));
    const whyAptus = extractColumnCards(
      sliceBetween(main, /Why\s+Choose\s+Aptus\s+Infotech\s+for\s+ELV/i, /Ready\s+to|What\s+Our|Have\s+questions/i),
    );
    const hasMidCta = /Ready\s+to/i.test(main);
    const hasTestimonials = /What\s+Our\s+Clients\s+Say/i.test(main);
    const hasPartnerships = /Winning\s+together/i.test(main);
    const hasForm = /Have\s+questions/i.test(main);

    sections.push({ id: "banner+hero", type: "hero" });
    if (services.length) sections.push({ id: "services", count: services.length, titles: services.map((c) => c.title) });
    if (whyElv.length) sections.push({ id: "why-elv", count: whyElv.length, titles: whyElv.map((c) => c.title) });
    if (whyAptus.length) sections.push({ id: "why-aptus", count: whyAptus.length, titles: whyAptus.map((c) => c.title) });
    if (hasMidCta) sections.push({ id: "mid-cta", type: "cta" });
    if (hasTestimonials) sections.push({ id: "testimonials", type: "quotes" });
    if (hasPartnerships) sections.push({ id: "partnerships", type: "logo-grid" });
    if (hasForm) sections.push({ id: "contact-cta", type: "form" });

    return { h2s, sections, services, whyElv, whyAptus };
  }

  const features = extractColumnCards(
    sliceBetween(main, /Key\s+Features|Key\s+Networking|capabilities|technologies/i, /Why\s+Choose\s+Aptus/i),
  );
  const whyAptus = extractColumnCards(
    sliceBetween(main, /Why\s+Choose\s+Aptus/i, /What\s+Our|Ready\s+to|Winning|Have\s+questions/i),
  );
  const hasTestimonials = /What\s+Our\s+Clients\s+Say/i.test(main);
  const hasPartnerships = /Winning\s+together/i.test(main);
  const hasForm = /Have\s+questions/i.test(main);
  const hasFaq = /FAQ|Frequently\s+Asked/i.test(main);
  const hasDownloads = /\.pdf|download/i.test(main);
  const imgCount = (main.match(/wp-content\/uploads/gi) ?? []).length;

  sections.push({ id: "banner+hero", type: "hero" });
  if (features.length) sections.push({ id: "features", count: features.length, titles: features.map((c) => c.title) });
  if (whyAptus.length) sections.push({ id: "why-aptus", count: whyAptus.length, titles: whyAptus.map((c) => c.title) });
  if (hasTestimonials) sections.push({ id: "testimonials", type: "quotes" });
  if (hasPartnerships) sections.push({ id: "partnerships", type: "logo-grid" });
  if (hasFaq) sections.push({ id: "faq", type: "faq" });
  if (hasDownloads) sections.push({ id: "downloads", type: "downloads" });
  if (hasForm) sections.push({ id: "contact-cta", type: "form" });

  return { h2s, sections, features, whyAptus, imgCount, hasFaq, hasDownloads };
}

function jsonStructure(json, isHub) {
  const sections = [{ id: "softwareInnerHero", type: "hero" }];
  const cards = json.cardSections ?? [];
  for (const c of cards) {
    sections.push({
      id: c.id,
      variant: c.variant,
      count: c.items?.length ?? 0,
      titles: (c.items ?? []).map((i) => i.title),
      title: c.title,
    });
  }
  if (json.midCta) sections.push({ id: "mid-cta", type: "cta" });
  if (json.testimonials) sections.push({ id: "testimonials", type: "quotes", count: json.testimonials.items?.length });
  if (json.showPartnerships) sections.push({ id: "partnerships", type: "logo-grid" });
  if (json.contactCta) sections.push({ id: "contact-cta", type: "form" });
  return sections;
}

function compareTitles(liveTitles, jsonTitles) {
  const missing = liveTitles.filter((t) => !jsonTitles.some((j) => j.toLowerCase() === t.toLowerCase()));
  const extra = jsonTitles.filter((t) => !liveTitles.some((l) => l.toLowerCase() === t.toLowerCase()));
  return { missing, extra };
}

const results = [];

for (const file of walkHtml(LIVE)) {
  const html = fs.readFileSync(file, "utf8");
  const route = routeFromHtml(html);
  if (!route) continue;

  const slug = slugFromRoute(route);
  const isHub = route === "/elv-solutions";
  const jsonPath = isHub ? HUB_JSON : path.join(JSON_ROOT, `${slug}.json`);

  const live = extractLiveStructure(html, isHub);
  let json = null;
  let jsonMissing = false;
  if (fs.existsSync(jsonPath)) {
    json = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  } else {
    jsonMissing = true;
  }

  const issues = [];
  if (jsonMissing) {
    issues.push({ severity: "critical", msg: `Missing JSON: ${jsonPath}` });
  } else {
    const jsonSecs = jsonStructure(json, isHub);

    // Section presence
    const liveIds = live.sections.map((s) => s.id);
    const jsonIds = jsonSecs.map((s) => s.id);
    for (const id of liveIds) {
      if (!jsonIds.includes(id)) issues.push({ severity: "high", msg: `Missing section in JSON: ${id}` });
    }
    for (const id of jsonIds) {
      if (!liveIds.includes(id) && id !== "partnerships") {
        // partnerships may be global component
      }
    }

    // Card title comparison
    if (isHub) {
      for (const [key, liveCards] of [
        ["services", live.services],
        ["why-elv", live.whyElv],
        ["why-aptus", live.whyAptus],
      ]) {
        const sec = json.cardSections?.find((c) => c.id === key);
        if (!sec && liveCards?.length) {
          issues.push({ severity: "high", msg: `Missing card section: ${key} (${liveCards.length} cards on live)` });
        } else if (sec && liveCards?.length) {
          const { missing, extra } = compareTitles(
            liveCards.map((c) => c.title),
            sec.items.map((i) => i.title),
          );
          if (missing.length) issues.push({ severity: "medium", msg: `${key} missing cards: ${missing.join(", ")}` });
          if (extra.length) issues.push({ severity: "low", msg: `${key} extra cards in JSON: ${extra.join(", ")}` });
        }
      }
    } else {
      for (const [key, liveCards] of [
        ["features", live.features],
        ["why-aptus", live.whyAptus],
      ]) {
        const sec = json.cardSections?.find((c) => c.id === key);
        if (!sec && liveCards?.length) {
          issues.push({ severity: "high", msg: `Missing card section: ${key} (${liveCards.length} cards on live)` });
        } else if (sec && liveCards?.length) {
          const { missing, extra } = compareTitles(
            liveCards.map((c) => c.title),
            sec.items.map((i) => i.title),
          );
          if (missing.length) issues.push({ severity: "medium", msg: `${key} missing cards: ${missing.join(", ")}` });
          if (extra.length) issues.push({ severity: "low", msg: `${key} extra cards in JSON: ${extra.join(", ")}` });
        }
      }

      if (live.hasFaq) issues.push({ severity: "high", msg: "Live page has FAQ section — not in JSON schema" });
      if (live.hasDownloads) issues.push({ severity: "high", msg: "Live page has downloads — not in JSON schema" });

      // Hero paragraphs
      const heroParas = json.softwareInnerHero?.paragraphs ?? [];
      if (heroParas.length === 0 && live.h2s.length > 1) {
        issues.push({ severity: "medium", msg: "Hero intro paragraphs empty in JSON (live has body copy)" });
      }
    }

    if (live.sections.some((s) => s.id === "testimonials") && !json.testimonials) {
      issues.push({ severity: "high", msg: "Missing testimonials section" });
    }
    if (isHub && live.sections.some((s) => s.id === "mid-cta") && !json.midCta) {
      issues.push({ severity: "high", msg: "Missing mid-page CTA (Ready to...)" });
    }
  }

  results.push({
    slug,
    route,
    isHub,
    htmlFile: path.basename(file),
    liveSections: live.sections,
    liveH2s: live.h2s,
    jsonSections: json ? jsonStructure(json, isHub) : null,
    issues,
    issueCount: issues.length,
  });
}

results.sort((a, b) => a.route.localeCompare(b.route));

console.log("\n=== ELV PAGE AUDIT SUMMARY ===\n");
for (const r of results) {
  const status = r.issueCount === 0 ? "OK" : `${r.issueCount} issues`;
  console.log(`${r.route} (${r.slug}) — ${status}`);
  if (r.issues.length) {
    for (const i of r.issues) console.log(`  [${i.severity}] ${i.msg}`);
  }
}

const outPath = path.join(ROOT, "scripts", "elv-audit-report.json");
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`\nFull report: ${outPath}`);
