/**
 * Frontend CMS client — fetches page data from @aptus/backend over HTTP.
 *
 * Set APTUS_API_URL to the deployed backend (e.g. https://api.aptusinfotech.com).
 * Local dev default: http://localhost:3001
 */

import { cache } from "react";
import type { Page, SiteConfig } from "@/types";
import type { CaseStudiesPageContent } from "@/types/case-studies-page";
import { SITE_CONFIG } from "./site-config";

const DEFAULT_API = "http://localhost:3001";
// Cold /api/cms/home can take ~13 s (Odoo auth + page + draft fallback) and
// first-hit Next compile adds more. 15 s aborted that race; metadata + page
// both call getHomePage so React cache() keeps it to one fetch per request.
const API_TIMEOUT_MS = 90_000;

function apiBase(): string {
  return (process.env.APTUS_API_URL ?? DEFAULT_API).replace(/\/$/, "");
}

function isLocalhostUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(url);
}

/**
 * Vercel + localhost API = every page 404s. Fail loud so the deploy is fixable
 * instead of looking like "missing content".
 */
function assertDeployableApiBase(url: string): void {
  if (process.env.VERCEL !== "1") return;
  if (!isLocalhostUrl(url)) return;
  throw new Error(
    `[cms] APTUS_API_URL is localhost (${url}). In Vercel → Settings → Environment Variables set APTUS_API_URL and NEXT_PUBLIC_API_URL to your deployed backend HTTPS URL (not Odoo /odoo/website).`,
  );
}

/** Skip localhost fetches during `next build` — use APTUS_API_URL with a deployed backend for SSG. */
function apiEnabled(): boolean {
  const url = apiBase();
  const isLocalhost = isLocalhostUrl(url);
  if (process.env.NEXT_PHASE === "phase-production-build" && isLocalhost) {
    return false;
  }
  return true;
}

function fallbackSiteConfig(): SiteConfig {
  return SITE_CONFIG;
}

async function apiGet<T>(path: string): Promise<T | null> {
  if (!apiEnabled()) return null;

  const base = apiBase();
  assertDeployableApiBase(base);

  const url = `${base}${path}`;
  try {
    const res = await fetch(url, {
      // ponytail: in dev, no-store avoids sticky 404 when backend/Odoo is slow on first hit
      ...(process.env.NODE_ENV === "production"
        ? { next: { revalidate: 300 } }
        : { cache: "no-store" as RequestCache }),
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });

    // Genuine missing page — safe to treat as notFound() (and cache briefly).
    if (res.status === 404) return null;

    // Transient backend/Odoo failure — throw so Next does NOT cache a 404 for 300s.
    if (!res.ok) {
      throw new Error(`[cms] ${url} → HTTP ${res.status}`);
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("[cms]")) throw err;
    // Timeout / network / JSON — also must not become a sticky notFound().
    throw new Error(
      `[cms] ${url} failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  // Nav / footer / top bar are code-owned (see site-nav.ts). Skipping the
  // frontend→backend hop removes a blocking RTT from every page SSR.
  return fallbackSiteConfig();
});

export const getHomePage = cache(async (): Promise<Page | null> => {
  // Prefer committed frontend home.json so Vercel frontend deploys show the
  // redesign without depending on a separate backend/Odoo seed.
  const { buildLocalHomePage } = await import("@/lib/build-local-home-page");
  const local = buildLocalHomePage();
  if (local?.sections.length) return local;

  return apiGet<Page>("/api/cms/home");
});

export const getPageBySlug = cache(async (slug: string): Promise<Page | null> => {
  // Committed frontend JSON for Our Story — do not wait on backend/Odoo (same as home).
  if (slug === "our-story") {
    const { buildLocalOurStoryPage } = await import("@/lib/build-local-our-story-page");
    const local = buildLocalOurStoryPage();
    if (local?.sections.length) return local;
  }

  if (slug === "aptus-policy") {
    const { buildLocalAptusPolicyPage } = await import("@/lib/build-local-aptus-policy-page");
    const local = buildLocalAptusPolicyPage();
    if (local?.sections.length) return local;
  }

  return apiGet<Page>(`/api/cms/pages/${encodeURIComponent(slug)}`);
});

export async function getAllPageSlugs(): Promise<string[]> {
  try {
    const data = await apiGet<{ slugs: string[] }>("/api/cms/slugs");
    return data?.slugs ?? [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function getAllPages(): Promise<Page[]> {
  const slugs = await getAllPageSlugs();
  const pages = await Promise.all(
    slugs.map(async (slug) => {
      try {
        return await getPageBySlug(slug);
      } catch {
        return null;
      }
    }),
  );
  return pages.filter((p): p is Page => p !== null);
}

export const loadCaseStudiesPageContent = cache(
  async (): Promise<CaseStudiesPageContent | null> => {
    const { buildLocalCaseStudiesPageContent } = await import("@/lib/build-local-case-studies-page");
    const local = buildLocalCaseStudiesPageContent();
    if (local?.keyProjects?.items?.length) return local;

    return apiGet<CaseStudiesPageContent>("/api/cms/case-studies");
  },
);
