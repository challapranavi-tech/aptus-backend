import fs from "fs";
import path from "path";

const LIVE = "LIVE WEBSITE/ELV";
const JSON_DIR = "content/odoo-json/elv";

function stripHtml(s) {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;/g, "\u2019")
    .replace(/\s+/g, " ")
    .trim();
}

// keyword in live html filename -> json slug (resolved against real dir entries)
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

const FILE_TO_SLUG = {};
for (const f of fs.readdirSync(LIVE)) {
  if (!f.endsWith(".html")) continue;
  const hit = KEYWORD_TO_SLUG.find(([kw]) => f.includes(kw));
  if (hit) FILE_TO_SLUG[f] = hit[1];
}

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
    const fa = col.match(/e-fa[brs]-([a-z0-9-]+)/i)?.[1] ?? null;
    if (body && !title.includes("\u201c")) cards.push({ title, body, fa });
  }
  return cards;
}

function jsonCards(j) {
  const out = [];
  for (const cs of j.cardSections ?? []) {
    for (const it of cs.items ?? []) out.push({ title: it.title, body: it.body, icon: it.icon });
  }
  return out;
}

const allFa = new Set();
let report = [];

for (const [file, slug] of Object.entries(FILE_TO_SLUG)) {
  const html = fs.readFileSync(path.join(LIVE, file), "utf8");
  const jpath = path.join(JSON_DIR, slug + ".json");
  if (!fs.existsSync(jpath)) {
    report.push(`\n### ${slug}\n  MISSING JSON`);
    continue;
  }
  const j = JSON.parse(fs.readFileSync(jpath, "utf8"));
  const lc = liveCards(html);
  const jc = jsonCards(j);

  lc.forEach((c) => c.fa && allFa.add(c.fa));

  const lines = [`\n### ${slug}  (live cards: ${lc.length}, json cards: ${jc.length})`];
  let textMismatch = 0;
  let iconMismatch = 0;
  const n = Math.max(lc.length, jc.length);
  for (let i = 0; i < n; i++) {
    const L = lc[i];
    const J = jc[i];
    if (!L || !J) {
      lines.push(`  [${i}] COUNT MISMATCH live=${L?.title ?? "-"} json=${J?.title ?? "-"}`);
      textMismatch++;
      continue;
    }
    if (L.title !== J.title || L.body !== J.body) {
      textMismatch++;
      lines.push(`  [${i}] TEXT DIFF`);
      if (L.title !== J.title) lines.push(`        title live="${L.title}" json="${J.title}"`);
      if (L.body !== J.body)
        lines.push(`        body  live="${L.body.slice(0, 60)}" json="${(J.body ?? "").slice(0, 60)}"`);
    }
  }
  lines.push(`  textMismatch=${textMismatch}`);
  report.push(lines.join("\n"));
}

console.log("UNIQUE FA ICONS ACROSS ALL PAGES:");
console.log([...allFa].sort().join(", "));
console.log("\n=== PER-PAGE TEXT AUDIT ===");
console.log(report.join("\n"));
