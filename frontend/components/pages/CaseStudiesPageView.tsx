import { Container } from "@/components/ui";
import {
  CASE_STUDIES_ICONS,
  PAIN_POINT_ICONS,
  WHY_CHOOSE_ICONS,
} from "@/data/case-studies-icons";
import { ELV_ICONS } from "@/data/elv-icons";
import { joinAccentTitle, renderAccentTitle } from "@/lib/render-accent-title";
import { resolveCmsImageSrc } from "@/lib/utils";
import type { CaseStudiesPageContent } from "@/types/case-studies-page";

type CaseStudiesPageViewProps = {
  content: CaseStudiesPageContent;
};

function CaseStudyIcon({ name }: { name: string }) {
  const live = ELV_ICONS[name] ?? CASE_STUDIES_ICONS[name];
  if (!live) return null;
  return (
    <svg
      className="aptus-cs-icon"
      viewBox={live.viewBox}
      fill="currentColor"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: live.paths }}
    />
  );
}

/** Dedicated layout for /customer-stories (ex-/aptus-case-studies) — matches live Elementor post-5734. */
export function CaseStudiesPageView({ content }: CaseStudiesPageViewProps) {
  const { hero, caseStudies, painPoints, whyChoose, transformCta, testimonials, partnerships } =
    content;

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

      {caseStudies.visible !== false ? (
        <section className="aptus-cs-section aptus-cs-section--muted">
          <Container>
            <h2 className="aptus-cs-section-title">{joinAccentTitle(caseStudies.title)}</h2>
            <div className="aptus-cs-grid grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {caseStudies.items.map((item) => (
                <article key={item.title} className="aptus-cs-card">
                  {item.imageSrc ? (
                    <a href={item.pdfHref} target="_blank" rel="noopener noreferrer">
                      <img
                        src={resolveCmsImageSrc(item.imageSrc)}
                        alt={item.imageAlt ?? item.title}
                        className="aptus-cs-card__image"
                        loading="lazy"
                        decoding="async"
                      />
                    </a>
                  ) : null}
                  <h3 className="aptus-cs-card__title">
                    <a href={item.pdfHref} target="_blank" rel="noopener noreferrer">
                      {item.title}
                    </a>
                  </h3>
                  <p className="aptus-cs-card__body">{item.description}</p>
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
                </article>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {painPoints.visible !== false ? (
        <section className="aptus-cs-section">
          <Container>
            <h2 className="aptus-cs-section-title">{joinAccentTitle(painPoints.title)}</h2>
            <div className="mx-auto grid max-w-[800px] gap-2 md:grid-cols-3">
              {painPoints.items.map((item, index) => (
                <article key={item.title} className="aptus-cs-icon-card">
                  <CaseStudyIcon name={PAIN_POINT_ICONS[index] ?? PAIN_POINT_ICONS[0]} />
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
            <p className="aptus-cs-closing">{painPoints.closingParagraph}</p>
          </Container>
        </section>
      ) : null}

      {whyChoose.visible !== false ? (
        <section className="aptus-cs-section">
          <Container>
            <h2 className="aptus-cs-section-title aptus-cs-section-title--lg">
              {joinAccentTitle(whyChoose.title)}
            </h2>
            <div className="mx-auto grid max-w-[1000px] gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {whyChoose.items.map((item, index) => (
                <article key={item.title} className="aptus-cs-icon-card">
                  <CaseStudyIcon name={WHY_CHOOSE_ICONS[index] ?? WHY_CHOOSE_ICONS[0]} />
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {transformCta.visible !== false ? (
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

      {testimonials.visible !== false ? (
        <section className="aptus-cs-section">
          <Container>
            <h2 className="aptus-cs-section-title aptus-cs-section-title--lg">
              {testimonials.eyebrow}
            </h2>
            <p className="aptus-cs-subtitle">{renderAccentTitle(testimonials.title)}</p>
            <div className="mx-auto grid max-w-[800px] gap-2 md:grid-cols-3">
              {testimonials.items.map((item) => (
                <article key={item.authorName} className="aptus-cs-testimonial-card">
                  <blockquote>&ldquo;{item.quote}&rdquo;</blockquote>
                  <p className="aptus-cs-author">{item.authorName}</p>
                  <p className="aptus-cs-role">
                    {item.authorRole},
                    <br />
                    {item.company}
                  </p>
                </article>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {partnerships?.visible !== false && partnerships?.logos?.length ? (
        <section className="aptus-cs-section">
          <Container>
            <h2 className="aptus-cs-partners-title">
              {partnerships.title.before}{" "}
              <span>{partnerships.title.accent}</span>
            </h2>
            <div className="aptus-cs-partners-grid">
              {partnerships.logos.map((logo) => (
                <img
                  key={logo.alt}
                  src={resolveCmsImageSrc(logo.src)}
                  alt={logo.alt}
                  loading="lazy"
                  decoding="async"
                />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

    </>
  );
}
