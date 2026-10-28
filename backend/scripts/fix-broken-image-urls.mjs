#!/usr/bin/env node
/**
 * Replace known-broken WP image URLs across content/ + data/.
 * Run: node scripts/fix-broken-image-urls.mjs
 * Verify: node scripts/audit-assets.mjs --check-urls
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const AEC_LOCAL = "/images/software/autodesk/aec-collection";

const REPLACEMENTS = new Map([
  [
    "https://aptusinfotech.com/wp-content/uploads/2025/08/Adobe-Photoshop-r9ux9ptekmncb59x5ayyj5z7br5cws01wyrcoqrsyu.png",
    "https://aptusinfotech.com/wp-content/uploads/2025/08/Adobe-Photoshop.png",
  ],
  [
    "https://aptusinfotech.com/wp-content/uploads/2025/08/Autocad-r9svf0dlhp2uxt714kb6ckxiddkpte4c1l7y1yv2p2.png",
    "https://aptusinfotech.com/wp-content/uploads/2025/08/Autocad.png",
  ],
  [
    "https://aptusinfotech.com/wp-content/uploads/2025/08/microsoft-office-360-e1754206177407-r9pcijcjxdskvp0a6abqaa7p2il499hx5wankpuf56.png",
    "https://aptusinfotech.com/wp-content/uploads/2025/08/Microsoft-365-Apps.png",
  ],
  [
    "https://aptusinfotech.com/wp-content/uploads/2025/08/Power-BI-1.jpg",
    "https://aptusinfotech.com/wp-content/uploads/2025/08/Microsoft-Power-BI.png",
  ],
  [
    "https://aptusinfotech.com/wp-content/uploads/2025/08/Oracle-Primavera-e1754206630609-r9pcud5fxbyreb5f6t15hwyzor850shcjkybfv5d1k.png",
    "https://aptusinfotech.com/wp-content/uploads/2025/08/Oracle-Primavera.png",
  ],
  [
    "https://aptusinfotech.com/wp-content/uploads/2025/08/ETAP-1-e1754305634199-r9rcnd2vib7epc5wkb3rtzryjvj3nlbcccz46f429s.png",
    "https://aptusinfotech.com/wp-content/uploads/2025/08/etap.png",
  ],
]);

const AEC_FILES = [
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
  "Arnold_.png",
  "Maya.png",
  "Autodesk-Doc.png",
  "Dynamo-Studio.png",
  "autodesk-drive.png",
];

for (const file of AEC_FILES) {
  REPLACEMENTS.set(
    `https://aptusinfotech.com/wp-content/uploads/2025/08/${file}`,
    `${AEC_LOCAL}/${file}`,
  );
  // ponytail: live site moved these to 2025/09 — remap any stale 09 guesses too
  REPLACEMENTS.set(
    `https://aptusinfotech.com/wp-content/uploads/2025/09/${file}`,
    `${AEC_LOCAL}/${file}`,
  );
}

const SCAN_DIRS = [path.join(ROOT, "content"), path.join(ROOT, "data")];
const EXT = new Set([".json", ".ts", ".xml"]);

function walkReplace(file) {
  let text = fs.readFileSync(file, "utf8");
  let changed = false;
  for (const [from, to] of REPLACEMENTS) {
    if (text.includes(from)) {
      text = text.split(from).join(to);
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(file, text);
  return changed;
}

let files = 0;
for (const dir of SCAN_DIRS) {
  if (!fs.existsSync(dir)) continue;
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) stack.push(p);
      else if (EXT.has(path.extname(ent.name)) && walkReplace(p)) files++;
    }
  }
}

console.log(`Updated ${files} files (${REPLACEMENTS.size} mappings).`);
