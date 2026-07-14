import { BackToJobs } from "@/components/careers/BackToJobs";
import { Button, Container } from "@/components/ui";
import { getAllJobSlugs, getJob } from "@/data/jobs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@/styles/pages/careers.css";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getAllJobSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) return { title: "Job not found" };
  return {
    title: `${job.title} — Careers at Aptus Infotech`,
    // Odoo returns `false` for empty text fields — guard the type before slicing
    // so a job with no description can't throw during metadata generation (→ 500).
    description: typeof job.description === "string" ? job.description.slice(0, 160) : "",
  };
}

function MetaIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) notFound();

  const applyHref = `/careers/${job.slug}/apply`;

  return (
    <main className="aptus-careers">
      <section className="aptus-jobdetail">
        <Container size="site">
          <BackToJobs className="aptus-jobdetail__back" />

          <div className="aptus-jobdetail__layout">
            <div>
              <span className="aptus-job-card__tag">{job.department}</span>
              <h1 className="aptus-jobdetail__title">{job.title}</h1>
              <div className="aptus-jobdetail__meta">
                <span>
                  <MetaIcon path="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z" />
                  {job.location}
                </span>
                <span>
                  <MetaIcon path="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                  {job.jobType}
                </span>
                <span>
                  <MetaIcon path="M3 21h18M5 21V7l7-4 7 4v14" />
                  {job.department}
                </span>
              </div>

              {job.description && (
                <div className="aptus-jobdetail__section">
                  <h2>About the role</h2>
                  <p>{job.description}</p>
                </div>
              )}

              {job.responsibilities.length > 0 && (
                <div className="aptus-jobdetail__section">
                  <h2>Responsibilities</h2>
                  <ul className="aptus-jobdetail__list">
                    {job.responsibilities.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {job.requirements.length > 0 && (
                <div className="aptus-jobdetail__section">
                  <h2>Requirements</h2>
                  <ul className="aptus-jobdetail__list">
                    {job.requirements.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <aside className="aptus-jobdetail__aside">
              <h2 className="text-lg font-semibold" style={{ color: "#0f172a" }}>
                Ready to apply?
              </h2>
              <p className="mt-1 text-sm" style={{ color: "#667085" }}>
                Complete our guided application in a few steps.
              </p>
              <Button href={applyHref} className="mt-4 w-full">
                Apply Now
              </Button>
              <dl className="mt-5 space-y-2 text-sm" style={{ color: "#475467" }}>
                <div className="flex justify-between">
                  <dt style={{ color: "#667085" }}>Department</dt>
                  <dd>{job.department}</dd>
                </div>
                <div className="flex justify-between">
                  <dt style={{ color: "#667085" }}>Location</dt>
                  <dd>{job.location}</dd>
                </div>
                <div className="flex justify-between">
                  <dt style={{ color: "#667085" }}>Type</dt>
                  <dd>{job.jobType}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </Container>
      </section>

      {/* Sticky mobile apply bar */}
      <div className="aptus-jobdetail__apply-bar">
        <div>
          <div style={{ fontWeight: 600, color: "#0f172a" }}>{job.title}</div>
          <div style={{ fontSize: "0.8rem", color: "#667085" }}>{job.location}</div>
        </div>
        <Button href={applyHref}>Apply Now</Button>
      </div>
    </main>
  );
}
