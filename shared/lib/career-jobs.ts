/**
 * Job listing types + filter helpers (shared by jobs API and careers UI).
 */
import { stripJobHtml } from "./strip-job-html";

export const JOB_PAGE_SIZE = 12;

// ponytail: only full-time roles for now — no job-type facet/filter.
// Upgrade path: reintroduce a jobType field + filter when other types exist.
export const DEFAULT_JOB_TYPE = "Full-time";

export interface CareerJob {
  id: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  jobType: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  publishedAt?: string;
}

export interface JobFilters {
  q?: string;
  department?: string;
  location?: string;
  page?: number;
  pageSize?: number;
}

export interface JobListResult {
  jobs: CareerJob[];
  total: number;
  page: number;
  pageSize: number;
  departments: string[];
  locations: string[];
}

export function slugifyJobTitle(title: string, id: string | number): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "job"}-${id}`;
}

/** Normalize job text from API — collapses blank-line bloat even if a stale backend lags. */
export function normalizeCareerJob(job: CareerJob): CareerJob {
  return {
    ...job,
    description:
      typeof job.description === "string" ? stripJobHtml(job.description) : "",
  };
}

export function filterJobs(
  jobs: CareerJob[],
  filters: JobFilters,
): JobListResult {
  const q = (filters.q ?? "").trim().toLowerCase();
  const department = (filters.department ?? "").trim().toLowerCase();
  const location = (filters.location ?? "").trim().toLowerCase();
  const pageSize = Math.min(Math.max(filters.pageSize ?? JOB_PAGE_SIZE, 1), 48);
  const page = Math.max(filters.page ?? 1, 1);

  const departments = uniqueSorted(jobs.map((j) => j.department));
  const locations = uniqueSorted(jobs.map((j) => j.location));

  let filtered = jobs;
  if (q) {
    filtered = filtered.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.department.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q),
    );
  }
  if (department) {
    filtered = filtered.filter((j) => j.department.toLowerCase() === department);
  }
  if (location) {
    filtered = filtered.filter((j) => j.location.toLowerCase() === location);
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  return {
    jobs: filtered.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    departments,
    locations,
  };
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}
