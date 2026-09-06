"use client";

import { Container } from "@/components/ui";
import { joinAccentTitle } from "@/lib/render-accent-title";
import { resolveCmsImageSrc } from "@/lib/utils";
import type { AccentTitleContent, CaseStudyItemContent } from "@/types/case-studies-page";
import { useMemo, useState } from "react";

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
  const industries = useMemo(() => {
    const set = new Set<string>();
    for (const project of projects) {
      if (project.industry?.trim()) set.add(project.industry.trim());
    }
    return [ALL_INDUSTRIES, ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [projects]);

  const [activeIndustry, setActiveIndustry] = useState(ALL_INDUSTRIES);

  const filtered = useMemo(() => {
    if (activeIndustry === ALL_INDUSTRIES) return projects;
    return projects.filter((project) => project.industry === activeIndustry);
  }, [activeIndustry, projects]);

  return (
    <section className="aptus-cs-section aptus-cs-section--muted">
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
                onClick={() => setActiveIndustry(industry)}
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
