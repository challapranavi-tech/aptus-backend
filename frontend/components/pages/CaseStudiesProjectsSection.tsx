"use client";

import { Container } from "@/components/ui";
import { joinAccentTitle } from "@/lib/render-accent-title";
import { resolveCmsImageSrc } from "@/lib/utils";
import type { AccentTitleContent, CaseStudyItemContent } from "@/types/case-studies-page";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const ALL_INDUSTRIES = "All";

function ProjectCard({ item }: { item: CaseStudyItemContent }) {
  const image = item.imageSrc ? (
    <img
      src={resolveCmsImageSrc(item.imageSrc)}
      alt={item.imageAlt ?? item.title}
      className="aptus-cs-card__image"
      loading="lazy"
      decoding="async"
    />
  ) : null;

  return (
    <article className="aptus-cs-card aptus-cs-card--key-project">
      {image ? (
        item.pdfHref ? (
          <a
            href={item.pdfHref}
            target="_blank"
            rel="noopener noreferrer"
            className="aptus-cs-card__logo-wrap"
          >
            {image}
          </a>
        ) : (
          <div className="aptus-cs-card__logo-wrap">{image}</div>
        )
      ) : null}
      <h3 className="aptus-cs-card__title">
        {item.pdfHref ? (
          <a href={item.pdfHref} target="_blank" rel="noopener noreferrer">
            {item.title}
          </a>
        ) : (
          item.title
        )}
      </h3>
      {item.industry ? <p className="aptus-cs-card__industry">{item.industry}</p> : null}
      <p className="aptus-cs-card__body">{item.description}</p>
      {item.pdfHref ? (
        <div className="aptus-cs-card__btn-wrap">
          <a
            href={item.pdfHref}
            target="_blank"
            rel="noopener noreferrer"
            className="aptus-cs-btn"
          >
            {item.readMoreLabel ?? "Read More"}
          </a>
        </div>
      ) : null}
    </article>
  );
}

type CaseStudiesProjectsSectionProps = {
  title: AccentTitleContent;
  projects: CaseStudyItemContent[];
};

export function CaseStudiesProjectsSection({
  title,
  projects,
}: CaseStudiesProjectsSectionProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const industries = useMemo(() => {
    const set = new Set<string>();
    for (const project of projects) {
      if (project.industry?.trim()) set.add(project.industry.trim());
    }
    return [ALL_INDUSTRIES, ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [projects]);

  const industryFromUrl = useMemo(() => {
    const raw = searchParams.get("industry")?.trim();
    if (!raw) return null;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [searchParams]);

  const [activeIndustry, setActiveIndustry] = useState(ALL_INDUSTRIES);

  useEffect(() => {
    if (!industryFromUrl) {
      setActiveIndustry(ALL_INDUSTRIES);
      return;
    }
    const match = industries.find(
      (industry) =>
        industry !== ALL_INDUSTRIES &&
        industry.toLowerCase() === industryFromUrl.toLowerCase(),
    );
    setActiveIndustry(match ?? ALL_INDUSTRIES);
  }, [industryFromUrl, industries]);

  const selectIndustry = (industry: string) => {
    setActiveIndustry(industry);
    const params = new URLSearchParams(searchParams.toString());
    if (industry === ALL_INDUSTRIES) params.delete("industry");
    else params.set("industry", industry);
    const query = params.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  };

  const filtered = useMemo(() => {
    if (activeIndustry === ALL_INDUSTRIES) return projects;
    return projects.filter((project) => project.industry === activeIndustry);
  }, [activeIndustry, projects]);

  return (
    <section className="aptus-cs-section aptus-cs-section--muted" id="projects">
      <Container>
        <h2 className="aptus-cs-section-title">{joinAccentTitle(title)}</h2>

        <div
          className="aptus-cs-industry-filters"
          role="toolbar"
          aria-label="Filter projects by industry"
        >
          {industries.map((industry) => {
            const active = industry === activeIndustry;
            return (
              <button
                key={industry}
                type="button"
                className={
                  active
                    ? "aptus-cs-industry-filter is-active"
                    : "aptus-cs-industry-filter"
                }
                aria-pressed={active}
                onClick={() => selectIndustry(industry)}
              >
                {industry}
              </button>
            );
          })}
        </div>

        {filtered.length ? (
          <div className="aptus-cs-grid aptus-cs-grid--key-projects grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <ProjectCard key={item.title} item={item} />
            ))}
          </div>
        ) : (
          <p className="aptus-cs-industry-empty">
            No projects found for this industry.
          </p>
        )}
      </Container>
    </section>
  );
}
