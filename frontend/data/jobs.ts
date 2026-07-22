/**
 * Server-side careers data — fetches jobs from @aptus/backend over HTTP.
 * Mirrors the CMS client (data/cms.ts) so SSR/SEO share one API base.
 */
import type { CareerJob, JobListResult } from "@shared/lib/career-jobs";
import { unstable_noStore as noStore } from "next/cache";

const DEFAULT_API = "http://localhost:3001";
const API_TIMEOUT_MS = 15_000;

export const CAREERS_JOBS_CACHE_TAG = "careers-jobs";

function apiBase(): string {
  return (process.env.APTUS_API_URL ?? DEFAULT_API).replace(/\/$/, "");
}

function apiEnabled(): boolean {
  const url = apiBase();
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(url);
  if (process.env.NEXT_PHASE === "phase-production-build" && isLocalhost) {
    return false;
  }
  return true;
}

async function apiGet<T>(path: string): Promise<T | null> {
  if (!apiEnabled()) return null;
  const url = `${apiBase()}${path}`;
  try {
    // ponytail: no-store — job publish/unpublish must show on /careers immediately.
    // ISR page cache is still busted via revalidatePath('/careers').
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
    // Genuine missing job — safe for notFound().
    if (res.status === 404) return null;
    // Transient backend/Odoo failure — throw so the detail page does NOT fake a 404.
    if (!res.ok) {
      throw new Error(`[careers] ${url} → HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("[careers]")) throw err;
    // Timeout / network / JSON — also must not become notFound().
    throw new Error(
      `[careers] ${url} failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export async function getJobList(
  params: Record<string, string | number | undefined> = {},
): Promise<JobListResult | null> {
  noStore();
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const qs = sp.toString();
  try {
    return await apiGet<JobListResult>(`/api/careers/jobs${qs ? `?${qs}` : ""}`);
  } catch (err) {
    // Listing SSR soft-fails — CareersListing retries client-side.
    if (process.env.NODE_ENV !== "production") {
      console.warn(err);
    }
    return null;
  }
}

export async function getJob(slug: string): Promise<CareerJob | null> {
  noStore();
  // Transient API failure throws (do not fake notFound). Genuine 404 → null.
  const data = await apiGet<{ job: CareerJob }>(
    `/api/careers/jobs/${encodeURIComponent(slug)}`,
  );
  return data?.job ?? null;
}

export async function getAllJobSlugs(): Promise<string[]> {
  const list = await getJobList({ pageSize: 48 });
  return list?.jobs.map((j) => j.slug) ?? [];
}
