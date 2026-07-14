import { ApplicationWizard } from "@/components/careers/apply/ApplicationWizard";
import { Container } from "@/components/ui";
import { getJob } from "@/data/jobs";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/styles/pages/careers.css";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);
  return {
    title: job ? `Apply — ${job.title}` : "Apply",
    robots: { index: false, follow: false },
  };
}

export default async function ApplyPage({ params }: PageProps) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) notFound();

  return (
    <main className="aptus-careers">
      <section className="aptus-apply">
        <Container size="lg">
          <Link href={`/careers/${job.slug}`} className="aptus-jobdetail__back">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            Back to job
          </Link>
          <h1 className="aptus-jobdetail__title" style={{ marginBottom: "1.5rem" }}>
            Apply for {job.title}
          </h1>
          <ApplicationWizard job={job} />
        </Container>
      </section>
    </main>
  );
}
