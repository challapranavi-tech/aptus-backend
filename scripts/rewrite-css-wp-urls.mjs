/**
 * Rewrite hardcoded WP background urls in CSS using cms-image-map + aliases.
 * Run: node scripts/rewrite-css-wp-urls.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import map from "../shared/lib/cms-image-map.json" with { type: "json" };
import aliasesJson from "../shared/lib/cms-image-aliases.json" with { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ALIASES = aliasesJson.aliases;

function imageStem(filename) {
  let s = filename.replace(/\.[^.]+$/, "").toLowerCase();
  s = s.replace(/_\d+$/g, "");
  s = s.replace(/-\d+x\d+/g, "");
  s = s.replace(/-e\d{8,}/g, "");
  s = s.replace(/-r[a-z0-9]{12,}/g, "");
  s = s.replace(/-\d+$/g, "");
  return s;
}

function resolveLocal(src) {
  const file = decodeURIComponent(src.split("/").pop().split("?")[0]);
  const key = file.toLowerCase();
  return (
    map.exact[key] ?? map.stem[imageStem(file)] ?? ALIASES[key] ?? null
  );
}

const cssFiles = [
  "frontend/styles/elv-product-pages.css",
  "frontend/styles/software-product-pages.css",
  "frontend/styles/case-studies-pages.css",
  "frontend/styles/live/autodesk/autodesk-hub.css",
];

const WP =
  /https:\/\/(?:www\.)?aptusinfotech\.com\/wp-content\/uploads\/[^"')]+/g;

let rewritten = 0;
let leftover = 0;
const leftoverNames = [];

for (const rel of cssFiles) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) continue;
  let text = fs.readFileSync(abs, "utf8");
  let fileHits = 0;
  text = text.replace(WP, (url) => {
    const local = resolveLocal(url);
    if (!local) {
      leftover++;
      leftoverNames.push(path.basename(url));
      return url;
    }
    const disk = path.join(ROOT, "frontend/public", local.replace(/^\//, ""));
    if (!fs.existsSync(disk)) {
      leftover++;
      leftoverNames.push(`${path.basename(url)} -> missing ${local}`);
      return url;
    }
    rewritten++;
    fileHits++;
    return local;
  });
  fs.writeFileSync(abs, text);
  console.log(`${rel}: ${fileHits} rewrites`);
}

console.log(`total rewrote ${rewritten}, leftover ${leftover}`);
for (const n of [...new Set(leftoverNames)]) console.log(" leftover:", n);
