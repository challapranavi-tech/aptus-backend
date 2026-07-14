import { CareersListing } from "@/components/careers/CareersListing";
import { Container } from "@/components/ui";
import { getJobList } from "@/data/jobs";
import type { Metadata } from "next";
import "@/styles/pages/careers.css";

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

export default async function CareersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = {
    q: first(sp.q),
    department: first(sp.department),
    location: first(sp.location),
  };

  const initial = await getJobList(filters);

  return (
    <main className="aptus-careers">
      <section className="aptus-careers-hero">
        <Container size="site">
          <h1>Join Our Team at Aptus Infotech</h1>
          <p>
            We&apos;re always looking for passionate, driven people. Browse our open
            roles and find where you fit in.
          </p>
        </Container>
      </section>

      <CareersListing initial={initial} initialFilters={filters} />
    </main>
  );
}
