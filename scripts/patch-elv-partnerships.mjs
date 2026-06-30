#!/usr/bin/env node
/**
 * Extract per-page Strategic Alliances carousel logos from live ELV HTML
 * and patch content/odoo-json/elv/*.json (remove showPartnerships, add partnerships).
 *
 * Usage: node scripts/patch-elv-partnerships.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LIVE = path.join(ROOT, "LIVE WEBSITE", "ELV");
const JSON_DIR = path.join(ROOT, "content", "odoo-json", "elv");

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

const UP = "https://aptusinfotech.com/wp-content/uploads/2025/05";
const THUMBS = "https://aptusinfotech.com/wp-content/uploads/elementor/thumbs";

/** Prefer canonical /2025/05/ when known; else elementor thumbs (matches live carousels). */
const CANONICAL = {
  ZKT: "ZKTeco",
  ZKTeco: "ZKTeco",
  suprema: "Suprema",
  Suprema: "Suprema",
  WatchNet: "WatchNet",
  Tyco: "Tyco",
  Hikvision: "Hikvision",
  Norden: "Norden-300x180",
  FERMAX: "FERMAX-1",
  Fermax: "FERMAX-1",
  Fanvil: "Fanvil",
  EATON: "EATON",
  Vertiv: "Vertiv",
  FAAC: "FAAC",
  BFT: "BFT",
  Nice: "Nice",
  URMET: "URMET",
  Extron: "Extron",
  PELCO: "PELCO",
  Panduit: "Panduit",
  Opterna: "Opterna",
  Avigilon: "Avigilon",
  APC: "APC",
  Honeywell: "Honeywell",
};

function hostedSrc(src) {
  if (/aptusinfotech\.com/i.test(src)) return src.split("?")[0];
  const base = path.basename(src);
  const stem = base.replace(/\.(png|webp|jpg|jpeg)$/i, "").replace(/-(r5nf|raje)[a-z0-9]+$/i, "");
  const canon = CANONICAL[stem];
  if (canon) return `${UP}/${canon}.png`;
  return `${THUMBS}/${base}`;
}

function extractAllianceLogos(html) {
  const i = html.indexOf("Strategic Alliances");
  if (i < 0) return null;
  const chunk = html.slice(i, i + 15000);
  const re =
    /data-swiper-slide-index="(\d+)"[\s\S]*?swiper-slide-image[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/gi;
  const byIdx = new Map();
  let m;
  while ((m = re.exec(chunk))) {
    const idx = +m[1];
    if (!byIdx.has(idx)) byIdx.set(idx, { src: m[2], alt: m[3] });
  }
  if (!byIdx.size) return [];
  return [...byIdx.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => ({ src: hostedSrc(v.src), alt: v.alt.trim() || "Partner" }));
}

const liveBySlug = {};
for (const f of fs.readdirSync(LIVE)) {
  if (!f.endsWith(".html") || f.includes("_files")) continue;
  const hit = KEYWORD_TO_SLUG.find(([kw]) => f.includes(kw));
  if (hit) liveBySlug[hit[1]] = path.join(LIVE, f);
}

const PARTNERSHIPS = {
  heading: "Winning together with",
  headingAccent: "Strategic Alliances",
  variant: "alliances",
};

let patched = 0;
for (const [slug, file] of Object.entries(liveBySlug)) {
  const jpath = path.join(JSON_DIR, `${slug}.json`);
  if (!fs.existsSync(jpath)) continue;
  const j = JSON.parse(fs.readFileSync(jpath, "utf8"));
  const html = fs.readFileSync(file, "utf8");
  const logos = extractAllianceLogos(html);

  delete j.showPartnerships;
  if (logos === null) {
    delete j.partnerships;
    console.log(`- ${slug}: no alliances section on live`);
  } else if (!logos.length) {
    delete j.partnerships;
    console.log(`- ${slug}: alliances empty (removed)`);
  } else {
    j.partnerships = { ...PARTNERSHIPS, logos };
    console.log(`✓ ${slug}: ${logos.length} logos (${logos.map((l) => l.alt).join(", ")})`);
  }
  fs.writeFileSync(jpath, JSON.stringify(j, null, 2) + "\n");
  patched++;
}

console.log(`\nPatched ${patched} ELV JSON files`);
