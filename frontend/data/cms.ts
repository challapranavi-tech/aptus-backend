/**
 * Frontend CMS client — fetches page data from @aptus/backend over HTTP.
 *
 * Set APTUS_API_URL to the deployed backend (e.g. https://api.aptusinfotech.com).
 * Local dev default: http://localhost:3001
 */

import { cache } from "react";
import type { Page, SiteConfig } from "@/types";
import type { CaseStudiesPageContent } from "@/types/case-studies-page";
import { SITE_NAVIGATION } from "./site-nav";
import { filterSiteNavigation } from "./autodesk-subnav";

const DEFAULT_API = "http://localhost:3001";
// Odoo cold-start auth takes ~7 s; 5 s caused a race where the timeout fired
// before auth completed → frontend received null → notFound() → 404 flash on
// first page load after a backend restart. 15 s gives ample headroom.
const API_TIMEOUT_MS = 15_000;

function apiBase(): string {
  return (process.env.APTUS_API_URL ?? DEFAULT_API).replace(/\/$/, "");
}

/** Skip localhost fetches during `next build` — use APTUS_API_URL with a deployed backend for SSG. */
function apiEnabled(): boolean {
  const url = apiBase();
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(url);
  if (process.env.NEXT_PHASE === "phase-production-build" && isLocalhost) {
    return false;
  }
  return true;
}

function fallbackSiteConfig(): SiteConfig {
  return {
    name: "Aptus Infotech",
    logo: { src: "/logo.svg", alt: "Aptus Infotech" },
    navigation: filterSiteNavigation(SITE_NAVIGATION),
    topBar: { phone: "", email: "", socialLinks: [] },
    footer: {
      logo: { src: "/logo.svg", alt: "Aptus Infotech" },
      tagline: "",
      columns: [],
    },
  };
}

async function apiGet<T>(path: string, revalidate = 60): Promise<T | null> {
  if (!apiEnabled()) return null;

  const url = `${apiBase()}${path}`;
  try {
    const res = await fetch(url, {
      next: { revalidate },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[cms] ${url} → ${res.status}`);
      }
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[cms] ${url} failed:`, err);
    }
    return null;
  }
}

// cache() deduplicates calls within a single server request — so generateMetadata
// and the page component both calling getPageBySlug() with the same slug produce
// exactly one HTTP round-trip to the backend, not two.
export const getSiteConfig = cache(async function getSiteConfig(): Promise<SiteConfig> {
  const config = await apiGet<SiteConfig>("/api/cms/site-config");
  return config ?? fallbackSiteConfig();
});

export async function getHomePage(): Promise<Page | null> {
  return apiGet<Page>("/api/cms/home");
}

export const getPageBySlug = cache(async function getPageBySlug(slug: string): Promise<Page | null> {
  return apiGet<Page>(`/api/cms/pages/${encodeURIComponent(slug)}`);
});

export async function getAllPageSlugs(): Promise<string[]> {
  const data = await apiGet<{ slugs: string[] }>("/api/cms/slugs");
  return data?.slugs ?? [];
}

export async function getAllPages(): Promise<Page[]> {
  const slugs = await getAllPageSlugs();
  const pages = await Promise.all(slugs.map((slug) => getPageBySlug(slug)));
  return pages.filter((p): p is Page => p !== null);
}

export async function loadCaseStudiesPageContent(): Promise<CaseStudiesPageContent | null> {
  return apiGet<CaseStudiesPageContent>("/api/cms/case-studies");
}
