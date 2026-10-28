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

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Rebuild structured HTML from stripped Odoo plain text.
 * Live backend often omits descriptionHtml — without this, the detail page
 * cannot match localhost (lists/headings).
 */
export function plainJobDescriptionToHtml(text: string): string {
  const lines = text.split("\n").map((l) => l.trim());
  const parts: string[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (!bullets.length) return;
    parts.push(
      `<ul>${bullets.map((b) => `<li>${escapeHtmlText(b)}</li>`).join("")}</ul>`,
    );
    bullets = [];
  };

  for (const line of lines) {
    if (!line) continue;
    const bullet = line.match(KEY_BULLET);
    if (bullet) {
      bullets.push(bullet[1]);
      continue;
    }
    // Mid-bullet wrap continuation (Odoo hard-wraps after commas).
    if (bullets.length && !looksLikeSectionHeading(line)) {
      bullets[bullets.length - 1] += ` ${line}`;
      continue;
    }
    flushBullets();
    if (KEY_HEADING_LINE.test(line)) {
      parts.push(`<p class="aptus-jobdetail__key">Key Responsibilities</p>`);
    } else if (looksLikeSectionHeading(line)) {
      parts.push(`<p><strong>${escapeHtmlText(line)}</strong></p>`);
    } else {
      // Soft-wrap join when previous body <p> didn't end a sentence
      // ("Project\nEngineer – ELV…") — mirrors stripJobHtml lowercase join.
      const last = parts[parts.length - 1];
      const body =
        last &&
        last.startsWith("<p>") &&
        !last.startsWith("<p><strong>") &&
        !last.includes("aptus-jobdetail__key")
          ? last.slice(3, -4)
          : "";
      if (body && !/[.!?]$/.test(body.trim())) {
        parts[parts.length - 1] =
          `<p>${body} ${escapeHtmlText(line)}</p>`;
      } else {
        parts.push(`<p>${escapeHtmlText(line)}</p>`);
      }
    }
  }
  flushBullets();
  return parts.join("");
}

/** Normalize job text from API — collapses blank-line bloat even if a stale backend lags. */
export function normalizeCareerJob(job: CareerJob): CareerJob {
  const rawHtml =
    typeof job.descriptionHtml === "string" &&
    job.descriptionHtml.trim() &&
    looksLikeHtml(job.descriptionHtml)
      ? job.descriptionHtml
      : typeof job.description === "string" && looksLikeHtml(job.description)
        ? job.description
        : "";
  let descriptionHtml = rawHtml ? sanitizeJobHtml(rawHtml) : "";
  const description =
    typeof job.description === "string"
      ? stripJobHtml(job.description)
      : stripJobHtml(descriptionHtml);
  // Live API may only send plain description — rebuild markup so detail CSS applies.
  if (!descriptionHtml && description.trim()) {
    descriptionHtml = sanitizeJobHtml(plainJobDescriptionToHtml(description));
  }
  return {
    ...job,
    description,
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

const KEY_HEADING_LINE = /^key(?:\s|&nbsp;)+responsibilities\s*:?\s*$/i;
const KEY_BULLET = /^[•\u2022]\s+(.+)$/;
// Heading tag (optionally wrapped in strong/b/span) plus a following list, if any.
const KEY_HTML_BLOCK =
  /<(p|div|h[1-6]|strong|b|span)>\s*(?:<(?:strong|b|span)>\s*)?key(?:\s|&nbsp;)+responsibilities\s*:?\s*(?:<\/(?:strong|b|span)>\s*)?<\/\1>\s*(<(ul|ol)>[\s\S]*?<\/\3>)?/i;

export interface KeyResponsibilitiesSplit {
  before: string;
  items: string[];
  after: string;
}

/** Short title-like lines (e.g. Required Skills) — not bullet/body wrap continuations. */
function looksLikeSectionHeading(line: string): boolean {
  if (KEY_HEADING_LINE.test(line)) return true;
  // Sentence punctuation ⇒ wrapped body text, not a heading.
  if (/[.,;!?]/.test(line)) return false;
  if (!line || line.length > 60 || !/^[A-Z]/.test(line)) return false;
  const words = line.split(/\s+/).filter(Boolean);
  // "We are seeking a motivated…" is body; real headings stay short.
  if (words.length === 0 || words.length > 6) return false;
  // Title Case (or &): body soft-wraps are mostly lowercase glue words.
  const titled = words.filter(
    (w) => /^[A-Z]/.test(w) || w === "&" || w === "/",
  );
  return titled.length >= Math.ceil(words.length / 2);
}

/** Pull the "Key Responsibilities" line and its bullets out of stripped job text. */
export function splitKeyResponsibilities(text: string): KeyResponsibilitiesSplit | null {
  const lines = text.split("\n");
  const idx = lines.findIndex((line) => KEY_HEADING_LINE.test(line.trim()));
  if (idx < 0) return null;
  const items: string[] = [];
  let i = idx + 1;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      i++;
      continue;
    }
    const match = trimmed.match(KEY_BULLET);
    if (match) {
      items.push(match[1]);
      i++;
      continue;
    }
    // Odoo hard-wraps mid-bullet ("Purchase,\nInventory…") — keep appending until
    // the next bullet or a real section heading, otherwise SPLIT_PATH drops the rest.
    if (items.length > 0 && !looksLikeSectionHeading(trimmed)) {
      items[items.length - 1] += ` ${trimmed}`;
      i++;
      continue;
    }
    break;
  }
  return {
    before: lines.slice(0, idx).join("\n").trim(),
    items,
    after: lines.slice(i).join("\n").trim(),
  };
}

/** Mark the Key Responsibilities heading (and keep its list) — styled larger/bold via CSS. */
export function highlightKeyResponsibilitiesHtml(html: string): string {
  if (!/key(?:\s|&nbsp;)+responsibilities/i.test(html)) return html;
  return html.replace(KEY_HTML_BLOCK, (_full, _tag: string, list?: string) => {
    return `<p class="aptus-jobdetail__key">Key Responsibilities</p>${list ?? ""}`;
  });
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
