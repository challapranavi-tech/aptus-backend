/**
 * Careers job source: Odoo `hr.job` with website_published only.
 * No committed JSON / mock fallback — empty list if Odoo has no published jobs.
 */
import {
  DEFAULT_JOB_TYPE,
  pickHrJobDescriptionHtml,
  slugifyJobTitle,
  type CareerJob,
} from "@shared/lib/career-jobs";
import { odooConfigFromEnv } from "@/lib/odoo";
import { authenticate, searchRead } from "@/lib/odoo";
import { stripJobHtml } from "@shared/lib/strip-job-html";

interface OdooHrJob {
  id: number;
  name: string;
  address_id?: [number, string] | false;
  website_description?: string | false;
  description?: string | false;
  write_date?: string;
}

function normalizeOdooJob(r: OdooHrJob): CareerJob {
  const id = String(r.id);
  const html = pickHrJobDescriptionHtml(r.website_description, r.description);
  return {
    id,
    slug: slugifyJobTitle(r.name, id),
    title: r.name,
    // ponytail: Odoo address_id holds the team label (e.g. SOFTWARE); city is Muscat until multi-office exists.
    department: Array.isArray(r.address_id) ? r.address_id[1] : "General",
    location: "Muscat",
    jobType: DEFAULT_JOB_TYPE,
    description: stripJobHtml(html),
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

  console.info("[careers/jobs] odoo", {
    db: cfg.db,
    url: cfg.url.replace(/\/$/, ""),
    filter: "website_published=true",
  });

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
        "address_id",
        "website_description",
        "description",
        "write_date",
      ],
      limit: 200,
      order: "write_date desc",
    },
  );

  const jobs = rows.map(normalizeOdooJob);
  console.info("[careers/jobs] fetched", {
    db: cfg.db,
    count: jobs.length,
    titles: jobs.map((j) => `${j.id}:${j.title}`),
  });
  return jobs;
}

/** Published website jobs from Odoo only. */
export async function getAllJobs(): Promise<CareerJob[]> {
  return loadOdooJobs();
}

export async function getJobBySlug(slug: string): Promise<CareerJob | null> {
  const jobs = await getAllJobs();
  return jobs.find((j) => j.slug === slug) ?? null;
}
