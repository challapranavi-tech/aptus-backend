#!/usr/bin/env node
/**
 * Extract styles, images, and Font Awesome icons from LIVE WEBSITE/software/autodesk.
 * Usage: node scripts/extract-autodesk-assets.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LIVE = path.join(ROOT, "LIVE WEBSITE", "software", "autodesk");
const ICONS_OUT = path.join(ROOT, "data", "autodesk-icons.ts");
const STYLES_DIR = path.join(ROOT, "styles", "live", "autodesk");
const IMAGES_DIR = path.join(ROOT, "public", "images", "software", "autodesk");
const MANIFEST_OUT = path.join(ROOT, "data", "autodesk-assets-manifest.json");

const SKIP_IMG = /logo|cropped-Aptus|Aptus-infotech-orignal|favicon|icon-/i;
const ICON_RE =
  /<svg[^>]*class="[^"]*e-fa[brs]-([a-z0-9-]+)[^"]*"[^>]*viewBox="([^"]+)"[^>]*>([\s\S]*?)<\/svg>/gi;

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

function slugFromRoute(route) {
  if (route === "/autodesk") return "autodesk-hub";
  return route.replace(/^\/+/, "").toLowerCase() || "home";
}

function mainContent(html) {
  return html.match(/<main[^>]*id="content"[\s\S]*?<\/main>/i)?.[0] ?? html;
}

function stripPaths(inner) {
  return [...inner.matchAll(/<path\b[^>]*?\/?>(?:<\/path>)?/gi)]
    .map((p) =>
      p[0]
        .replace(/\s*fill="[^"]*"/gi, "")
        .replace(/<\/path>/gi, "")
        .replace(/\s*\/?>$/, "/>"),
    )
    .join("");
}

function bestImageUrl(tag, htmlDir) {
  const srcset = tag.match(/srcset="([^"]+)"/i)?.[1];
  if (srcset) {
    const wp = srcset.match(/https:\/\/aptusinfotech\.com\/wp-content\/uploads\/[^\s,]+/i)?.[0];
    if (wp && !SKIP_IMG.test(wp)) return wp.replace(/&amp;/g, "&");
  }
  const src = tag.match(/\ssrc="([^"]+)"/i)?.[1]?.replace(/&amp;/g, "&");
  if (!src) return undefined;
  if (src.includes("wp-content/uploads")) return SKIP_IMG.test(src) ? undefined : src;
  const local = path.resolve(htmlDir, src.replace(/^\.\//, ""));
  if (fs.existsSync(local)) return local;
  const file = src.match(/([^/\\]+\.(?:png|jpe?g|webp|gif))(?:\?|$)/i)?.[1];
  if (!file || SKIP_IMG.test(file)) return undefined;
  return `https://aptusinfotech.com/wp-content/uploads/2025/08/${file.replace(/-radt[a-z0-9]+(?=\.)/i, "").replace(/-e\d+(?=\.)/i, "")}`;
}

async function fetchToFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function materializeImage(source, dest) {
  if (fs.existsSync(dest)) return "cached";
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (source.startsWith("http")) {
    await fetchToFile(source, dest);
    return "downloaded";
  }
  fs.copyFileSync(source, dest);
  return "copied";
}

function safeName(file) {
  return file.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

const pages = [];
const icons = {};
let kitCssCopied = false;

for (const name of fs.readdirSync(LIVE)) {
  if (!name.endsWith(".html")) continue;
  const htmlPath = path.join(LIVE, name);
  const html = fs.readFileSync(htmlPath, "utf8");
  const route = routeFromHtml(html);
  if (!route) continue;

  const slug = slugFromRoute(route);
  const htmlDir = path.dirname(htmlPath);
  const filesDir = `${htmlPath.replace(/\.html$/i, "")}_files`;
  const postId = html.match(/class="elementor elementor-(\d+)"/i)?.[1];
  const main = mainContent(html);

  // ── icons (main content only — skip header nav carets) ──
  let m;
  ICON_RE.lastIndex = 0;
  while ((m = ICON_RE.exec(main))) {
    const [, iconName, viewBox, inner] = m;
    if (icons[iconName]) continue;
    const paths = stripPaths(inner);
    if (paths) icons[iconName] = { viewBox, paths };
  }

  // ── post CSS ──
  const styleFiles = [];
  if (postId) {
    const postCss = path.join(filesDir, `post-${postId}.css`);
    if (fs.existsSync(postCss)) {
      fs.mkdirSync(STYLES_DIR, { recursive: true });
      const dest = path.join(STYLES_DIR, `${slug}.css`);
      fs.copyFileSync(postCss, dest);
      styleFiles.push(path.relative(ROOT, dest));
    }
  }
  const kitCss = path.join(filesDir, "post-9.css");
  if (!kitCssCopied && fs.existsSync(kitCss)) {
    fs.mkdirSync(STYLES_DIR, { recursive: true });
    const dest = path.join(STYLES_DIR, "kit-9-globals.css");
    fs.copyFileSync(kitCss, dest);
    styleFiles.push(path.relative(ROOT, dest));
    kitCssCopied = true;
  }

  // ── images ──
  const images = {};
  for (const tag of main.matchAll(/<img[^>]+>/gi)) {
    const alt = tag[0].match(/alt="([^"]*)"/i)?.[1] ?? "";
    const source = bestImageUrl(tag[0], htmlDir);
    if (!source) continue;
    const base =
      typeof source === "string" && source.startsWith("http")
        ? path.basename(new URL(source).pathname)
        : path.basename(source);
    const rel = `${slug}/${safeName(base)}`;
    const dest = path.join(IMAGES_DIR, rel);
    try {
      const how = await materializeImage(source, dest);
      const key = alt || base.replace(/\.[^.]+$/, "");
      images[key] = { local: `/images/software/autodesk/${rel.replace(/\\/g, "/")}`, source, how };
    } catch (e) {
      images[alt || base] = { source, error: String(e.message ?? e) };
    }
  }

  pages.push({ route, slug, postId, styleFiles, images });
}

// ── autodesk-icons.ts ──
const iconNames = Object.keys(icons).sort();
const iconBody = iconNames.map((n) => `  ${JSON.stringify(n)}: ${JSON.stringify(icons[n])},`).join("\n");
fs.writeFileSync(
  ICONS_OUT,
  `// AUTO-GENERATED by scripts/extract-autodesk-assets.mjs — do not edit by hand.
export interface AutodeskIcon {
  viewBox: string;
  paths: string;
}

export const AUTODESK_ICONS: Record<string, AutodeskIcon> = {
${iconBody}
};
`,
);

const manifest = {
  generatedAt: new Date().toISOString(),
  source: path.relative(ROOT, LIVE),
  iconCount: iconNames.length,
  icons: iconNames,
  pages,
};
fs.writeFileSync(MANIFEST_OUT, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Icons  → ${path.relative(ROOT, ICONS_OUT)} (${iconNames.length})`);
console.log(`Styles → ${path.relative(ROOT, STYLES_DIR)}/ (${pages.filter((p) => p.styleFiles.length).length} pages)`);
console.log(`Images → ${path.relative(ROOT, IMAGES_DIR)}/`);
console.log(`Manifest → ${path.relative(ROOT, MANIFEST_OUT)}`);
console.log(iconNames.join(", "));
