/**
 * Build basename → /images/... map for dead WordPress upload URLs.
 * Run: node scripts/generate-cms-image-map.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const IMAGES = path.join(ROOT, "frontend/public/images");
const OUT = path.join(ROOT, "shared/lib/cms-image-map.json");

/** Normalize WP/Elementor filename noise to a stable stem. */
export function imageStem(filename) {
  let s = filename.replace(/\.[^.]+$/, "").toLowerCase();
  s = s.replace(/_\d+$/g, "");
  s = s.replace(/-\d+x\d+/g, "");
  s = s.replace(/-e\d{8,}/g, "");
  s = s.replace(/-r[a-z0-9]{12,}/g, "");
  s = s.replace(/-\d+$/g, "");
  return s;
}

function scorePath(rel, name) {
  // Prefer clean originals over Elementor thumbs / size variants / _N copies
  let score = 0;
  if (!rel.includes("/")) score += 8;
  if (!/_\d+\./.test(name)) score += 4;
  if (!/-\d+x\d+/.test(name)) score += 2;
  if (!/-r[a-z0-9]{12,}/i.test(name)) score += 2;
  if (!/-e\d{8,}/.test(name)) score += 1;
  score -= name.length / 1000;
  return score;
}

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const files = walk(IMAGES);
const exact = new Map();
const stem = new Map();

for (const abs of files) {
  const name = path.basename(abs);
  const rel = "/images/" + path.relative(IMAGES, abs).split(path.sep).join("/");
  const key = name.toLowerCase();
  const prevExact = exact.get(key);
  if (!prevExact || scorePath(rel, name) > scorePath(prevExact, path.basename(prevExact))) {
    exact.set(key, rel);
  }
  const st = imageStem(name);
  if (!st) continue;
  const prevStem = stem.get(st);
  if (!prevStem || scorePath(rel, name) > scorePath(prevStem, path.basename(prevStem))) {
    stem.set(st, rel);
  }
}

const payload = {
  generatedAt: new Date().toISOString(),
  exact: Object.fromEntries([...exact.entries()].sort()),
  stem: Object.fromEntries([...stem.entries()].sort()),
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(payload) + "\n");
console.log(
  `Wrote ${OUT} (${exact.size} exact, ${stem.size} stems) from ${files.length} files`,
);
