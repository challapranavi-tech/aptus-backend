#!/usr/bin/env node
/**
 * Download AEC Collection product-card images from live WP (2025/09/) into public/.
 * Run: node scripts/sync-aec-images.mjs
 */
import fs from "fs";
import path from "path";

const OUT = path.resolve("public/images/software/autodesk/aec-collection");

const FILES = [
  "3Dmax.png",
  "infraworks-1.png",
  "Advance-steel.png",
  "Robot-Structural-Analysis.png",
  "FormIt.png",
  "ReCap-Pro.png",
  "Vehicle-Tracking.png",
  "Structural-Bridge-Design.png",
  "Fabrication-CADmep.png",
  "infraworks.png",
  "Maya.png",
  "Autodesk-Doc.png",
  "Dynamo-Studio.png",
  "autodesk-drive.png",
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // Arnold filename on live WP includes U+200B before .png
  const arnoldPath = "uploads/2025/09/Arnold\u200b.png";
  const arnoldUrl = `https://aptusinfotech.com/wp-content/${arnoldPath}`;
  const arnoldDest = path.join(OUT, "Arnold_.png");
  if (!fs.existsSync(arnoldDest)) {
    const r = await fetch(arnoldUrl);
    if (!r.ok) throw new Error(`Arnold ${r.status}`);
    fs.writeFileSync(arnoldDest, Buffer.from(await r.arrayBuffer()));
    console.log("saved Arnold_.png");
  }

  for (const file of FILES) {
    const dest = path.join(OUT, file);
    if (fs.existsSync(dest)) continue;
    const url = `https://aptusinfotech.com/wp-content/uploads/2025/09/${file}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${file} ${r.status}`);
    fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
    console.log("saved", file);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
