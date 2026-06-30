import { ContactCtaSection } from "@/components/pages/shared/MarketingSections";
import {
  AccentSpan,
  Container,
  ReadMoreButton,
  Section,
  SectionHeading,
} from "@/components/ui";
import { renderAccentTitle } from "@/lib/cms/render-accent-title";
import type { CaseStudiesPageContent } from "@/types/case-studies-page";

type CaseStudiesPageViewProps = {
  content: CaseStudiesPageContent;
};

/** Composes Case Studies page sections from typed CMS content. */
export function CaseStudiesPageView({ content }: CaseStudiesPageViewProps) {
  const hero = content.hero;
  const caseStudies = content.caseStudies;
  const painPoints = content.painPoints;
  const whyChoose = content.whyChoose;
  const transformCta = content.transformCta;
  const testimonials = content.testimonials;
  const partnerships = content.partnerships;

  return (
    <>
      {hero.visible !== false ? (
        <section className="aptus-case-studies-hero">
          <Container>
            <h1>{renderAccentTitle(hero.title)}</h1>
            {hero.subtitle ? <p>{hero.subtitle}</p> : null}
          </Container>
        </section>
      ) : null}

      {caseStudies.visible !== false ? (
        <Section background="muted">
          <Container>
            <h2 className="aptus-case-studies-section-title mb-10">
              {renderAccentTitle(caseStudies.title)}
            </h2>
            <div className="aptus-case-studies-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {caseStudies.items.map((item) => (
                <article key={item.title} className="aptus-case-study-card bg-white">
                  {item.imageSrc ? (
                    <a href={item.pdfHref} target="_blank" rel="noopener noreferrer">
                      <img
                        src={item.imageSrc}
                        alt={item.imageAlt ?? item.title}
                        className="aptus-case-study-card__image mx-auto"
                        loading="lazy"
                        decoding="async"
                      />
                    </a>
                  ) : null}
                  <h3 className="aptus-case-study-card__title">
                    <a href={item.pdfHref} target="_blank" rel="noopener noreferrer">
                      {item.title}
                    </a>
                  </h3>
                  <p className="aptus-case-study-card__body">{item.description}</p>
                  <div className="px-2 pb-4">
                    <ReadMoreButton
                      href={item.pdfHref}
                      label={item.readMoreLabel ?? "Read More"}
                    />
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {painPoints.visible !== false ? (
        <Section background="white">
          <Container>
            <SectionHeading
              title={renderAccentTitle(painPoints.title)}
              align="center"
              className="mb-10"
            />
            <div className="grid gap-6 md:grid-cols-3">
              {painPoints.items.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[10px] bg-white p-6 text-center shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                >
                  <h3 className="text-lg font-semibold text-aptus-text">{item.title}</h3>
                  <p className="mt-3 text-xs leading-relaxed text-[#695B5B] md:text-sm">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
            <p className="mx-auto mt-10 max-w-4xl text-center text-aptus-sm leading-relaxed text-aptus-text-muted md:text-aptus-base">
              {painPoints.closingParagraph}
            </p>
          </Container>
        </Section>
      ) : null}

      {whyChoose.visible !== false ? (
        <Section background="muted">
          <Container>
            <SectionHeading
              eyebrow={whyChoose.eyebrow}
              title={renderAccentTitle(whyChoose.title)}
              align="center"
              className="mb-10"
            />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {whyChoose.items.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[10px] bg-white p-6 text-center shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                >
                  <h3 className="text-lg font-semibold text-aptus-text">{item.title}</h3>
                  <p className="mt-3 text-xs leading-relaxed text-[#695B5B] md:text-sm">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {transformCta.visible !== false ? (
        <Section background="white" className="aptus-case-studies-transform">
          <Container className="text-center">
            <SectionHeading title={renderAccentTitle(transformCta.title)} align="center" />
            <p className="mx-auto mt-4 max-w-2xl text-aptus-sm leading-relaxed text-aptus-text-muted md:text-aptus-base">
              {transformCta.subtitle}
            </p>
            <div className="mt-8">
              <ReadMoreButton href={transformCta.ctaHref} label={transformCta.ctaLabel} variant="cta" />
            </div>
          </Container>
        </Section>
      ) : null}

      {testimonials.visible !== false ? (
        <Section background="white">
          <Container>
            <SectionHeading
              eyebrow={testimonials.eyebrow}
              title={renderAccentTitle(testimonials.title)}
              align="center"
              className="mb-10"
            />
            {testimonials.subtitle ? (
              <p className="mb-10 text-center text-aptus-sm text-aptus-accent md:text-aptus-base">
                {testimonials.subtitle}
              </p>
            ) : null}
            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
              {testimonials.items.map((item) => (
                <article
                  key={item.authorName}
                  className="flex flex-col rounded-[10px] bg-white p-6 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                >
                  <blockquote className="flex-1 text-xs leading-relaxed text-[#695B5B] md:text-sm">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>
                  <footer className="mt-6 border-t border-aptus-border pt-4 text-center">
                    <p className="text-lg font-semibold text-aptus-text">{item.authorName}</p>
                    <p className="text-sm text-aptus-accent">
                      {item.authorRole}, {item.company}
                    </p>
                  </footer>
                </article>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {partnerships?.visible !== false && partnerships?.logos?.length ? (
        <Section background="white">
          <Container className="text-center">
            <h2 className="font-poppins text-[2.1875rem] font-semibold text-aptus-text">
              {partnerships.title.before}{" "}
              <AccentSpan className="text-[#38b6ff]">{partnerships.title.accent}</AccentSpan>
            </h2>
            <div className="aptus-case-studies-partners aptus-partners__grid mt-10">
              {partnerships.logos.map((logo) => (
                <div key={logo.alt} className="aptus-partners__logo">
                  <img src={logo.src} alt={logo.alt} loading="lazy" decoding="async" />
                </div>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {content.showContactCta !== false ? <ContactCtaSection /> : null}
    </>
  );
}
