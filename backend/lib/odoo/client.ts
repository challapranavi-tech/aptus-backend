/**
 * lib/odoo/client.ts
 *
 * High-level OdooClient wrapping the JSON-RPC session.
 *
 * Usage:
 *   const client = await OdooClient.create();  // reads env vars
 *   const pages  = await client.getAllPages();
 *   const config = await client.getSiteConfig(defaults);
 *
 * Environment variables required:
 *   ODOO_URL      – base URL  e.g. https://aptusinfotech-staging-33910464.dev.odoo.com
 *   ODOO_DB       – database  e.g. aptusinfotech-staging-33910464
 *   ODOO_USER     – login     e.g. admin@aptusinfotech.com
 *   ODOO_API_KEY  – API key   (Odoo → Preferences → Account Security → API Keys)
 *
 * Optional:
 *   ODOO_REVALIDATE – ISR cache TTL in seconds (default: 60)
 *   ODOO_WEBSITE_ID – restrict to a specific Odoo website (default: 1)
 */

import type {
  OdooRawMenu,
  OdooRawPage,
  OdooRawView,
  Page,
  SiteConfig,
} from "@/types";
import { isOdooPagePublished } from "@shared/lib/object-access";
import { unstable_cache } from "next/cache";
import {
  buildSiteConfig,
  extractSlugs,
  mapOdooMenuTree,
  mapOdooPage,
} from "./mapper";
import {
  authenticate,
  getVersionInfo,
  OdooRpcError,
  read,
  searchRead,
  type OdooDomain,
  type OdooRpcSession,
  type OdooVersionInfo,
} from "./rpc";

/** Cache tag for all Odoo-backed CMS payloads — bust via revalidateTag("odoo"). */
export const ODOO_CACHE_TAG = "odoo";

function pageCacheTag(slug: string): string {
  return `odoo-page-${slug}`;
}

/**
 * Domain fragment: page must be public on this website.
 * security: applied on every public slug/id read so drafts are not IDOR'd.
 */
function publishedOnWebsite(websiteId: number): OdooDomain {
  return [
    ["website_id", "=", websiteId],
    "|",
    ["is_published", "=", true],
    ["website_published", "=", true],
  ];
}

// ─── Config from env ──────────────────────────────────────────────────────────
export function odooConfigFromEnv() {
  return {
    url: process.env.ODOO_URL ?? "",
    db: process.env.ODOO_DB ?? "",
    user: process.env.ODOO_USER ?? "",
    apiKey: process.env.ODOO_API_KEY ?? "",
    revalidate: Number(process.env.ODOO_REVALIDATE ?? "60"),
    websiteId: Number(process.env.ODOO_WEBSITE_ID ?? "1"),
  };
}

/** Returns true if all required env vars are present and non-empty. */
export function isOdooConfigured(): boolean {
  const { url, db, user, apiKey } = odooConfigFromEnv();
  return Boolean(url && db && user && apiKey);
}

// ─── Website.page fields we always fetch ─────────────────────────────────────
const PAGE_FIELDS: (keyof OdooRawPage)[] = [
  "id",
  "name",
  "url",
  "is_published",
  "website_published",
  "website_meta_title",
  "website_meta_description",
  "website_meta_keywords",
  "website_meta_og_img",
  "view_id",
  "website_id",
  "date_publish",
  "write_date",
  "x_homepage_sections_json",
  "x_page_sections_json",
  "x_case_studies_sections_json",
];

const MENU_FIELDS: (keyof OdooRawMenu)[] = [
  "id",
  "name",
  "url",
  "parent_id",
  "child_id",
  "sequence",
  "is_mega_menu",
  "website_id",
];

const VIEW_FIELDS: (keyof OdooRawView)[] = ["id", "name", "arch", "arch_base"];

// ─── OdooClient ───────────────────────────────────────────────────────────────
export class OdooClient {
  private constructor(
    private readonly session: OdooRpcSession,
    private readonly websiteId: number,
  ) {}

  // ── Factory ────────────────────────────────────────────────────────────────
  static async create(
    overrides: Partial<ReturnType<typeof odooConfigFromEnv>> = {},
  ): Promise<OdooClient> {
    const cfg = { ...odooConfigFromEnv(), ...overrides };

    if (!cfg.url || !cfg.db || !cfg.user || !cfg.apiKey) {
      throw new OdooRpcError(
        "Odoo is not configured. Set ODOO_URL, ODOO_DB, ODOO_USER and ODOO_API_KEY.",
        undefined,
        -1,
      );
    }

    const session = await authenticate(
      cfg.url,
      cfg.db,
      cfg.user,
      cfg.apiKey,
      cfg.revalidate,
    );

    return new OdooClient(session, cfg.websiteId);
  }

  // ── Version ────────────────────────────────────────────────────────────────
  static async version(url: string): Promise<OdooVersionInfo> {
    return getVersionInfo(url);
  }

  // ── Pages ──────────────────────────────────────────────────────────────────

  private async fetchView(viewId: number): Promise<OdooRawView | null> {
    const views = await read<OdooRawView>(
      this.session,
      "ir.ui.view",
      [viewId],
      VIEW_FIELDS as string[],
    );
    return views[0] ?? null;
  }

  /**
   * Fetches all published website pages from Odoo.
   * `fallbackSections` are used when arch parsing produces no sections.
   */
  async getAllPages(): Promise<Page[]> {
    const rawPages = await searchRead<OdooRawPage>(
      this.session,
      "website.page",
      publishedOnWebsite(this.websiteId),
      { fields: PAGE_FIELDS as string[], limit: 200, order: "name asc" },
    );

    const pages: Page[] = [];
    for (const raw of rawPages) {
      const viewId = Array.isArray(raw.view_id) ? raw.view_id[0] : null;
      const view = viewId ? await this.fetchView(viewId) : null;
      pages.push(mapOdooPage(raw, view, this.session.url));
    }

    return pages;
  }

  /**
   * Fetches a single page by URL slug.
   * @param slug  "home" | "about-us" | etc. (without leading slash)
   *
   * Responses are cached with `unstable_cache` (not fetch Data Cache) so the
   * Odoo API key never lands in Next's on-disk request cache. Bust with
   * revalidateTag("odoo") / revalidateTag(`odoo-page-${slug}`).
   */
  async getPageBySlug(slug: string): Promise<Page | null> {
    const websiteId = this.websiteId;
    const ttl = this.session.revalidate;
    return unstable_cache(
      async () => {
        const client = await OdooClient.create();
        return client.loadPageBySlug(slug);
      },
      ["odoo-page", String(websiteId), slug],
      { revalidate: ttl, tags: [ODOO_CACHE_TAG, pageCacheTag(slug)] },
    )();
  }

  /**
   * Uncached page load — used by getPageBySlug cache miss.
   *
   * security (OWASP API1 / object-level auth): the caller-supplied slug is an
   * object identifier. Only return the page if it belongs to this website AND
   * is published. Unpublished/draft pages must 404 the same as missing pages
   * so guessing slugs cannot leak unpublished content.
   */
  async loadPageBySlug(slug: string): Promise<Page | null> {
    const url = slug === "home" ? "/" : `/${slug}`;

    const rawPages = await searchRead<OdooRawPage>(
      this.session,
      "website.page",
      [...publishedOnWebsite(this.websiteId), ["url", "=", url]],
      { fields: PAGE_FIELDS as string[], limit: 1 },
    );

    const raw = rawPages[0];
    // Defense in depth if Odoo domain operators differ by version.
    if (!raw || !isOdooPagePublished(raw)) return null;

    const viewId = Array.isArray(raw.view_id) ? raw.view_id[0] : null;
    const view = viewId ? await this.fetchView(viewId) : null;

    return mapOdooPage(raw, view, this.session.url);
  }

  /**
   * Local/staging preview only: load website home (`/`) even when unpublished.
   * security: never call from production paths — drafts must stay 404 on live.
   */
  async loadDraftHomePage(): Promise<Page | null> {
    if (process.env.NODE_ENV === "production") return null;

    const rawPages = await searchRead<OdooRawPage>(
      this.session,
      "website.page",
      [
        ["website_id", "=", this.websiteId],
        ["url", "=", "/"],
      ],
      { fields: PAGE_FIELDS as string[], limit: 1 },
    );

    const raw = rawPages[0];
    if (!raw) return null;

    const viewId = Array.isArray(raw.view_id) ? raw.view_id[0] : null;
    const view = viewId ? await this.fetchView(viewId) : null;
    return mapOdooPage(raw, view, this.session.url);
  }

  /**
   * Returns slugs of all published pages (used by generateStaticParams).
   */
  async getAllSlugs(): Promise<string[]> {
    const websiteId = this.websiteId;
    const ttl = this.session.revalidate;
    return unstable_cache(
      async () => {
        const client = await OdooClient.create();
        return client.loadAllSlugs();
      },
      ["odoo-slugs", String(websiteId)],
      { revalidate: ttl, tags: [ODOO_CACHE_TAG, "odoo-slugs"] },
    )();
  }

  async loadAllSlugs(): Promise<string[]> {
    const rawPages = await searchRead<Pick<OdooRawPage, "id" | "url" | "is_published" | "website_published" | "website_id">>(
      this.session,
      "website.page",
      publishedOnWebsite(this.websiteId),
      { fields: ["id", "url", "is_published", "website_published"], limit: 200 },
    );

    return extractSlugs(rawPages as OdooRawPage[]);
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  async getNavigation() {
    const websiteId = this.websiteId;
    const ttl = this.session.revalidate;
    return unstable_cache(
      async () => {
        const client = await OdooClient.create();
        return client.loadNavigation();
      },
      ["odoo-nav", String(websiteId)],
      { revalidate: ttl, tags: [ODOO_CACHE_TAG, "odoo-nav"] },
    )();
  }

  async loadNavigation() {
    const rawMenus = await searchRead<OdooRawMenu>(
      this.session,
      "website.menu",
      [["website_id", "=", this.websiteId]],
      { fields: MENU_FIELDS as string[], limit: 200, order: "sequence asc" },
    );

    return mapOdooMenuTree(rawMenus);
  }

  // ── SiteConfig ─────────────────────────────────────────────────────────────
  async getSiteConfig(defaults: SiteConfig): Promise<SiteConfig> {
    const navigation = await this.getNavigation();
    return buildSiteConfig(navigation, defaults.name, defaults);
  }

  /**
   * Returns the raw x_case_studies_sections_json string for the
   * aptus-case-studies page, or false/null when not set.
   */
  async getCaseStudiesJson(): Promise<string | false> {
    const websiteId = this.websiteId;
    const ttl = this.session.revalidate;
    return unstable_cache(
      async () => {
        const client = await OdooClient.create();
        return client.loadCaseStudiesJson();
      },
      ["odoo-case-studies-json", String(websiteId)],
      { revalidate: ttl, tags: [ODOO_CACHE_TAG, "odoo-case-studies"] },
    )();
  }

  /**
   * Case-studies JSON for the fixed public URL.
   * security: same published + website scope as loadPageBySlug (object id = URL).
   */
  async loadCaseStudiesJson(): Promise<string | false> {
    const rawPages = await searchRead<
      Pick<OdooRawPage, "x_case_studies_sections_json" | "is_published" | "website_published">
    >(
      this.session,
      "website.page",
      [
        ...publishedOnWebsite(this.websiteId),
        ["url", "=", "/aptus-case-studies"],
      ],
      {
        fields: ["x_case_studies_sections_json", "is_published", "website_published"],
        limit: 1,
      },
    );
    const raw = rawPages[0];
    if (!raw || !isOdooPagePublished(raw)) return false;
    return raw.x_case_studies_sections_json ?? false;
  }

  // ── Raw accessors (for the debug route) ────────────────────────────────────
  /**
   * Debug: all pages on this website (including unpublished).
   * Only callable behind ODOO_DEBUG_TOKEN — not a public object API.
   */
  async rawPages(): Promise<OdooRawPage[]> {
    return searchRead<OdooRawPage>(
      this.session,
      "website.page",
      [["website_id", "=", this.websiteId]],
      { fields: PAGE_FIELDS as string[], limit: 200 },
    );
  }

  async rawMenus(): Promise<OdooRawMenu[]> {
    return searchRead<OdooRawMenu>(
      this.session,
      "website.menu",
      [["website_id", "=", this.websiteId]],
      { fields: MENU_FIELDS as string[], limit: 200 },
    );
  }

  /**
   * Debug: load ir.ui.view by caller-supplied id.
   * security: object-level check — only return the view if it is linked to a
   * website.page on this website. Prevents probing arbitrary view ids in Odoo.
   */
  async rawView(viewId: number): Promise<OdooRawView | null> {
    const linked = await searchRead<{ id: number }>(
      this.session,
      "website.page",
      [
        ["website_id", "=", this.websiteId],
        ["view_id", "=", viewId],
      ],
      { fields: ["id"], limit: 1 },
    );
    if (linked.length === 0) return null;
    return this.fetchView(viewId);
  }
}

// ─── Re-export error class ────────────────────────────────────────────────────
export { OdooRpcError };

// ─── Legacy compat exports ────────────────────────────────────────────────────
export function createOdooClient() {
  return null; // replaced by OdooClient.create()
}

export const odooClient = null;

export function mapOdooPageToPage(): never {
  throw new Error("Use OdooClient.getPageBySlug() instead of mapOdooPageToPage().");
}
