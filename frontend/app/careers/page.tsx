import { CareersListing } from "@/components/careers/CareersListing";
import { Container } from "@/components/ui";
import { getPageBySlug } from "@/data/cms";
import { getJobList } from "@/data/jobs";
import type { CareerPanel, Page, Section } from "@/types";
import type { Metadata } from "next";
import "@/styles/pages/careers.css";

const FALLBACK_TITLE = "Join Our Team at Aptus Infotech";
const FALLBACK_INTRO =
  "We're always looking for passionate, driven people. Browse our open roles and find where you fit in.";

export const metadata: Metadata = {
  title: "Careers at Aptus Infotech",
  description:
    "Explore open roles at Aptus Infotech and join a team that values creativity, collaboration and continuous growth.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Pull hero/intro from CMS slug `career` (Odoo website.page / career.json). Careers-only. */
function heroFromCareerCms(page: Page | null): { title: string; intro: string } {
  const panel = page?.sections?.find(
    (s): s is Section & { data: CareerPanel } => s.type === "career-panel",
  )?.data;

  const title = panel?.title?.trim() || FALLBACK_TITLE;
  const intro =
    panel?.paragraphs?.find((p) => p.trim())?.trim() ||
    panel?.tagline?.trim() ||
    FALLBACK_INTRO;

  return { title, intro };
}

export default async function CareersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = {
    q: first(sp.q),
    department: first(sp.department),
  };

  const [initial, careerPage] = await Promise.all([
    getJobList(filters),
    getPageBySlug("career").catch(() => null),
  ]);

  const { title, intro } = heroFromCareerCms(careerPage);

  return (
    <main className="aptus-careers">
      <section className="aptus-careers-hero">
        <Container size="site">
          <h1>{title}</h1>
          <p>{intro}</p>
        </Container>
      </section>

      <CareersListing initial={initial} initialFilters={filters} />
    </main>
  );
}
