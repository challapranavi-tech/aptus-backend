/**
 * Frontend CMS client — fetches page data from @aptus/backend over HTTP.
 *
 * Set APTUS_API_URL to the deployed backend (e.g. https://api.aptusinfotech.com).
 * Local dev default: http://localhost:3001
 */

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

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const config = await apiGet<SiteConfig>("/api/cms/site-config");
    return config ?? fallbackSiteConfig();
  } catch (err) {
    // Chrome must still render if CMS is down.
    console.error(err);
    return fallbackSiteConfig();
  }
}

export async function getHomePage(): Promise<Page | null> {
  return apiGet<Page>("/api/cms/home");
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  return apiGet<Page>(`/api/cms/pages/${encodeURIComponent(slug)}`);
}

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

export async function loadCaseStudiesPageContent(): Promise<CaseStudiesPageContent | null> {
  return apiGet<CaseStudiesPageContent>("/api/cms/case-studies");
}
