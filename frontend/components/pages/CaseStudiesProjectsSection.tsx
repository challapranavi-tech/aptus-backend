"use client";

import { Container } from "@/components/ui";
import { downloadFilteredProjectsPdf } from "@/lib/download-case-studies-pdf";
import { joinAccentTitle } from "@/lib/render-accent-title";
import { resolveCmsImageSrc } from "@/lib/utils";
import type { AccentTitleContent, CaseStudyItemContent } from "@/types/case-studies-page";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const ALL_INDUSTRIES = "All";
type SolutionCategory = "elv" | "software";
type CategoryFilter = "all" | SolutionCategory;

const CATEGORY_FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "elv", label: "ELV" },
  { id: "software", label: "Software" },
];

const ELV_HINT =
  /\b(elv|cctv|ftto|ftth|access control|structured cabling|pa system|smatv|iptv|nurse call|gate automation|thermal scanner|ups|networking|telephone system|audio visual|security system|trespass|guest management|fiber)\b/i;
const SOFTWARE_HINT =
  /\b(autodesk|adobe|software|bim|revit|civil 3d|autocad|navisworks|primavera|etap|turnitin|acrobat|illustrator|photoshop|indesign|construction cloud|docs|forma)\b/i;

function projectCategories(project: CaseStudyItemContent): SolutionCategory[] {
  const text = `${project.title} ${project.description}`;
  const cats: SolutionCategory[] = [];
  if (ELV_HINT.test(text)) cats.push("elv");
  if (SOFTWARE_HINT.test(text)) cats.push("software");
  return cats.length ? cats : ["elv", "software"];
}

function parseCategory(raw: string | null): SolutionCategory | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  if (value === "elv" || value === "software") return value;
  return null;
}

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
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const categoryFromUrl = useMemo(
    () => parseCategory(searchParams.get("category")),
    [searchParams],
  );
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(
    categoryFromUrl ?? "all",
  );

  useEffect(() => {
    setActiveCategory(categoryFromUrl ?? "all");
  }, [categoryFromUrl]);

  const categoryProjects = useMemo(() => {
    if (activeCategory === "all") return projects;
    return projects.filter((project) =>
      projectCategories(project).includes(activeCategory),
    );
  }, [activeCategory, projects]);

  const industries = useMemo(() => {
    const set = new Set<string>();
    for (const project of categoryProjects) {
      if (project.industry?.trim()) set.add(project.industry.trim());
    }
    return [ALL_INDUSTRIES, ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [categoryProjects]);

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

  const replaceFilters = (next: {
    category?: CategoryFilter;
    industry?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    const category = next.category ?? activeCategory;
    const industry = next.industry ?? activeIndustry;

    if (category === "all") params.delete("category");
    else params.set("category", category);

    if (!industry || industry === ALL_INDUSTRIES) params.delete("industry");
    else params.set("industry", industry);

    const query = params.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  };

  const selectCategory = (category: CategoryFilter) => {
    setActiveCategory(category);
    setActiveIndustry(ALL_INDUSTRIES);
    replaceFilters({ category, industry: ALL_INDUSTRIES });
  };

  const selectIndustry = (industry: string) => {
    setActiveIndustry(industry);
    replaceFilters({ industry });
  };

  const filtered = useMemo(() => {
    if (activeIndustry === ALL_INDUSTRIES) return categoryProjects;
    return categoryProjects.filter((project) => project.industry === activeIndustry);
  }, [activeIndustry, categoryProjects]);

  const onDownloadPdf = async () => {
    if (!filtered.length || downloading) return;
    setDownloadError(null);
    setDownloading(true);
    try {
      await downloadFilteredProjectsPdf({
        projects: filtered,
        industry: activeIndustry,
        category: activeCategory === "all" ? null : activeCategory,
      });
    } catch (error) {
      setDownloadError(
        error instanceof Error ? error.message : "Unable to download the PDF right now.",
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="aptus-cs-section aptus-cs-section--muted" id="projects">
      <Container>
        <div className="aptus-cs-projects-header">
          <h2 className="aptus-cs-section-title">{joinAccentTitle(title)}</h2>
          <button
            type="button"
            className="aptus-cs-download-pdf"
            onClick={() => void onDownloadPdf()}
            disabled={!filtered.length || downloading}
          >
            {downloading ? "Preparing PDF…" : "Download PDF"}
          </button>
        </div>

        <div
          className="aptus-cs-industry-filters"
          role="toolbar"
          aria-label="Filter projects by solution type"
        >
          {CATEGORY_FILTERS.map((option) => {
            const active = option.id === activeCategory;
            return (
              <button
                key={option.id}
                type="button"
                className={
                  active
                    ? "aptus-cs-industry-filter is-active"
                    : "aptus-cs-industry-filter"
                }
                aria-pressed={active}
                onClick={() => selectCategory(option.id)}
              >
                {option.label}
              </button>
            );
          })}
        </div>

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

        {downloadError ? (
          <p className="aptus-cs-download-error" role="alert">
            {downloadError}
          </p>
        ) : null}

        {filtered.length ? (
          <div className="aptus-cs-grid aptus-cs-grid--key-projects grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <ProjectCard key={item.title} item={item} />
            ))}
          </div>
        ) : (
          <p className="aptus-cs-industry-empty">
            No projects found for this filter.
          </p>
        )}
      </Container>
    </section>
  );
}
