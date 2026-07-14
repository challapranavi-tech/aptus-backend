/**
 * Server-side careers data — fetches jobs from @aptus/backend over HTTP.
 * Mirrors the CMS client (data/cms.ts) so SSR/SEO share one API base.
 */
import type { CareerJob, JobListResult } from "@shared/lib/career-jobs";

const DEFAULT_API = "http://localhost:3001";
const API_TIMEOUT_MS = 15_000;

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
    const res = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[careers] ${url} failed:`, err);
    }
    return null;
  }
}

export async function getJobList(
  params: Record<string, string | number | undefined> = {},
): Promise<JobListResult | null> {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const qs = sp.toString();
  return apiGet<JobListResult>(`/api/careers/jobs${qs ? `?${qs}` : ""}`);
}

export async function getJob(slug: string): Promise<CareerJob | null> {
  const data = await apiGet<{ job: CareerJob }>(
    `/api/careers/jobs/${encodeURIComponent(slug)}`,
  );
  return data?.job ?? null;
}

export async function getAllJobSlugs(): Promise<string[]> {
  const list = await getJobList({ pageSize: 48 });
  return list?.jobs.map((j) => j.slug) ?? [];
}
