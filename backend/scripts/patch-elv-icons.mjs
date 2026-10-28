#!/usr/bin/env node
/**
 * Patch ELV product-page JSON so each feature/benefit/why card uses the exact Font
 * Awesome icon name from the live page (and aligns title/body to live, fixing drift).
 * Cards are matched by document order: the first N inner-column cards on the live page
 * are features + benefits + why-aptus (testimonials & mid-CTA come after).
 *
 * Usage: node scripts/patch-elv-icons.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LIVE = path.join(ROOT, "LIVE WEBSITE", "ELV");
const JSON_DIR = path.join(ROOT, "content", "odoo-json", "elv");

function stripHtml(s) {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&#8211;/g, "\u2013")
    .replace(/\s+/g, " ")
    .trim();
}

const KEYWORD_TO_SLUG = [
  ["Access Control", "access-control-system"],
  ["CCTV", "cctv-camera"],
  ["Nurse Calling", "nurse-calling-system"],
  ["Switching and Routing", "switching-and-routing"],
  ["Conference room", "conference-room-solution"],
  ["Data Center", "data-center-solutions"],
  ["Network &", "network-and-structured-cabling-solutions"],
  ["Audio Video", "audio-video-solutions"],
  ["RSI Queue", "rsi-queue-management"],
  ["Gate Automation", "gate-automation"],
  ["Guest Room", "guest-room-management"],
  ["Home Automation", "home-automation"],
  ["SMATV", "smatv-iptv"],
  ["Telephone", "telephone-systems"],
  ["Thermal Scanners", "thermal-scanners"],
  ["UPS Systems", "ups"],
];

function liveCards(html) {
  const main = html.match(/<main[^>]*id="content"[\s\S]*?<\/main>/i)?.[0] ?? html;
  const cols = main.split(/elementor-inner-column/gi).slice(1);
  const cards = [];
  for (const col of cols) {
    const title = stripHtml(
      col.match(/<h2[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "",
    );
    if (!title) continue;
    const bodyP = col.match(/<p>([\s\S]*?)<\/p>/i);
    const bodyEd = col.match(
      /elementor-widget-text-editor[\s\S]*?<div class="elementor-widget-container">([\s\S]*?)<\/div>\s*<\/div>/i,
    );
    const body = stripHtml(bodyP?.[1] ?? bodyEd?.[1] ?? "");
    if (!body || title.includes("\u201c")) continue; // skip testimonial columns
    const fa = col.match(/e-fa[brs]-([a-z0-9-]+)/i)?.[1] ?? null;
    cards.push({ title, body, fa });
  }
  return cards;
}

const fileBySlug = {};
for (const f of fs.readdirSync(LIVE)) {
  if (!f.endsWith(".html")) continue;
  const hit = KEYWORD_TO_SLUG.find(([kw]) => f.includes(kw));
  if (hit) fileBySlug[hit[1]] = f;
}

let totalIcon = 0;
let totalText = 0;
for (const [slug, file] of Object.entries(fileBySlug)) {
  const jpath = path.join(JSON_DIR, slug + ".json");
  if (!fs.existsSync(jpath)) {
    console.log(`! ${slug}: no JSON`);
    continue;
  }
  const j = JSON.parse(fs.readFileSync(jpath, "utf8"));
  const items = (j.cardSections ?? []).flatMap((cs) => cs.items ?? []);
  const live = liveCards(html(file)).slice(0, items.length);

  if (live.length !== items.length) {
    console.log(`! ${slug}: live ${live.length} vs json ${items.length} — SKIP`);
    continue;
  }

  let iconChanged = 0;
  let textChanged = 0;
  items.forEach((it, i) => {
    const L = live[i];
    if (L.fa && it.icon !== L.fa) {
      it.icon = L.fa;
      iconChanged++;
    }
    if (L.title && it.title !== L.title) {
      it.title = L.title;
      textChanged++;
    }
    if (L.body && it.body !== L.body) {
      it.body = L.body;
      textChanged++;
    }
  });

  fs.writeFileSync(jpath, JSON.stringify(j, null, 2) + "\n");
  totalIcon += iconChanged;
  totalText += textChanged;
  console.log(`✓ ${slug}: icons ${iconChanged}, text ${textChanged}`);
}

function html(file) {
  return fs.readFileSync(path.join(LIVE, file), "utf8");
}

console.log(`\nTotal icon fields updated: ${totalIcon}, text fields updated: ${totalText}`);
