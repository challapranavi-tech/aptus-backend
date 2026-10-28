/**
 * Job listing types + filter helpers (shared by jobs API and careers UI).
 */
import { sanitizeJobHtml } from "./sanitize-job-html";
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
  /** Plain text for cards / search (HTML stripped). */
  description: string;
  /** Sanitized HTML for the job detail page (from Odoo description fields). */
  descriptionHtml?: string;
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

/** True when the string still has markup worth rendering as HTML. */
function looksLikeHtml(value: string): boolean {
  return /<\/?[a-zA-Z][^>]*>/.test(value);
}

/** Normalize job text from API — collapses blank-line bloat even if a stale backend lags. */
export function normalizeCareerJob(job: CareerJob): CareerJob {
  // Only keep descriptionHtml when the payload is actually markup. Promoting
  // already-stripped plain text into descriptionHtml forces the detail page
  // into the HTML container (no white-space: pre-line) → one wall of text.
  const rawHtml =
    typeof job.descriptionHtml === "string" &&
    job.descriptionHtml.trim() &&
    looksLikeHtml(job.descriptionHtml)
      ? job.descriptionHtml
      : typeof job.description === "string" && looksLikeHtml(job.description)
        ? job.description
        : "";
  const descriptionHtml = rawHtml ? sanitizeJobHtml(rawHtml) : "";
  return {
    ...job,
    description:
      typeof job.description === "string"
        ? stripJobHtml(job.description)
        : stripJobHtml(descriptionHtml),
    descriptionHtml: descriptionHtml || undefined,
  };
}

/**
 * Pick the job body editors actually maintain on hr.job.
 * Recruitment form edits land in `description`. `website_description` often
 * still holds Odoo's sample Software Programmer HTML (Belgium / sales-cycle demo)
 * and must not shadow a real Description when both are set.
 */
export function pickHrJobDescriptionHtml(
  websiteDescription: string | false | undefined,
  description: string | false | undefined,
): string {
  const internal =
    typeof description === "string" ? description.trim() : "";
  const website =
    typeof websiteDescription === "string" ? websiteDescription.trim() : "";
  return internal || website || "";
}

const SECTION_HEADING =
  /^(?:key\s+responsibilities|(?:[\w&/+-]|\s){0,48}?qualifications?)\s*:?$/i;

/** True for a standalone "Key Responsibilities" or "…Qualifications" heading. */
export function isJobSectionHeading(label: string): boolean {
  const text = label.replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
  if (!text || text.length > 60 || /[.!?]/.test(text)) return false;
  return SECTION_HEADING.test(text);
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Bold those headings in sanitized job HTML. Leaves the surrounding copy alone. */
export function boldJobSectionHeadingsHtml(html: string): string {
  return html.replace(
    /<(p|div|h[1-6]|li|span|strong|b)>\s*(?:<(?:strong|b|span)>\s*)?([^<]+?)\s*(?:<\/(?:strong|b|span)>\s*)?<\/\1>/gi,
    (full, tag: string, text: string) => {
      if (!isJobSectionHeading(text)) return full;
      const label = text.replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
      if (tag === "strong" || tag === "b") return `<strong>${label}</strong>`;
      return `<${tag}><strong>${label}</strong></${tag}>`;
    },
  );
}

/** Bold those headings in stripped plain text, escaped for innerHTML. */
export function boldJobSectionHeadingsText(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const label = line.replace(/\s+/g, " ").trim();
      if (!isJobSectionHeading(label)) return escapeHtml(line);
      return `<strong>${escapeHtml(label)}</strong>`;
    })
    .join("\n");
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
