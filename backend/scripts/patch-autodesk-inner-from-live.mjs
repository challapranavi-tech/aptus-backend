#!/usr/bin/env node
/** Merge live HTML testimonials, subheadings, and alliances into autodesk inner JSON. */

import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LIVE = path.join(ROOT, "LIVE WEBSITE", "software", "autodesk");
const JSON_DIR = path.join(ROOT, "content", "odoo-json", "autodesk");
const OVERRIDE_DIR = path.join(ROOT, "content", "odoo-json", "overrides", "autodesk");

const INNER_SLUGS = [
  "autocad",
  "3ds-max",
  "revit",
  "civil-3d",
  "aec-collection",
  "autocad-lt",
  "bim-collaborate-pro",
  "autodesk-docs",
  "autodesk-build",
  "autodesk-takeoff",
  "navisworks",
];

function stripHtml(s) {
  return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
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

function findHtml(slug) {
  if (!fs.existsSync(LIVE)) return null;
  for (const name of fs.readdirSync(LIVE)) {
    if (!name.endsWith(".html")) continue;
    const file = path.join(LIVE, name);
    const html = fs.readFileSync(file, "utf8");
    const route = routeFromHtml(html);
    if (route === `/${slug}`) return html;
  }
  return null;
}

function extractTestimonials(main) {
  const idx = main.search(/What Our Clients Say/i);
  if (idx < 0) return null;
  const chunk = main.slice(idx, idx + 12000);
  const sub = stripHtml(chunk.match(/What Our Clients Say[\s\S]*?<\/h2>[\s\S]*?<p>([\s\S]*?)<\/p>/i)?.[1] ?? "");
  const cols = chunk.split(/elementor-inner-column/gi).slice(1);
  const items = [];
  for (const col of cols) {
    if (!/elementor-widget-text-editor/i.test(col)) continue;
    const editors = [
      ...col.matchAll(
        /elementor-widget-text-editor[\s\S]*?<div class="elementor-widget-container">([\s\S]*?)<\/div>\s*<\/div>/gi,
      ),
    ];
    const quote = stripHtml(editors[0]?.[1]?.match(/<p>([\s\S]*?)<\/p>/i)?.[1] ?? "");
    if (!quote.startsWith("\u201c") && !quote.startsWith('"')) continue;
    const author = stripHtml(col.match(/<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "");
    const roleBlock = editors[editors.length - 1]?.[1] ?? "";
    const roleParts = [...roleBlock.matchAll(/<p>([\s\S]*?)<\/p>/gi)]
      .map((m) => stripHtml(m[1]))
      .filter((p) => p && p !== quote);
    if (!author) continue;
    const role =
      roleParts.length >= 2
        ? `${roleParts[0].replace(/,\s*$/, "")}, ${roleParts.slice(1).join(", ")}`
        : roleParts.join(", ");
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

function extractBenefitsSubheading(main) {
  const m = main.match(/Benefits of Using[\s\S]{0,2000}?<p>([\s\S]*?)<\/p>/i);
  return m ? stripHtml(m[1]) : undefined;
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

function patchJson(json, html) {
  const main = html.match(/<main[^>]*id="content"[\s\S]*?<\/main>/i)?.[0] ?? html;
  const testimonials = extractTestimonials(main);
  const benefitsSub = extractBenefitsSubheading(main);

  if (testimonials) {
    json.testimonials = {
      visible: true,
      variant: "software-quotes",
      title: { before: "What Our Clients Say" },
      subheading: testimonials.subheading,
      items: testimonials.items,
    };
  }

  if (benefitsSub && Array.isArray(json.cardSections)) {
    const benefits = json.cardSections.find((s) => s.id === "benefits" || s.anchorId === "benefits");
    if (benefits) benefits.subheading = benefitsSub;
  }

  json.partnerships = partnershipsBlock();

  if (json.softwareInnerHero?.ctaHref) {
    json.softwareInnerHero.ctaHref = "#Form";
  }

  return json;
}

function writeJson(slug, json) {
  const payload = `${JSON.stringify(json, null, 2)}\n`;
  fs.writeFileSync(path.join(JSON_DIR, `${slug}.json`), payload, "utf8");
  const ovr = path.join(OVERRIDE_DIR, `${slug}.json`);
  if (fs.existsSync(ovr)) fs.writeFileSync(ovr, payload, "utf8");
}

let ok = 0;
for (const slug of INNER_SLUGS) {
  const html = findHtml(slug);
  const jsonPath = path.join(JSON_DIR, `${slug}.json`);
  if (!html || !fs.existsSync(jsonPath)) {
    console.warn(`skip ${slug}: ${!html ? "no live html" : "no json"}`);
    continue;
  }
  const json = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  patchJson(json, html);
  writeJson(slug, json);
  ok++;
  console.log(`patched ${slug}`);
}
console.log(`done: ${ok}/${INNER_SLUGS.length}`);
