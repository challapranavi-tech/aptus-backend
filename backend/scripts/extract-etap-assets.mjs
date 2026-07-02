#!/usr/bin/env node
/** Copy ETAP page images from LIVE WEBSITE save → public/images/software/educational/etap */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LIVE_HTML = path.join(
  ROOT,
  "LIVE WEBSITE",
  "software",
  "educational software",
  "ETAP Software for Electrical Systems in Oman _ Aptus Infotech.html",
);
const FILES_DIR = `${LIVE_HTML.replace(/\.html$/i, "")}_files`;
const OUT_DIR = path.join(ROOT, "public", "images", "software", "educational", "etap");
const JSON_PATH = path.join(ROOT, "content", "odoo-json", "educational", "etap.json");
const MEDIA_TS = path.join(ROOT, "data", "software-product-media.ts");

const SKIP = /Aptus-infotech-orignal-clrs-logo/i;

const ALLIANCE_BY_ID = {
  planswift: "planswift-rarquilozhjdi3ujvpnqm82lsamv4rdq5i6zz36sfi.png",
  prokon: "Prokon-rarqukhdd5ly5brtkqgzr7liz2dlk5l6trhyxn4032.png",
  sketchup: "Sketchup-rarqumd1qtoisjp39ra8w74g5u4bzjsni0sxw717qm.png",
  sophos: "sophos-rarqunavxnpt45nq49ovgovwr7zp78wdu5gfdgztke.png",
  spectronova: "spectronova-rarquo8q4hr3frmcys3i16ndclv2ey046a3wuqyfe6.png",
  aconex: "aconex-rarqup6kbbsdrdkztai4loetxzqfmn3uierec0x17y.png",
  autodesk: "Autodesk-rarquq4ei5to2zjmnswr666ajdlsuc7kujevtavn1q.png",
  etap: "etap-rarqur28ozuyeli9ibbdqnxr4rh621bb6o2daku8vi.png",
  fortinet: "fortinet-rarqus02vtw8q7gwctq0b5p7q5cj9qf1ispurusupa.png",
  kaspersky: "kaspersky-rarqutvr9hytdfe61uj9g584wx39p4mi720tqeq2cu.png",
  microsoft: "Microsoft-rarquutlgc03p1cswcxw0mzliaymwtq8j6ob7ooo6m.png",
  lumion: "lumion-rartyoocjr36ywx0w7505x2trlrpogolkosxnsvhwu.png",
  paloalto: "paloalto-rartyrhv4971xqsxfqcvved7jrdtbjzsl2re3mrbe6.png",
  vray: "v.ray_-rartysfpb38c9crka8rifw4o5596j93ix7evkwpx7y.png",
  twinmotion: "twinmotion-rartyubdorawwkotz9krkvnlbwzwynazlgpujgn4vi.png",
};

const BANNER = "Etap-e1754305581206-r9rclz9wr9r0ta61dseoz0n57g4ef8xmog8s9azcf6.png";
const INTRO = "ETAP-1-e1754305634199-r9rcnd2vib7epc5wkb3rtzryjvj3nlbcccz46f429s.png";

function pub(file) {
  return `/images/software/educational/etap/${file}`;
}

function copyIn(name) {
  const src = path.join(FILES_DIR, name);
  if (!fs.existsSync(src)) throw new Error(`missing ${src}`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.copyFileSync(src, path.join(OUT_DIR, name));
  return pub(name);
}

const copied = new Set();
for (const file of [BANNER, INTRO, ...Object.values(ALLIANCE_BY_ID)]) {
  if (SKIP.test(file) || copied.has(file)) continue;
  copyIn(file);
  copied.add(file);
}

const data = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
data.banner.imageSrc = pub(BANNER);
if (data.featureRows?.[0]) data.featureRows[0].imageSrc = pub(INTRO);
if (data.partnerships?.logos) {
  for (const logo of data.partnerships.logos) {
    const file = ALLIANCE_BY_ID[logo.id];
    if (file) logo.src = pub(file);
  }
}
fs.writeFileSync(JSON_PATH, `${JSON.stringify(data, null, 2)}\n`);

let media = fs.readFileSync(MEDIA_TS, "utf8");
const introUrl = pub(INTRO);
if (media.includes('"etap":')) {
  media = media.replace(/"etap":\s*"[^"]+"/, `"etap": "${introUrl}"`);
  fs.writeFileSync(MEDIA_TS, media);
}

console.log(`Copied ${copied.size} images → ${path.relative(ROOT, OUT_DIR)}/`);
console.log(`Patched ${path.relative(ROOT, JSON_PATH)}`);
console.log(`Banner: ${pub(BANNER)}`);
console.log(`Intro:  ${introUrl}`);
