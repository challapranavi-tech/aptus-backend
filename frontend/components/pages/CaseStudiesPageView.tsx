import { CaseStudiesProjectsSection } from "@/components/pages/CaseStudiesProjectsSection";
import { Container } from "@/components/ui";
import { joinAccentTitle } from "@/lib/render-accent-title";
import { resolveCmsImageSrc } from "@/lib/utils";
import type { CaseStudiesPageContent } from "@/types/case-studies-page";
import { Suspense } from "react";

type CaseStudiesPageViewProps = {
  content: CaseStudiesPageContent;
};

/** Dedicated layout for /customer-stories (Solutions in Action). */
export function CaseStudiesPageView({ content }: CaseStudiesPageViewProps) {
  const { hero, caseStudies, keyProjects, transformCta } = content;

  const featured =
    caseStudies.visible !== false
      ? caseStudies.items.filter((item) => Boolean(item.imageSrc))
      : [];
  const keyItems =
    keyProjects?.visible !== false
      ? (keyProjects?.items ?? []).filter((item) => Boolean(item.imageSrc))
      : [];
  const allProjects = [...featured, ...keyItems];
  const projectsTitle = keyProjects?.title ?? caseStudies.title;

  return (
    <>
      {hero.visible !== false ? (
        <section
          className="aptus-cs-hero"
          style={
            hero.backgroundImage
              ? {
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("${resolveCmsImageSrc(hero.backgroundImage)}")`,
                }
              : undefined
          }
        >
          <Container>
            <h1>{joinAccentTitle(hero.title)}</h1>
            {hero.subtitle ? <p>{hero.subtitle}</p> : null}
          </Container>
        </section>
      ) : null}

      {allProjects.length ? (
        <Suspense fallback={null}>
          <CaseStudiesProjectsSection title={projectsTitle} projects={allProjects} />
        </Suspense>
      ) : null}

      {transformCta?.visible !== false && transformCta ? (
        <section className="aptus-cs-transform">
          <Container>
            <h2>{joinAccentTitle(transformCta.title)}</h2>
            <p>{transformCta.subtitle}</p>
            <a href={transformCta.ctaHref} className="aptus-cs-btn">
              {transformCta.ctaLabel}
            </a>
          </Container>
        </section>
      ) : null}
    </>
  );
}
