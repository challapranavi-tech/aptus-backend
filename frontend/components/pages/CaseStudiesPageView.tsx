import { Container } from "@/components/ui";
import { joinAccentTitle } from "@/lib/render-accent-title";
import { resolveCmsImageSrc } from "@/lib/utils";
import type { CaseStudiesPageContent, CaseStudyItemContent } from "@/types/case-studies-page";

type CaseStudiesPageViewProps = {
  content: CaseStudiesPageContent;
};

function ProjectCard({ item }: { item: CaseStudyItemContent }) {
  return (
    <article className="aptus-cs-card aptus-cs-card--key-project">
      {item.imageSrc ? (
        item.pdfHref ? (
          <a href={item.pdfHref} target="_blank" rel="noopener noreferrer">
            <img
              src={resolveCmsImageSrc(item.imageSrc)}
              alt={item.imageAlt ?? item.title}
              className="aptus-cs-card__image"
              loading="lazy"
              decoding="async"
            />
          </a>
        ) : (
          <img
            src={resolveCmsImageSrc(item.imageSrc)}
            alt={item.imageAlt ?? item.title}
            className="aptus-cs-card__image"
            loading="lazy"
            decoding="async"
          />
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
        <section className="aptus-cs-section aptus-cs-section--muted">
          <Container>
            <h2 className="aptus-cs-section-title">{joinAccentTitle(projectsTitle)}</h2>
            <div className="aptus-cs-grid aptus-cs-grid--key-projects grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {allProjects.map((item) => (
                <ProjectCard key={item.title} item={item} />
              ))}
            </div>
          </Container>
        </section>
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
