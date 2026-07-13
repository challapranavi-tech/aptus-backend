/**
 * data/cms.ts  —  Odoo-first CMS data layer
 *
 * Priority for every page:
 *   1. Odoo (when configured + Odoo record has sections)
 *   2. Local disk JSON   — fallback for pages not yet seeded to Odoo (dev only)
 *   3. Mock              — fallback when Odoo is unconfigured
 *
 * Layout chrome (nav, footer, top bar) is code-owned — see data/site-nav.ts.
 */

import { OdooClient, OdooRpcError, isOdooConfigured } from "@/lib/odoo";
import {
  buildLocalDevPage,
  isLocalPageJsonInDev,
  listLocalDevPageSlugs,
} from "@/lib/odoo/local-page-json";
import { loadCaseStudiesPageContent } from "@/lib/case-studies-page-content";
import { isAutodeskHiddenSlug } from "@/data/autodesk-subnav";
import type { Page, SiteConfig } from "@/types";
import type { CaseStudiesPageContent } from "@/types/case-studies-page";
import {
  getAllPageSlugs as mockGetAllSlugs,
  getHomePage as mockGetHomePage,
  getPageBySlug as mockGetPageBySlug,
  getSiteConfig as mockGetSiteConfig,
} from "./mock-cms";

let _clientPromise: Promise<OdooClient> | null = null;

function getClient(): Promise<OdooClient> {
  if (!_clientPromise) {
    _clientPromise = OdooClient.create().catch((err) => {
      _clientPromise = null;
      throw err;
    });
  }
  return _clientPromise;
}

/**
 * Drop the cached Odoo service client for this worker.
 *
 * security: call after rotating ODOO_API_KEY / ODOO_USER so a warm Node process
 * cannot keep using the revoked key from an in-memory OdooRpcSession.
 * There is no end-user logout — this is service-credential invalidation only.
 */
export function invalidateOdooClientSession(): void {
  _clientPromise = null;
}

function debugLog(label: string, data: unknown) {
  // security: server-only flag — never use NEXT_PUBLIC_* for debug that may
  // dump CMS payloads (keeps the switch out of the browser bundle).
  if (process.env.DEBUG_ODOO !== "true") return;
  if (process.env.NODE_ENV === "production") return;
  console.log(`\n[odoo:debug] ── ${label} ──`);
  // Never log credentials; mapped page objects do not include API keys.
  console.log(JSON.stringify(data, null, 2));
}

function warnOdoo(fn: string, err: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[cms] Odoo error in ${fn}:`,
      err instanceof OdooRpcError
        ? `${err.message} (HTTP ${err.httpStatus ?? "?"})`
        : String(err),
    );
  }
}

export async function getSiteConfig(): Promise<SiteConfig> {
  return mockGetSiteConfig();
}

export async function getHomePage(): Promise<Page | null> {
  if (!isOdooConfigured()) return mockGetHomePage();

  try {
    const client = await getClient();
    const page = await client.getPageBySlug("home");
    debugLog("Mapped Page [home]", page);
    if (page && page.sections.length > 0) {
      debugLog("Section Structure [home]", page.sections.map((s) => ({ id: s.id, type: s.type, order: s.order })));
      return page;
    }

    // ponytail: staging home (website 7 / id 226) often has JSON but is unpublished.
    // Dev-only draft read so localhost can preview; production stays published-only.
    if (process.env.NODE_ENV !== "production") {
      const draft = await client.loadDraftHomePage();
      if (draft && draft.sections.length > 0) {
        console.warn(
          "[cms] Using unpublished Odoo home for local preview — publish website.page `/` in Odoo to fix live",
        );
        debugLog("Mapped Page [home draft]", draft);
        return draft;
      }
    }

    return page;
  } catch (err) {
    warnOdoo("getHomePage", err);
    return null;
  }
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  // security: hidden product slugs are denied at the data layer (object id = slug).
  if (isAutodeskHiddenSlug(slug)) return null;

  if (!isOdooConfigured()) {
    // No Odoo — local JSON then mock
    if (isLocalPageJsonInDev()) {
      const local = buildLocalDevPage(slug);
      if (local) return local;
    }
    return mockGetPageBySlug(slug);
  }

  try {
    const client = await getClient();
    const page = await client.getPageBySlug(slug);
    debugLog(`Mapped Page [${slug}]`, page);

    // Odoo has content → use it (Odoo is the source of truth)
    if (page && page.sections.length > 0) {
      debugLog(`Section Structure [${slug}]`, page.sections.map((s) => ({ id: s.id, type: s.type, order: s.order })));
      return page;
    }

    // Odoo missing / empty / unpublished → committed local JSON (e.g. unseeded ELV pages)
    const local = buildLocalDevPage(slug);
    if (local) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[cms] Odoo page /${slug} has no sections — falling back to content/odoo-json`,
        );
      }
      return local;
    }

    // Return the Odoo page even with empty sections (page record exists, just no content)
    return page;
  } catch (err) {
    warnOdoo("getPageBySlug", err);
    // Odoo error → committed local JSON
    const local = buildLocalDevPage(slug);
    if (local) return local;
    return null;
  }
}

export async function getCaseStudiesPageContent(): Promise<CaseStudiesPageContent | null> {
  if (!isOdooConfigured()) {
    return loadCaseStudiesPageContent();
  }

  try {
    const client = await getClient();
    const odooJson = await client.getCaseStudiesJson();
    return loadCaseStudiesPageContent(odooJson ?? undefined);
  } catch (err) {
    warnOdoo("getCaseStudiesPageContent", err);
    return loadCaseStudiesPageContent();
  }
}

export async function getAllPageSlugs(): Promise<string[]> {
  const localSlugs = listLocalDevPageSlugs();

  if (!isOdooConfigured()) {
    const mockSlugs = await mockGetAllSlugs();
    return [...new Set([...mockSlugs, ...localSlugs])]
      .filter((s) => s !== "home" && !isAutodeskHiddenSlug(s));
  }

  try {
    const client = await getClient();
    const odooSlugs = await client.getAllSlugs();
    return [...new Set([...odooSlugs, ...localSlugs])]
      .filter((s) => s !== "home" && !isAutodeskHiddenSlug(s));
  } catch (err) {
    warnOdoo("getAllPageSlugs", err);
    return localSlugs.filter((s) => s !== "home" && !isAutodeskHiddenSlug(s));
  }
}

export async function getAllPages(): Promise<Page[]> {
  if (!isOdooConfigured()) {
    const { mockPages } = await import("./mock-cms");
    return mockPages;
  }

  try {
    const client = await getClient();
    return await client.getAllPages();
  } catch (err) {
    warnOdoo("getAllPages", err);
    return [];
  }
}
