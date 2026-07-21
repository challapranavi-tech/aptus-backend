/**
 * Careers job source: Odoo `hr.job` with website_published only.
 * No committed JSON / mock fallback — empty list if Odoo has no published jobs.
 */
import {
  DEFAULT_JOB_TYPE,
  slugifyJobTitle,
  type CareerJob,
} from "@shared/lib/career-jobs";
import { odooConfigFromEnv } from "@/lib/odoo";
import { authenticate, searchRead } from "@/lib/odoo";

interface OdooHrJob {
  id: number;
  name: string;
  department_id?: [number, string] | false;
  address_id?: [number, string] | false;
  website_description?: string | false;
  description?: string | false;
  write_date?: string;
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

function normalizeOdooJob(r: OdooHrJob): CareerJob {
  const id = String(r.id);
  const html = (r.website_description || r.description || "") as string;
  return {
    id,
    slug: slugifyJobTitle(r.name, id),
    title: r.name,
    department: Array.isArray(r.department_id) ? r.department_id[1] : "General",
    location: Array.isArray(r.address_id) ? r.address_id[1] : "Oman",
    jobType: DEFAULT_JOB_TYPE,
    description: stripHtml(html),
    responsibilities: [],
    requirements: [],
    publishedAt: r.write_date,
  };
}

async function loadOdooJobs(): Promise<CareerJob[]> {
  const cfg = odooConfigFromEnv();
  if (!cfg.url || !cfg.db || !cfg.user || !cfg.apiKey) {
    throw new Error("Odoo is not configured for careers jobs");
  }

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

  return rows.map(normalizeOdooJob);
}

/** Published website jobs from Odoo only. */
export async function getAllJobs(): Promise<CareerJob[]> {
  return loadOdooJobs();
}

export async function getJobBySlug(slug: string): Promise<CareerJob | null> {
  const jobs = await getAllJobs();
  return jobs.find((j) => j.slug === slug) ?? null;
}
