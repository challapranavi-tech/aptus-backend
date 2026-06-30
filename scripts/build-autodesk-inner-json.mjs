/**
 * Build softwareInnerHero JSON for Autodesk inner pages from legacy exports.
 * Usage: node scripts/build-autodesk-inner-json.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LEGACY_DIR = path.join(ROOT, "aptus-web", "aptus-web", "content", "odoo-json", "autodesk");
const OUT_DIR = path.join(ROOT, "content", "odoo-json", "autodesk");

const IMAGES = {
  autocad:
    "https://aptusinfotech.com/wp-content/uploads/2025/08/imgi_8_photo-1581094794329-c8112a89af12-683x1024.png",
  "3ds-max": "https://aptusinfotech.com/wp-content/uploads/2025/08/3d-683x1024.png",
  revit: "https://aptusinfotech.com/wp-content/uploads/2025/06/Revit-2-1024x1024.png",
  "civil-3d": "https://aptusinfotech.com/wp-content/uploads/2025/05/autodesk_civil_3d.png",
  "aec-collection":
    "https://aptusinfotech.com/wp-content/uploads/2025/08/imgi_8_photo-1581094794329-c8112a89af12-683x1024.png",
  "autocad-lt": "https://aptusinfotech.com/wp-content/uploads/2025/06/Autocad_LT-1024x1024.png",
  "bim-collaborate-pro": "https://aptusinfotech.com/wp-content/uploads/2025/08/Bim.png",
  "autodesk-docs":
    "https://aptusinfotech.com/wp-content/uploads/2025/06/Autodesk_Doc-1024x1024.png",
  "autodesk-build":
    "https://aptusinfotech.com/wp-content/uploads/2025/06/Autodesk_Build-1024x1024.png",
  "autodesk-takeoff":
    "https://aptusinfotech.com/wp-content/uploads/2025/06/Autodesk_takeoff-scaled.png",
  navisworks:
    "https://aptusinfotech.com/wp-content/uploads/2025/06/Autodesk_Naviworks-scaled-e1754202609709-1024x761.png",
};

const PAGES = [
  "autocad",
  "3ds-max",
  "revit",
  "civil-3d",
  "aec-collection",
  "autocad-lt",
  "bim-collaborate-pro",
  "autodesk-docs",
  "autodesk-build",
  "autodesk-takeoff",
  "navisworks",
];

function joinTitle(t) {
  if (!t) return undefined;
  return [t.before, t.accent, t.after].filter(Boolean).join(" ").trim() || undefined;
}

function bannerTitle(hero) {
  const accent = hero?.title?.accent?.trim();
  const full = joinTitle(hero?.title);
  const label = accent ?? full;
  if (!label) return undefined;
  if (/autodesk/i.test(label)) return label;
  if (/^auto\s?cad/i.test(label)) {
    return label.toLowerCase().includes("lt")
      ? "AutoCAD LT software for 2D drafting"
      : "AutoCAD software for 2D and 3D design";
  }
  return `Autodesk ${label}`;
}

function legacyToInner(slug, legacy) {
  if (legacy.softwareInnerHero?.title) {
    const inner = { ...legacy.softwareInnerHero };
    if (!inner.imageSrc) inner.imageSrc = IMAGES[slug];
    return { ...legacy, softwareInnerHero: inner };
  }

  const hero = legacy.hero;
  const intro = legacy.intro;
  const label = hero?.title?.accent ?? joinTitle(hero?.title) ?? slug;

  const out = {
    softwareInnerHero: {
      id: "hero",
      visible: true,
      family: "autodesk",
      bannerTitle: bannerTitle(hero),
      bannerTagline: hero?.subtitle,
      title: intro ? joinTitle(intro.title) : joinTitle(hero?.title),
      paragraphs: intro?.paragraphs,
      imageSrc: IMAGES[slug],
      imageAlt: label,
      ctaLabel: hero?.ctaLabel ?? "Request a Quote",
      ctaHref: hero?.ctaHref?.startsWith("mailto:") ? "#form" : (hero?.ctaHref ?? "#form"),
    },
    cardSections: legacy.cardSections,
    testimonials: legacy.testimonials,
    contactCta: legacy.contactCta ?? {
      heading: "Have questions? We can help",
      showForm: true,
      submitLabel: "Submit Now",
      formVariant: "simple",
      layout: "light",
    },
  };

  return out;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const slug of PAGES) {
  const file = `${slug}.json`;
  const rootPath = path.join(OUT_DIR, file);
  const legacyPath = path.join(LEGACY_DIR, file);
  const sourcePath = fs.existsSync(rootPath) && slug === "autocad" ? rootPath : legacyPath;

  if (!fs.existsSync(sourcePath)) {
    console.warn(`Skip (missing): ${file}`);
    continue;
  }

  const legacy = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  const next = legacyToInner(slug, legacy);
  fs.writeFileSync(rootPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  console.log(`Wrote ${file}`);
}

console.log(`\nDone — ${OUT_DIR}`);
