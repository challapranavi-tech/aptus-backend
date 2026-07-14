/**
 * Careers job source: Odoo `hr.job` (published) → committed JSON fallback.
 *
 * ponytail: Odoo HR is optional — most deployments serve the committed JSON.
 * Upgrade path: when hr.job is populated + published, it takes precedence.
 */
import fs from "fs";
import path from "path";
import {
  DEFAULT_JOB_TYPE,
  slugifyJobTitle,
  type CareerJob,
} from "@shared/lib/career-jobs";
import { odooConfigFromEnv } from "@/lib/odoo";
import { authenticate, searchRead } from "@/lib/odoo";

const JOBS_JSON = path.join(process.cwd(), "content", "careers", "jobs.json");

type RawJob = Omit<Partial<CareerJob>, "id"> & { id: string | number; title: string };

interface RawJson {
  jobs: RawJob[];
}

function stripHtml(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalize(raw: RawJob): CareerJob {
  const id = String(raw.id);
  return {
    id,
    slug: raw.slug || slugifyJobTitle(raw.title, id),
    title: raw.title,
    department: raw.department || "General",
    location: raw.location || "Oman",
    jobType: raw.jobType || DEFAULT_JOB_TYPE,
    description: raw.description || "",
    responsibilities: raw.responsibilities ?? [],
    requirements: raw.requirements ?? [],
    publishedAt: raw.publishedAt,
  };
}

function loadJsonJobs(): CareerJob[] {
  try {
    const raw = JSON.parse(fs.readFileSync(JOBS_JSON, "utf8")) as RawJson;
    return (raw.jobs ?? []).map(normalize);
  } catch {
    return [];
  }
}

interface OdooHrJob {
  id: number;
  name: string;
  department_id?: [number, string] | false;
  address_id?: [number, string] | false;
  website_description?: string | false;
  description?: string | false;
  no_of_recruitment?: number;
  write_date?: string;
}

async function loadOdooJobs(): Promise<CareerJob[]> {
  const cfg = odooConfigFromEnv();
  if (!cfg.url || !cfg.db || !cfg.user || !cfg.apiKey) return [];

  const session = await authenticate(
    cfg.url,
    cfg.db,
    cfg.user,
    cfg.apiKey,
    cfg.revalidate,
  );

  const rows = await searchRead<OdooHrJob>(
    session,
    "hr.job",
    [["website_published", "=", true]],
    {
      fields: [
        "id",
        "name",
        "department_id",
        "address_id",
        "website_description",
        "description",
        "write_date",
      ],
      limit: 200,
      order: "write_date desc",
    },
  );

  return rows.map((r) => {
    const html = (r.website_description || r.description || "") as string;
    const text = stripHtml(html);
    return normalize({
      id: r.id,
      title: r.name,
      department: Array.isArray(r.department_id) ? r.department_id[1] : "General",
      location: Array.isArray(r.address_id) ? r.address_id[1] : "Oman",
      description: text,
      publishedAt: r.write_date,
    });
  });
}

/** All open jobs (Odoo when populated, else committed JSON). */
export async function getAllJobs(): Promise<CareerJob[]> {
  try {
    const odoo = await loadOdooJobs();
    if (odoo.length > 0) return odoo;
  } catch {
    // ponytail: Odoo unreachable / no HR module — fall back to committed JSON.
  }
  return loadJsonJobs();
}

export async function getJobBySlug(slug: string): Promise<CareerJob | null> {
  const jobs = await getAllJobs();
  return jobs.find((j) => j.slug === slug) ?? null;
}
