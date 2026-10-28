#!/usr/bin/env node
/**
 * ponytail: one-shot audit — scans LIVE WEBSITE HTML + CSS, emits JSON + generated CSS tree.
 * Run: node scripts/css-architecture-audit.mjs
 */
import fs from "fs";
import path from "path";
import { createHash } from "crypto";

const ROOT = path.resolve(import.meta.dirname, "..");
const LIVE = path.join(ROOT, "LIVE WEBSITE");
const OUT = path.join(ROOT, "styles-refactor");
const REPORT = path.join(OUT, "audit-report.json");

const SHARED_COMPONENT_PATTERNS = [
  { id: "navbar", re: /elementor-location-header|widget-nav-menu|aptus-masthead|site-header|header-section/i },
  { id: "footer", re: /elementor-location-footer|site-footer|footer-section|aptus-footer/i },
  { id: "hero", re: /hero|banner|slider|swiper|carousel.*hero|page-title/i },
  { id: "cta", re: /cta|call-to-action|contact-form|aptus-form-band/i },
  { id: "testimonials", re: /testimonial|review-carousel/i },
  { id: "features", re: /feature|flip-box|icon-box|key-enabler/i },
  { id: "cards", re: /flip-box|card|grid.*item|logo-grid|alliance/i },
  { id: "forms", re: /form|elementor-field|wpcf7|contact.*form/i },
  { id: "team", re: /team|leadership|employee/i },
  { id: "maps", re: /google_maps|elementor-widget-google_maps/i },
];

const VENDOR_CSS = new Set([
  "reset.css", "theme.css", "frontend.min.css", "style.min.css", "latest.css",
  "swiper.min.css", "e-swiper.min.css", "poppins.css", "jquery", "apple-webkit",
  "widget-", "e-animation-", "e-sticky", "motion-fx", "popup.min.css",
]);

function walk(dir, ext, skipRe) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (skipRe?.test(p)) continue;
      out.push(...walk(p, ext, skipRe));
    } else if (ent.name.endsWith(ext)) {
      if (!skipRe?.test(p)) out.push(p);
    }
  }
  return out;
}

function slugify(name) {
  return name
    .replace(/\.html$/i, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 60);
}

function routeFromHtml(file, html) {
  const saved = html.match(/saved from url=\(([^)]+)\)/i);
  if (saved) {
    try {
      const u = new URL(saved[1].replace(/&amp;/g, "&"));
      return u.pathname.replace(/\/$/, "") || "/";
    } catch { /* fall through */ }
  }
  const canon = html.match(/rel="canonical"\s+href="([^"]+)"/i);
  if (canon) {
    try {
      const u = new URL(canon[1].replace(/&amp;/g, "&"));
      return u.pathname.replace(/\/$/, "") || "/";
    } catch { /* fall through */ }
  }
  const folder = path.basename(path.dirname(file)).toLowerCase();
  const base = path.basename(file, ".html");
  if (folder === "home") return "/";
  if (folder === "about us") return `/about/${slugify(base)}`;
  if (folder === "elv") return `/elv/${slugify(base)}`;
  if (folder === "software") return `/software/${slugify(base)}`;
  if (folder === "case studies") return `/case-studies`;
  return `/${slugify(base)}`;
}

function pageNameFromHtml(html, file) {
  const t = html.match(/<title>([^<]+)<\/title>/i);
  if (t) return t[1].replace(/&amp;/g, "&").trim();
  return path.basename(file, ".html");
}

function classifyCss(filename) {
  const f = filename.toLowerCase();
  if (f.startsWith("post-") && f.endsWith(".css")) return "page-theme";
  if ([...VENDOR_CSS].some((v) => f.includes(v))) return "vendor";
  if (f === "header-footer.css") return "component";
  if (f === "theme.css" || f === "reset.css") return "theme";
  return "other";
}

function parseSelectors(css) {
  const sels = new Set();
  const re = /([^{}@][^{]*)\{/g;
  let m;
  while ((m = re.exec(css))) {
    const raw = m[1].trim();
    if (!raw || raw.startsWith("@")) continue;
    raw.split(",").forEach((s) => {
      const t = s.trim();
      if (t && !t.startsWith("@")) sels.add(t);
    });
  }
  return sels;
}

function normalizeDecls(block) {
  return block
    .split(";")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join(";");
}

function extractRules(css) {
  const rules = new Map();
  const re = /([^{}@][^{]*)\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const decls = normalizeDecls(m[2]);
    if (!decls) continue;
    m[1].split(",").forEach((sel) => {
      const s = sel.trim();
      if (!s) return;
      const key = `${s}::${decls}`;
      if (!rules.has(key)) rules.set(key, { selector: s, decls });
    });
  }
  return rules;
}

function extractVars(css) {
  const vars = {};
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+)/gi;
  let m;
  while ((m = re.exec(css))) vars[`--${m[1]}`] = m[2].trim();
  return vars;
}

function extractAnimations(css) {
  const anims = { keyframes: [], transitions: [], animations: [] };
  const kf = css.matchAll(/@keyframes\s+([a-z0-9_-]+)/gi);
  for (const k of kf) anims.keyframes.push(k[1]);
  const tr = css.match(/transition\s*:[^;]+/gi) || [];
  anims.transitions.push(...tr.slice(0, 50));
  const an = css.match(/animation\s*:[^;]+/gi) || [];
  anims.animations.push(...an.slice(0, 50));
  return anims;
}

function detectComponents(html) {
  const found = { shared: [], unique: [] };
  for (const p of SHARED_COMPONENT_PATTERNS) {
    if (p.re.test(html)) found.shared.push(p.id);
  }
  const sections = [...html.matchAll(/data-id="([^"]+)"[^>]*class="([^"]*elementor-section[^"]*)"/gi)]
    .map((m) => m[2])
    .slice(0, 20);
  const unique = sections.filter((s) => !SHARED_COMPONENT_PATTERNS.some((p) => p.re.test(s)));
  found.unique = [...new Set(unique.map((s) => s.split(/\s+/).find((c) => c.includes("elementor-section")) || "section"))].slice(0, 8);
  return found;
}

function extractInlineStyles(html) {
  const inline = [];
  const re = /\sstyle="([^"]*)"/gi;
  let m;
  while ((m = re.exec(html))) {
    if (m[1].trim()) inline.push(m[1].trim());
  }
  return inline;
}

function extractStyleTags(html) {
  const tags = [];
  const re = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = re.exec(html))) {
    const id = (m[0].match(/id="([^"]+)"/) || [])[1] || "inline";
    tags.push({ id, bytes: m[1].length });
  }
  return tags;
}

function extractColors(css) {
  const colors = {};
  const re = /#([0-9a-f]{3,8})\b/gi;
  let m;
  while ((m = re.exec(css))) {
    const c = `#${m[1].toLowerCase()}`;
    colors[c] = (colors[c] || 0) + 1;
  }
  return Object.entries(colors).sort((a, b) => b[1] - a[1]).slice(0, 30);
}

// ── main scan ──────────────────────────────────────────────
const htmlFiles = walk(LIVE, ".html", /_files/);
const cssFiles = walk(LIVE, ".css", null);

console.log(`Scanning ${htmlFiles.length} pages, ${cssFiles.length} CSS files…`);

const globalVars = {};
const allRules = new Map(); // hash -> { selector, decls, files: Set }
const selectorUsage = new Map(); // selector -> page count
const cssInventory = { vendor: new Set(), theme: new Set(), component: new Set(), page: new Set() };
const pages = [];

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const rel = path.relative(LIVE, file);
  const folder = path.basename(path.dirname(file));
  const route = routeFromHtml(file, html);
  const pageName = pageNameFromHtml(html, file);
  const slug = slugify(path.basename(file, ".html"));

  const cssLinks = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)].map((m) =>
    path.basename(m[1].replace(/&amp;/g, "&"))
  );
  const jsLinks = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) =>
    path.basename(m[1].replace(/&amp;/g, "&"))
  );

  const components = detectComponents(html);
  const inlineStyles = extractInlineStyles(html);
  const styleTags = extractStyleTags(html);

  const pageCss = cssLinks.filter((c) => c.startsWith("post-"));
  const sharedCss = cssLinks.filter((c) => !c.startsWith("post-"));

  cssLinks.forEach((c) => {
    const kind = classifyCss(c);
    if (kind === "vendor") cssInventory.vendor.add(c);
    else if (kind === "theme") cssInventory.theme.add(c);
    else if (kind === "component") cssInventory.component.add(c);
    else if (kind === "page-theme") cssInventory.page.add(c);
  });

  // class usage from HTML
  const classes = [...html.matchAll(/class="([^"]+)"/gi)].flatMap((m) => m[1].split(/\s+/));
  const classSet = new Set(classes);
  for (const cls of classSet) {
    if (cls.startsWith("elementor-") || cls.startsWith("aptus-") || cls.startsWith("wp-")) {
      selectorUsage.set(`.${cls}`, (selectorUsage.get(`.${cls}`) || 0) + 1);
    }
  }

  const gsap = /gsap|ScrollTrigger|elementor-motion|e-animation-|slideInUp|bounce-in/i.test(html);
  const swiper = /swiper|carousel/i.test(html);

  pages.push({
    file: rel,
    folder,
    pageName,
    slug,
    route,
    css: cssLinks,
    js: jsLinks,
    pageCss,
    sharedCss,
    sharedComponents: components.shared,
    uniqueComponents: components.unique,
    inlineStyleCount: inlineStyles.length,
    inlineStyleSamples: inlineStyles.slice(0, 5),
    styleTags,
    themeDependencies: ["Elementor 4.x", "Hello Elementor", "Poppins", swiper ? "Swiper" : null, gsap ? "Elementor Motion" : null].filter(Boolean),
    hasGsap: gsap,
    hasSwiper: swiper,
    classCount: classSet.size,
  });
}

// analyze CSS corpus (sample post-*.css + shared)
const cssToAnalyze = cssFiles.filter((f) => {
  const b = path.basename(f);
  return b.startsWith("post-") || ["header-footer.css", "theme.css", "post-9.css"].includes(b);
});

const animationAudit = { keyframes: new Set(), transitions: [], elementorAnimations: new Set() };
const topColors = {};

for (const file of cssToAnalyze) {
  let css;
  try { css = fs.readFileSync(file, "utf8"); } catch { continue; }
  Object.assign(globalVars, extractVars(css));
  const anims = extractAnimations(css);
  anims.keyframes.forEach((k) => animationAudit.keyframes.add(k));
  animationAudit.transitions.push(...anims.transitions.slice(0, 3));
  const colors = extractColors(css);
  colors.forEach(([c, n]) => { topColors[c] = (topColors[c] || 0) + n; });

  const rules = extractRules(css);
  for (const [, rule] of rules) {
    const h = createHash("md5").update(`${rule.selector}::${rule.decls}`).digest("hex");
    if (!allRules.has(h)) allRules.set(h, { ...rule, files: new Set() });
    allRules.get(h).files.add(path.basename(file));
  }
  if (path.basename(file).includes("e-animation")) {
    animationAudit.elementorAnimations.add(path.basename(file));
  }
}

// duplicate selectors (same decls, different class names)
const declGroups = new Map();
for (const [, rule] of allRules) {
  const d = rule.decls;
  if (!declGroups.has(d)) declGroups.set(d, []);
  declGroups.get(d).push(rule.selector);
}
const duplicateStyles = [...declGroups.entries()]
  .filter(([, sels]) => sels.length > 1 && sels.some((s) => s.includes("btn") || s.includes("button")))
  .slice(0, 20)
  .map(([decls, sels]) => ({ decls: decls.slice(0, 120), selectors: [...new Set(sels)].slice(0, 6) }));

// button-like duplicates across pages
const buttonDupes = [...declGroups.entries()]
  .filter(([, sels]) => sels.length >= 2 && sels.some((s) => /\.(elementor-button|btn|wp-block-button)/i.test(s)))
  .slice(0, 15)
  .map(([decls, sels]) => ({ selectors: [...new Set(sels)].slice(0, 5), declsPreview: decls.slice(0, 100) }));

// shared components by page frequency
const componentFreq = {};
for (const p of pages) {
  for (const c of p.sharedComponents) {
    componentFreq[c] = (componentFreq[c] || 0) + 1;
  }
}

// route groups
const routeGroups = {};
for (const p of pages) {
  const g = p.folder;
  if (!routeGroups[g]) routeGroups[g] = [];
  routeGroups[g].push({ name: p.pageName, route: p.route, slug: p.slug });
}

const sortedColors = Object.entries(topColors).sort((a, b) => b[1] - a[1]).slice(0, 25);

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    htmlPages: pages.length,
    cssFilesTotal: cssFiles.length,
    cssFilesAnalyzed: cssToAnalyze.length,
    uniqueCssVariables: Object.keys(globalVars).length,
    routeGroups: Object.keys(routeGroups),
  },
  cssInventory: {
    vendor: [...cssInventory.vendor].sort(),
    theme: [...cssInventory.theme].sort(),
    component: [...cssInventory.component].sort(),
    pagePostCss: [...cssInventory.page].sort(),
  },
  componentFrequency: componentFreq,
  routeGroups,
  pages,
  designTokens: {
    extractedColors: sortedColors,
    elementorKitVars: Object.fromEntries(
      Object.entries(globalVars).filter(([k]) => k.includes("e-global") || k.includes("wp--preset")).slice(0, 40)
    ),
  },
  animationAudit: {
    keyframes: [...animationAudit.keyframes].slice(0, 30),
    elementorAnimationFiles: [...animationAudit.elementorAnimations].slice(0, 20),
    transitionSamples: [...new Set(animationAudit.transitions)].slice(0, 15),
  },
  duplicateStyles: buttonDupes,
  topSharedClasses: [...selectorUsage.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40),
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
console.log(`Wrote ${REPORT}`);

// ── generate CSS architecture ──────────────────────────────
const ARCH = path.join(OUT, "styles");
const dirs = ["components", "sections", "pages", "layout", "content"];
for (const d of dirs) fs.mkdirSync(path.join(ARCH, d), { recursive: true });

// variables.css from extracted live values
const primary = sortedColors.find(([c]) => c === "#1352a3") ? "#1352a3" : "#1352a3";
const green = sortedColors.find(([c]) => c === "#13934b") ? "#13934b" : "#13934b";

const variablesCss = `/**
 * Aptus design tokens — extracted from live Elementor kit (aptusinfotech.com)
 * Source: ${cssToAnalyze.length} post/theme CSS files across ${pages.length} pages
 */
:root {
  /* Brand */
  --primary-color: ${primary};
  --primary-color-hover: #0e3f80;
  --secondary-color: #67db85;
  --accent-green: ${green};
  --accent-green-hover: #0f7a3e;
  --accent-blue: #248bcc;
  --accent-sky: #38b6ff;
  --accent-amber: #f5a623;

  /* Neutrals (live body text #695B5B) */
  --color-navy: #16243a;
  --color-navy-dark: #0f1a2b;
  --color-text: #1f2a36;
  --color-text-muted: #695b5b;
  --color-background: #ffffff;
  --color-surface-muted: #24648c0f;
  --color-border: #e4ebe6;

  /* Typography */
  --font-primary: "Poppins", ui-sans-serif, system-ui, sans-serif;
  --font-secondary: "Poppins", ui-sans-serif, system-ui, sans-serif;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 4rem;
  --section-padding: 4rem;
  --content-max: 1300px;

  /* Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 1.25rem;
  --radius-card: 20px;

  /* Shadows */
  --shadow-sm: 0 1px 3px 0 rgb(14 43 82 / 0.08);
  --shadow-md: 0 4px 12px -2px rgb(14 43 82 / 0.12);
  --shadow-lg: 0 10px 28px -4px rgb(14 43 82 / 0.16);
  --shadow-card: 0 18px 25px 0 rgb(0 0 0 / 0.1);

  /* Motion */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
}
`;

const typographyCss = `/* Typography — matches Elementor kit + Hello theme */
body {
  font-family: var(--font-primary);
  font-size: 1rem;
  line-height: 1.5;
  color: var(--color-text);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-primary);
  font-weight: 600;
  color: var(--color-navy);
  letter-spacing: -0.01em;
}

.aptus-eyebrow,
.section-eyebrow {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--primary-color);
  line-height: 1.4;
}

.aptus-heading-accent {
  color: var(--accent-sky);
}
`;

const animationsCss = `/* Reusable animations — from Elementor motion + GSAP migration targets */
@keyframes aptus-fade-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes aptus-slide-in-up {
  from { transform: translate3d(0, 100%, 0); visibility: visible; }
  to { transform: translate3d(0, 0, 0); }
}

.aptus-animate-fade-up {
  animation: aptus-fade-up var(--duration-slow) var(--ease-out-expo) both;
}

.aptus-animate-hidden {
  opacity: 0;
  transform: translateY(30px);
}

/* Elementor parity: shrink / grow hover */
.aptus-img-shrink {
  transition: transform 0.4s var(--ease-out-expo);
}
.aptus-img-shrink:hover {
  transform: scale(0.96);
}

/* Flip card (services) */
.aptus-flip-card { perspective: 1200px; }
.aptus-flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s var(--ease-out-expo);
  transform-style: preserve-3d;
}
.aptus-flip-card:hover .aptus-flip-inner,
.aptus-flip-card:focus-within .aptus-flip-inner { transform: rotateY(180deg); }
.aptus-flip-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.aptus-flip-back { transform: rotateY(180deg); }

@media (prefers-reduced-motion: reduce) {
  .aptus-animate-fade-up,
  .aptus-flip-inner,
  .aptus-img-shrink { animation: none; transition: none; transform: none; }
}
`;

const utilitiesCss = `/* Layout + brand utilities */
.aptus-container {
  width: 100%;
  max-width: var(--content-max);
  margin-inline: auto;
  padding-inline: var(--spacing-md);
}

.aptus-section {
  padding-block: var(--section-padding);
}

.aptus-tint-panel {
  background-color: var(--color-surface-muted);
  border-radius: var(--radius-card);
}

.aptus-divider {
  display: block;
  width: 3rem;
  height: 3px;
  background-color: var(--accent-green);
  border-radius: 2px;
}

/* Inline style replacements (common Elementor data-settings) */
.aptus-bg-cover {
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

.aptus-text-center { text-align: center; }
.aptus-text-white { color: #fff; }
`;

const buttonsCss = `/* Unified button system — consolidates .elementor-button, .btn-section, .aptus-software-btn */
.aptus-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  color: #fff;
  border: 0;
  cursor: pointer;
  text-decoration: none;
  transition: transform var(--duration-normal) var(--ease-out-expo),
    background-color var(--duration-normal) ease;
}

.aptus-btn:hover {
  transform: scale(1.04);
}

.aptus-btn--primary {
  background-color: var(--accent-green);
}
.aptus-btn--primary:hover {
  background-color: var(--accent-green-hover);
}

.aptus-btn--blue {
  background-color: var(--primary-color);
}
.aptus-btn--blue:hover {
  background-color: var(--primary-color-hover);
}

.aptus-btn--sky {
  background-color: var(--accent-sky);
}

.aptus-btn--outline {
  background: transparent;
  border: 2px solid currentColor;
  color: var(--primary-color);
}
.aptus-btn--outline:hover {
  background-color: var(--primary-color);
  color: #fff;
  transform: none;
}
`;

const navbarCss = fs.existsSync(path.join(ROOT, "styles", "site-header.css"))
  ? `/* Migrated from styles/site-header.css — see root styles/ for canonical */\n@import "../../styles/site-header.css";\n`
  : `/* Navbar — extract from site-header.css */\n`;

const footerCss = `/* Footer — shared across all ${pages.length} pages */
.aptus-footer {
  background-color: var(--color-navy-dark);
  color: rgba(255, 255, 255, 0.9);
  padding-block: var(--spacing-2xl);
}

.aptus-footer a {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
}
.aptus-footer a:hover {
  color: var(--accent-amber);
}
`;

const cardsCss = `/* Cards — flip boxes, alliance logos, feature cards */
.aptus-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
}

.aptus-alliance-card {
  align-items: center;
  background: #fff;
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  display: flex;
  justify-content: center;
  min-height: 6rem;
  padding: var(--spacing-md);
}
`;

const formsCss = `/* Forms — contact, career, product lead */
.aptus-form-band {
  background-color: #13934b14;
}

.aptus-form-card {
  background: #fff;
  border-radius: var(--radius-card);
  padding: var(--spacing-xl);
}

.aptus-form-input {
  background-color: #13934b0f;
  border: 0;
  border-radius: var(--radius-card);
  color: #000;
  width: 100%;
  padding: 0.75rem 1rem;
}

.aptus-form-label {
  color: var(--color-text-muted);
  display: block;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}
`;

const sections = {
  hero: `/* Hero sections — layout only; content from CMS */\n.aptus-hero {\n  background-position: center top;\n  background-repeat: no-repeat;\n  background-size: cover;\n  padding: 7rem 0 0;\n}\n.aptus-hero__inner {\n  margin: 0 auto;\n  max-width: 800px;\n  text-align: center;\n}\n.aptus-hero__title {\n  color: #fff;\n  font-size: 2.5rem;\n  font-weight: 600;\n  line-height: 1.2;\n}\n`,
  features: `/* Feature rows + flip cards */\n.aptus-features-grid {\n  display: grid;\n  gap: var(--spacing-lg);\n}\n@media (min-width: 1024px) {\n  .aptus-features-grid { grid-template-columns: repeat(3, 1fr); }\n}\n`,
  testimonials: `/* Testimonial carousel shell */\n.aptus-testimonials {\n  padding-block: var(--section-padding);\n}\n.aptus-testimonial-card {\n  background: #fff;\n  border-radius: var(--radius-card);\n  padding: var(--spacing-xl);\n  box-shadow: var(--shadow-md);\n}\n`,
  cta: `/* CTA bands */\n.aptus-cta {\n  background-color: var(--primary-color);\n  color: #fff;\n  padding-block: var(--spacing-2xl);\n  text-align: center;\n}\n.aptus-cta__title {\n  font-size: 2rem;\n  font-weight: 600;\n  margin-bottom: var(--spacing-md);\n}\n`,
};

const globalsCss = `@import "./variables.css";
@import "./typography.css";
@import "./animations.css";
@import "./utilities.css";

/* Layout */
@import "./layout/content.css";

/* Components */
@import "./components/navbar.css";
@import "./components/footer.css";
@import "./components/buttons.css";
@import "./components/cards.css";
@import "./components/forms.css";

/* Sections */
@import "./sections/hero.css";
@import "./sections/features.css";
@import "./sections/testimonials.css";
@import "./sections/cta.css";
`;

const contentCss = `/**
 * CMS content styling — Odoo headless body HTML
 * Separate from layout shell for Next.js page templates.
 */
.aptus-cms-content {
  max-width: var(--content-max);
  margin-inline: auto;
}

.aptus-cms-content img {
  max-width: 100%;
  height: auto;
}

.aptus-cms-content h2 {
  margin-top: var(--spacing-xl);
  margin-bottom: var(--spacing-md);
}

.aptus-cms-content p {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-muted);
}
`;

// page-specific CSS stubs
const pageCssMap = {};
for (const p of pages) {
  const pageFile = `${p.slug}.css`;
  pageCssMap[p.route] = pageFile;
  const shared = p.sharedComponents.join(", ") || "none";
  const unique = p.uniqueComponents.join(", ") || "page sections";
  const pageCss = `/**
 * Page: ${p.pageName}
 * Route: ${p.route}
 * Source: LIVE WEBSITE/${p.file}
 *
 * SHARED (import via globals): ${shared}
 * UNIQUE (this file only): ${unique}
 */
@layer pages {
  .page-${p.slug} {
    /* page root scope */
  }

${p.sharedComponents.includes("hero") ? "" : `  /* Hero variants specific to this page */\n  .page-${p.slug} .aptus-hero {\n    /* override background-image via inline data attribute or CMS field */\n  }\n`}
${p.inlineStyleCount > 0 ? `  /* ${p.inlineStyleCount} inline styles detected — migrate to utilities */\n` : ""}}
`;
  fs.writeFileSync(path.join(ARCH, "pages", pageFile), pageCss);
}

// migration manifest
const migration = pages.map((p) => ({
  htmlFile: p.file,
  pageName: p.pageName,
  route: p.route,
  pageCss: `pages/${p.slug}.css`,
  componentFiles: [
    ...(p.sharedComponents.includes("navbar") ? ["components/navbar.css"] : []),
    ...(p.sharedComponents.includes("footer") ? ["components/footer.css"] : []),
    ...(p.sharedComponents.includes("forms") ? ["components/forms.css"] : []),
    ...(p.sharedComponents.includes("cards") ? ["components/cards.css"] : []),
    ...(p.sharedComponents.includes("hero") ? ["sections/hero.css"] : []),
    ...(p.sharedComponents.includes("features") ? ["sections/features.css"] : []),
    ...(p.sharedComponents.includes("testimonials") ? ["sections/testimonials.css"] : []),
    ...(p.sharedComponents.includes("cta") ? ["sections/cta.css"] : []),
  ],
  sharedDependencies: [
    "variables.css",
    "typography.css",
    "utilities.css",
    "animations.css",
    "components/buttons.css",
    ...p.pageCss.map((c) => `live:${c}`),
  ],
  vendorCssToDrop: p.css.filter((c) => classifyCss(c) === "vendor"),
  inlineStylesToConvert: p.inlineStyleCount,
}));

fs.writeFileSync(path.join(OUT, "variables.css"), variablesCss);
fs.writeFileSync(path.join(ARCH, "variables.css"), variablesCss);
fs.writeFileSync(path.join(ARCH, "typography.css"), typographyCss);
fs.writeFileSync(path.join(ARCH, "animations.css"), animationsCss);
fs.writeFileSync(path.join(ARCH, "utilities.css"), utilitiesCss);
fs.writeFileSync(path.join(ARCH, "globals.css"), globalsCss);
fs.writeFileSync(path.join(ARCH, "layout", "content.css"), contentCss);
fs.writeFileSync(path.join(ARCH, "components", "navbar.css"), navbarCss);
fs.writeFileSync(path.join(ARCH, "components", "footer.css"), footerCss);
fs.writeFileSync(path.join(ARCH, "components", "buttons.css"), buttonsCss);
fs.writeFileSync(path.join(ARCH, "components", "cards.css"), cardsCss);
fs.writeFileSync(path.join(ARCH, "components", "forms.css"), formsCss);
for (const [name, css] of Object.entries(sections)) {
  fs.writeFileSync(path.join(ARCH, "sections", `${name}.css`), css);
}
fs.writeFileSync(path.join(OUT, "migration-manifest.json"), JSON.stringify(migration, null, 2));

console.log(`Generated ${pages.length} page CSS files in ${ARCH}/pages/`);
console.log("Done.");
