/**
 * Forensic page JSON on disk — overrides Odoo `x_page_sections_json` in development
 * so localhost matches content/odoo-json without re-seeding after every edit.
 */
import fs from "fs";
import path from "path";
import { mapHomepageJson } from "./json-mapper";
import { mapPageJson } from "./page-json-mapper";
import type { Page } from "@/types";

const JSON_ROOT = path.join(process.cwd(), "content", "odoo-json");

const AUTODESK_INNER_SLUGS = new Set([
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
]);

/** Family subfolders under content/odoo-json (matches extract-software-live.mjs). */
const SOFTWARE_FAMILY_DIRS = [
  "autodesk",
  "adobe",
  "microsoft",
  "multimedia",
  "oracle",
  "edms",
  "educational",
  "quantity-takeoff",
  "structural",
  "cyber-security",
] as const;

/** First matching file wins (override → family folder → root). */
export function loadLocalPageSectionsJson(slug: string): string | null {
  const candidates: string[] = [];

  if (AUTODESK_INNER_SLUGS.has(slug)) {
    candidates.push(path.join(JSON_ROOT, "overrides", "autodesk", `${slug}.json`));
    candidates.push(path.join(JSON_ROOT, "autodesk", `${slug}.json`));
  }

  for (const family of SOFTWARE_FAMILY_DIRS) {
    candidates.push(path.join(JSON_ROOT, "overrides", family, `${slug}.json`));
    candidates.push(path.join(JSON_ROOT, family, `${slug}.json`));
  }

  candidates.push(path.join(JSON_ROOT, "overrides", "elv", `${slug}.json`));
  candidates.push(path.join(JSON_ROOT, "elv", `${slug}.json`));

  candidates.push(path.join(JSON_ROOT, "case-studies", `${slug}.json`));
  candidates.push(path.join(JSON_ROOT, "overrides", `${slug}.json`));
  candidates.push(path.join(JSON_ROOT, `${slug}.json`));

  for (const file of candidates) {
    if (fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  }
  return null;
}

/**
 * Whether local disk JSON may be used when Odoo is not configured
 * (prefer local over mock in development).
 *
 * security: false in production — when Odoo is unconfigured we must not
 * accidentally serve disk drafts as the public CMS. Missing-Odoo-page
 * fallback uses `buildLocalDevPage` directly (committed JSON only).
 */
export function isLocalPageJsonInDev(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.USE_LOCAL_PAGE_JSON === "false") return false;
  if (process.env.USE_LOCAL_PAGE_JSON === "true") return true;
  return true;
}

/**
 * Build home from content/odoo-json/home.json (homepage schema, not page-json).
 * Dev fallback when Odoo lacks x_homepage_sections_json.
 */
export function buildLocalHomePage(): Page | null {
  const file = path.join(JSON_ROOT, "home.json");
  if (!fs.existsSync(file)) return null;

  const raw = fs.readFileSync(file, "utf8");
  const sections = mapHomepageJson(raw);
  if (!sections?.length) return null;

  return {
    id: "local:home",
    slug: "home",
    title: "Home",
    seo: {},
    sections,
  };
}

/**
 * Build a Page from committed `content/odoo-json` when Odoo has no usable
 * sections for the slug. Safe in production: callers must only use this after
 * Odoo returned null/empty — never to override a non-empty Odoo page.
 */
export function buildLocalDevPage(slug: string): Page | null {
  const raw = loadLocalPageSectionsJson(slug);
  if (!raw) return null;

  const sections = mapPageJson(raw, { slug });
  if (!sections?.length) return null;

  let title = slug.replace(/-/g, " ");
  try {
    const data = JSON.parse(raw) as {
      softwareInnerHero?: { bannerTitle?: string; title?: string };
      hero?: { title?: { before?: string; accent?: string; after?: string } };
    };
    const heroTitle = [data.hero?.title?.before, data.hero?.title?.accent, data.hero?.title?.after]
      .filter(Boolean)
      .join(" ");
    title =
      data.softwareInnerHero?.bannerTitle ??
      data.softwareInnerHero?.title ??
      (heroTitle || title);
  } catch {
    // ponytail: title fallback is slug; JSON already parsed successfully above
  }

  return {
    id: `local:${slug}`,
    slug,
    title,
    seo: {},
    sections,
  };
}

/** Slugs with local JSON on disk — merged into generateStaticParams in dev. */
export function listLocalDevPageSlugs(): string[] {
  const slugs = new Set<string>();

  const addFromDir = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".json")) continue;
      const slug = name.slice(0, -5);
      if (loadLocalPageSectionsJson(slug)) slugs.add(slug);
    }
  };

  addFromDir(path.join(JSON_ROOT, "elv"));
  addFromDir(path.join(JSON_ROOT, "case-studies"));
  for (const family of SOFTWARE_FAMILY_DIRS) {
    addFromDir(path.join(JSON_ROOT, family));
  }
  addFromDir(JSON_ROOT);

  return [...slugs].filter((s) => s !== "home");
}

// ponytail: self-check — CCTV local JSON must map when Odoo has no page
{
  const page = buildLocalDevPage("cctv-camera");
  if (!page?.sections?.length) {
    throw new Error("buildLocalDevPage(cctv-camera): expected mapped sections");
  }
  const home = buildLocalHomePage();
  if (!home?.sections?.length) {
    throw new Error("buildLocalHomePage: expected mapped sections from home.json");
  }
}
