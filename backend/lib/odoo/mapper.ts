/**
 * lib/odoo/mapper.ts
 *
 * Converts raw Odoo model records into our internal CMS types.
 * No business logic or hard-coded content here — pure structural mapping.
 */

import type {
  NavigationItem,
  OdooRawMenu,
  OdooRawPage,
  OdooRawView,
  Page,
  Section,
  SEO,
  SiteConfig,
} from "@/types";
import { parseArch } from "./arch-parser";
import {
  isLocalPageJsonInDev,
  loadLocalHomeJson,
  loadLocalPageSectionsJson,
  preferLocalHomeJson,
  preferLocalOurStoryJson,
  preferLocalOurTeamJson,
  preferLocalElvPageJson,
} from "./local-page-json";
import { mapHomepageJson } from "./json-mapper";
import { mapPageJson } from "./page-json-mapper";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function str(v: string | false | undefined | null): string | undefined {
  return v && v !== "false" ? v : undefined;
}

function odooUrlToSlug(url: string): string {
  return url.replace(/^\/+/, "").toLowerCase() || "home";
}

function parseKeywords(raw: string | false | undefined): string[] | undefined {
  if (!raw) return undefined;
  return raw
    .split(/[,;]+/)
    .map((k) => k.trim())
    .filter(Boolean);
}

// ─── website.page → Page ──────────────────────────────────────────────────────
export function mapOdooPage(
  rawPage: OdooRawPage,
  view: OdooRawView | null,
  odooBaseUrl: string,
): Page {
  const seo: SEO = {
    title: str(rawPage.website_meta_title),
    description: str(rawPage.website_meta_description),
    keywords: parseKeywords(rawPage.website_meta_keywords),
    ogImage: str(rawPage.website_meta_og_img),
  };

  let sections: Section[] = [];

  const slug = odooUrlToSlug(rawPage.url);

  // Prefer committed home.json only for the homepage — never overwrite other slugs.
  // Set USE_LOCAL_HOME_JSON=false to force Odoo JSON for `/`.
  if (slug === "home") {
    const localHomeRaw = preferLocalHomeJson() ? loadLocalHomeJson() : null;
    const homeSections =
      mapHomepageJson(localHomeRaw) ?? mapHomepageJson(rawPage.x_homepage_sections_json);
    if (homeSections && homeSections.length > 0) {
      sections = homeSections;
    }
  }

  if (sections.length === 0) {
    const localStoryJson =
      slug === "our-story" && preferLocalOurStoryJson()
        ? loadLocalPageSectionsJson("our-story")
        : null;
    const localTeamJson =
      slug === "our-team" && preferLocalOurTeamJson()
        ? loadLocalPageSectionsJson("our-team")
        : null;
    const localElvJson = preferLocalElvPageJson(slug)
      ? loadLocalPageSectionsJson(slug)
      : null;
    const localJson = isLocalPageJsonInDev() ? loadLocalPageSectionsJson(slug) : null;
    const caseStudiesJson =
      slug === "aptus-case-studies"
        ? (rawPage.x_case_studies_sections_json as string | false | undefined)
        : undefined;
    // Odoo stays source-of-truth. Local JSON is only a dev fallback when Odoo
    // has no JSON content for that page yet. Odoo empty Char/Text is often
    // `false` (not null/undefined) — treat that as missing so local can win.
    // Exception: committed our-story.json wins by default (same pattern as home).
    const odooPageJson =
      typeof caseStudiesJson === "string" && caseStudiesJson.trim()
        ? caseStudiesJson
        : typeof rawPage.x_page_sections_json === "string" &&
            rawPage.x_page_sections_json.trim()
          ? rawPage.x_page_sections_json
          : null;
    const pageJsonRaw =
      localStoryJson ?? localTeamJson ?? localElvJson ?? odooPageJson ?? localJson;
    const pageSections = mapPageJson(pageJsonRaw, { slug });
    if (pageSections && pageSections.length > 0) {
      sections = pageSections;
    } else if (view?.arch) {
      const parsed = parseArch(view.arch, odooBaseUrl);
      if (parsed && parsed.length > 0) {
        sections = parsed;
      }
    }
  }

  return {
    id: String(rawPage.id),
    slug: odooUrlToSlug(rawPage.url),
    title: rawPage.name,
    seo,
    sections,
    publishedAt: str(rawPage.date_publish),
    updatedAt: str(rawPage.write_date),
  };
}

// ─── website.menu → NavigationItem[] (tree) ───────────────────────────────────
export function mapOdooMenuTree(menus: OdooRawMenu[]): NavigationItem[] {
  // Build an id → record map
  const byId = new Map<number, OdooRawMenu>(menus.map((m) => [m.id, m]));

  // Determine root items (no parent, or parent not in list)
  const roots = menus.filter(
    (m) => !m.parent_id || !byId.has(m.parent_id[0]),
  );

  function mapItem(raw: OdooRawMenu, depth = 0): NavigationItem {
    const children: NavigationItem[] = raw.child_id
      .map((childId) => byId.get(childId))
      .filter((child): child is OdooRawMenu => !!child && depth < 3)
      .sort((a, b) => a.sequence - b.sequence)
      .map((child) => mapItem(child, depth + 1));

    return {
      label: raw.name,
      href: str(raw.url) ?? "#",
      children: children.length > 0 ? children : undefined,
    };
  }

  // Odoo wraps a website's navbar in a structural root menu ("Top Menu for
  // Website N", url "#") whose children are the real nav items. Promote those
  // children to the top level. A root that is itself a real link (has a url) is
  // kept as-is; an empty structural wrapper (no children, no url) is dropped so
  // callers fall back to default navigation.
  const topLevel: OdooRawMenu[] = [];
  for (const root of roots) {
    const childMenus = root.child_id
      .map((id) => byId.get(id))
      .filter((c): c is OdooRawMenu => !!c);

    const url = str(root.url);
    if (childMenus.length > 0) {
      topLevel.push(...childMenus);
    } else if (url && url !== "#") {
      topLevel.push(root);
    }
    // else: empty structural wrapper (e.g. "Top Menu for Website 7") → drop,
    // so buildSiteConfig falls back to default navigation.
  }

  return topLevel
    .sort((a, b) => a.sequence - b.sequence)
    .map((item) => mapItem(item, 1));
}

// ─── Build SiteConfig from Odoo data + mock defaults ─────────────────────────
export function buildSiteConfig(
  navigation: NavigationItem[],
  websiteName: string,
  /** Pass the existing mock siteConfig as default for topBar, footer, etc. */
  defaults: SiteConfig,
): SiteConfig {
  return {
    ...defaults,
    name: websiteName || defaults.name,
    navigation: navigation.length > 0 ? navigation : defaults.navigation,
  };
}

// ponytail: self-check — empty Odoo nav must not wipe mock defaults
const _navFallback = buildSiteConfig([], "X", {
  name: "X",
  navigation: [{ label: "Home", href: "/" }],
} as SiteConfig);
if (_navFallback.navigation.length === 0) {
  throw new Error("buildSiteConfig must fall back to defaults.navigation");
}

// ─── website.page[] → slug set ───────────────────────────────────────────────
export function extractSlugs(pages: OdooRawPage[]): string[] {
  return pages
    .filter((p) => p.is_published || p.website_published)
    .map((p) => odooUrlToSlug(p.url))
    .filter((s) => s !== "home");
}
