import { unstable_cache } from "next/cache";
import { getCmsRevalidateSec } from "@/lib/cms/revalidate";
import { getOdooConfig, isOdooConfigured } from "../../config";
import { logger } from "../../logger";
import { getOdooClient } from "../client";
import type { CmsPageContent, OdooWebsitePageRecord } from "@/types/cms";
import { getHomepageJsonFieldName } from "@/lib/cms/homepage-json";
import { getCaseStudiesJsonFieldName } from "@/lib/cms/case-studies-json";
import { getElvJsonFieldName } from "@/lib/cms/elv-json";
import { getSoftwareJsonFieldName } from "@/lib/cms/software-json";
import { pickPageHtml, rewriteOdooHtml, sanitizeOdooCmsHtml } from "./rewrite-html";

const BASE_PAGE_FIELDS = [
  "name",
  "url",
  "arch_db",
  "arch",
  "website_meta_title",
  "website_meta_description",
  "is_published",
  "website_published",
  "header_visible",
  "footer_visible",
  "website_id",
] as const;

function getPageFields(...extraFields: string[]): string[] {
  const fields = new Set<string>([...BASE_PAGE_FIELDS]);
  for (const field of extraFields) {
    if (field) fields.add(field);
  }
  return [...fields];
}

function extractSectionsJson(
  page: OdooWebsitePageRecord,
  jsonFieldName: string,
): string | null {
  const rawJson = page[jsonFieldName as keyof OdooWebsitePageRecord];
  return typeof rawJson === "string" && rawJson.trim() ? rawJson.trim() : null;
}

/** Ignore stub website.page rows (Odoo often has multiple "/" records). */
export const MIN_CMS_HTML_LENGTH = 200;

function getCmsWebsiteId(): number | null {
  const raw = process.env.ODOO_CMS_WEBSITE_ID?.trim();
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function getCmsHomePageId(): number | null {
  const raw = process.env.ODOO_CMS_HOME_PAGE_ID?.trim();
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function getCmsElvPageId(): number | null {
  const raw = process.env.ODOO_CMS_ELV_PAGE_ID?.trim();
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function getCmsSoftwarePageId(): number | null {
  const raw = process.env.ODOO_CMS_SOFTWARE_PAGE_ID?.trim();
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function getCmsCaseStudiesPageId(): number | null {
  const raw = process.env.ODOO_CMS_CASE_STUDIES_PAGE_ID?.trim();
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function getPinnedPageId(jsonFieldName?: string): number | null {
  if (jsonFieldName === getElvJsonFieldName()) {
    return getCmsElvPageId();
  }
  if (jsonFieldName === getSoftwareJsonFieldName()) {
    return getCmsSoftwarePageId();
  }
  if (jsonFieldName === getCaseStudiesJsonFieldName()) {
    return getCmsCaseStudiesPageId();
  }
  if (!jsonFieldName || jsonFieldName === getHomepageJsonFieldName()) {
    return getCmsHomePageId();
  }
  return null;
}

function pickBestCmsPage(
  rows: OdooWebsitePageRecord[],
  odooBaseUrl: string,
  jsonFieldName?: string,
  pinnedPageIdOverride?: number,
): CmsPageContent | null {
  const allowUnpublished = includeUnpublishedPages();
  const pinnedPageId = pinnedPageIdOverride ?? getPinnedPageId(jsonFieldName);
  let pool = rows.filter((row) => allowUnpublished || isPagePublished(row));
  if (!pool.length) return null;

  const websiteId = getCmsWebsiteId();
  if (websiteId) {
    const onWebsite = pool.filter((row) => {
      const rowWebsiteId = Array.isArray(row.website_id) ? row.website_id[0] : row.website_id;
      return rowWebsiteId === websiteId;
    });
    if (onWebsite.length) pool = onWebsite;
  }

  if (pinnedPageId) {
    const pinned = pool.find((row) => row.id === pinnedPageId);
    if (pinned) {
      return mapPageRecord(pinned, odooBaseUrl, jsonFieldName);
    }
  }

  let best: CmsPageContent | null = null;
  let bestPublished = false;

  for (const page of pool) {
    const mapped = mapPageRecord(page, odooBaseUrl, jsonFieldName);
    const hasUsableContent =
      mapped &&
      (mapped.html.length >= MIN_CMS_HTML_LENGTH || Boolean(mapped.sectionsJson));
    if (!hasUsableContent || !mapped) continue;

    const published = isPagePublished(page);
    const preferRichestDraft =
      allowUnpublished &&
      process.env.ODOO_CMS_PREFER_PUBLISHED !== "true";

    if (preferRichestDraft) {
      if (!best || mapped.html.length > best.html.length) {
        best = mapped;
        bestPublished = published;
      }
      continue;
    }

    if (
      !best ||
      (published && !bestPublished) ||
      (published === bestPublished && mapped.html.length > best.html.length)
    ) {
      best = mapped;
      bestPublished = published;
    }
  }

  return best;
}

function getHomePageUrlCandidates(): string[] {
  const fromEnv = process.env.ODOO_CMS_HOME_URL?.trim();
  if (fromEnv) return [fromEnv, "/"];
  return ["/", ""];
}

function includeUnpublishedPages(): boolean {
  return process.env.ODOO_CMS_INCLUDE_UNPUBLISHED === "true";
}

function isPagePublished(page: OdooWebsitePageRecord): boolean {
  return Boolean(page.is_published || page.website_published);
}

function mapPageRecord(
  page: OdooWebsitePageRecord,
  odooBaseUrl: string,
  jsonFieldName?: string,
): CmsPageContent | null {
  const rawHtml = pickPageHtml(page);
  if (!rawHtml) return null;

  const metaTitle =
    typeof page.website_meta_title === "string" && page.website_meta_title.trim()
      ? page.website_meta_title.trim()
      : null;
  const metaDescription =
    typeof page.website_meta_description === "string" && page.website_meta_description.trim()
      ? page.website_meta_description.trim()
      : null;

  const sectionsJson = jsonFieldName ? extractSectionsJson(page, jsonFieldName) : null;

  return {
    id: page.id,
    name: page.name,
    url: typeof page.url === "string" && page.url ? page.url : "/",
    html: sanitizeOdooCmsHtml(rewriteOdooHtml(rawHtml, odooBaseUrl)),
    metaTitle,
    metaDescription,
    sectionsJson,
    source: "odoo",
    odooBaseUrl,
  };
}

function buildCmsWebsiteDomain(
  baseDomain: Array<[string, string, unknown]>,
): Array<[string, string, unknown]> | Array<string | [string, string, unknown]> {
  const websiteId = getCmsWebsiteId();
  if (!websiteId) return baseDomain;
  return [...baseDomain, ["website_id", "=", websiteId]];
}

function buildPublishedPagesDomain(): Array<string | [string, string, unknown]> {
  const published: Array<string | [string, string, unknown]> = [
    "|",
    ["is_published", "=", true],
    ["website_published", "=", true],
  ];
  const websiteId = getCmsWebsiteId();
  if (!websiteId) return published;
  return ["&", ...published, ["website_id", "=", websiteId]];
}

async function fetchOdooPageByUrlUncached(
  url: string,
  jsonFieldName?: string,
  pinnedPageId?: number,
): Promise<CmsPageContent | null> {
  if (!isOdooConfigured()) return null;

  const client = getOdooClient();
  if (!client) return null;

  const { baseUrl } = getOdooConfig();

  try {
    const rows = await client.searchRead<OdooWebsitePageRecord>(
      "website.page",
      buildCmsWebsiteDomain([["url", "=", url]]),
      getPageFields(...(jsonFieldName ? [jsonFieldName] : [])),
      10,
    );

    if (!rows.length) return null;

    return pickBestCmsPage(rows, baseUrl, jsonFieldName, pinnedPageId);
  } catch (error) {
    logger.error("Failed to fetch Odoo website page", {
      action: "cms.page.fetch_failed",
      url,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function fetchOdooHomePageUncached(): Promise<CmsPageContent | null> {
  if (!isOdooConfigured()) return null;

  const client = getOdooClient();
  if (!client) return null;

  const { baseUrl } = getOdooConfig();
  const candidates = getHomePageUrlCandidates();

  try {
    const rows = await client.searchRead<OdooWebsitePageRecord>(
      "website.page",
      buildCmsWebsiteDomain([["url", "in", candidates]]),
      getPageFields(getHomepageJsonFieldName()),
      20,
    );

    if (!rows.length) {
      logger.info("No Odoo home page found", {
        action: "cms.home.not_found",
        candidates,
      });
      return null;
    }

    const best = pickBestCmsPage(rows, baseUrl, getHomepageJsonFieldName());
    if (!best) {
      logger.info("No usable Odoo home page HTML (all candidates too short)", {
        action: "cms.home.empty",
        candidates,
        count: rows.length,
        websiteId: getCmsWebsiteId(),
      });
    } else {
      logger.info("Selected Odoo home page", {
        action: "cms.home.selected",
        pageId: best.id,
        htmlLength: best.html.length,
        websiteId: getCmsWebsiteId(),
      });
    }
    return best;
  } catch (error) {
    logger.error("Failed to fetch Odoo home page", {
      action: "cms.home.fetch_failed",
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function getCmsCacheSalt(): string {
  const { baseUrl, db } = getOdooConfig();
  return [
    baseUrl,
    db,
    getCmsWebsiteId() ?? "",
    getCmsHomePageId() ?? "",
    includeUnpublishedPages(),
    process.env.ODOO_CMS_PREFER_PUBLISHED ?? "",
  ].join("|");
}

async function withCmsCache<T>(
  keyParts: string[],
  tags: string[],
  fetcher: () => Promise<T>,
): Promise<T> {
  const revalidate = getCmsRevalidateSec();
  if (revalidate === 0) {
    return fetcher();
  }

  return unstable_cache(fetcher, keyParts, { revalidate, tags })();
}

export async function fetchOdooHomePage(): Promise<CmsPageContent | null> {
  return withCmsCache(
    ["odoo-cms-home-page", getCmsCacheSalt()],
    ["cms:home"],
    fetchOdooHomePageUncached,
  );
}

export async function fetchOdooPageByUrl(
  url: string,
  jsonFieldName?: string,
  pinnedPageId?: number,
): Promise<CmsPageContent | null> {
  const normalized = url.startsWith("/") ? url : `/${url}`;
  const cacheKey = [jsonFieldName ?? "html-only", pinnedPageId ?? ""].join(":");
  return withCmsCache(
    ["odoo-cms-page", normalized, cacheKey, getCmsCacheSalt()],
    [`cms:page:${normalized}`],
    () => fetchOdooPageByUrlUncached(normalized, jsonFieldName, pinnedPageId),
  );
}

async function listOdooCmsPageUrlsUncached(): Promise<string[]> {
  if (!isOdooConfigured()) return [];

  const client = getOdooClient();
  if (!client) return [];

  try {
    const domain = includeUnpublishedPages()
      ? getCmsWebsiteId()
        ? [["website_id", "=", getCmsWebsiteId()!]]
        : []
      : buildPublishedPagesDomain();

    const rows = await client.searchRead<Pick<OdooWebsitePageRecord, "url">>(
      "website.page",
      domain,
      ["url"],
      500,
    );

    const seen = new Set<string>();
    const urls: string[] = [];

    for (const row of rows) {
      const url = typeof row.url === "string" ? row.url.trim() : "";
      if (!url || url === "/" || seen.has(url)) continue;
      seen.add(url);
      urls.push(url);
    }

    return urls;
  } catch (error) {
    logger.error("Failed to list Odoo website pages", {
      action: "cms.pages.list_failed",
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/** All website.page URLs — used for static path generation at build time. */
export async function listOdooCmsPageUrls(): Promise<string[]> {
  return withCmsCache(
    ["odoo-cms-page-urls", getCmsCacheSalt()],
    ["cms:pages"],
    listOdooCmsPageUrlsUncached,
  );
}
