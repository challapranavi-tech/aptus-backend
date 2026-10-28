#!/usr/bin/env node
/**
 * Patch autodesk inner JSON card icons to match live Font Awesome names (document order).
 * Usage: node scripts/patch-autodesk-icons.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LIVE = path.join(ROOT, "LIVE WEBSITE", "software", "autodesk");
const JSON_DIR = path.join(ROOT, "content", "odoo-json", "autodesk");

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
  for (const name of fs.readdirSync(LIVE)) {
    if (!name.endsWith(".html")) continue;
    const file = path.join(LIVE, name);
    const html = fs.readFileSync(file, "utf8");
    if (routeFromHtml(html) === `/${slug}`) return html;
  }
  return null;
}

function liveCards(html) {
  const main = html.match(/<main[^>]*id="content"[\s\S]*?<\/main>/i)?.[0] ?? html;
  const cards = [];
  for (const col of main.split(/elementor-inner-column/gi).slice(1)) {
    const title = stripHtml(col.match(/<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "");
    if (!title) continue;
    const icon =
      col.match(/e-fa[brs]-([a-z0-9-]+)/i)?.[1] ??
      (col.match(/<img[^>]+>/i) ? "__image__" : undefined);
    const bodyMatch = col.match(
      /elementor-widget-text-editor[\s\S]*?<div class="elementor-widget-container">\s*(?:<p>)?([\s\S]*?)(?:<\/p>)?\s*<\/div>/i,
    );
    const body = bodyMatch ? stripHtml(bodyMatch[1]) : "";
    if (!icon && !body) continue;
    cards.push({ title, icon, body });
  }
  return cards;
}

let patched = 0;
for (const slug of INNER_SLUGS) {
  const html = findHtml(slug);
  const jsonPath = path.join(JSON_DIR, `${slug}.json`);
  if (!html || !fs.existsSync(jsonPath)) continue;

  const cards = liveCards(html);
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  let i = 0;
  for (const section of data.cardSections ?? []) {
    for (const item of section.items ?? []) {
      const live = cards[i++];
      if (!live) break;
      if (live.icon && live.icon !== "__image__") item.icon = live.icon;
      if (live.title) item.title = live.title;
      if (live.body) item.body = live.body;
    }
  }
  fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`);
  patched++;
  console.log(`✓ ${slug}.json (${cards.length} live cards)`);
}

console.log(`Patched ${patched} autodesk JSON files`);
