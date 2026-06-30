import { ContactCtaSection, PageHero } from "@/components/pages/shared/MarketingSections";
import {
  Container,
  ReadMoreButton,
  Section,
  SectionHeading,
} from "@/components/ui";
import { renderAccentTitle } from "@/lib/cms/render-accent-title";
import { SITE } from "@/lib/constants";
import type { ElvPageContent } from "@/types/elv-page";

type ElvPageViewProps = {
  content: ElvPageContent;
};

/** Composes ELV solutions page sections from typed CMS content. */
export function ElvPageView({ content }: ElvPageViewProps) {
  const hero = content.hero;
  const intro = content.intro;
  const solutions = content.solutions;
  const process = content.process;
  const whyChoose = content.whyChoose;

  return (
    <>
      {hero.visible !== false ? (
        <PageHero
          title={renderAccentTitle(hero.title)}
          subtitle={hero.subtitle}
          cta={
            hero.ctaHref && hero.ctaLabel
              ? { href: hero.ctaHref, label: hero.ctaLabel }
              : { href: `mailto:${SITE.email}`, label: "Request a Quote" }
          }
        />
      ) : null}

      {intro.visible !== false ? (
        <Section background="white">
          <Container>
            <div className="grid items-start gap-10 md:grid-cols-2">
              <SectionHeading
                eyebrow={intro.eyebrow}
                title={renderAccentTitle(intro.title)}
              />
              <div className="space-y-4 text-aptus-sm leading-relaxed text-aptus-text-muted md:text-aptus-base">
                {intro.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
                <ReadMoreButton href={`mailto:${SITE.email}`} label="Request a Quote" />
              </div>
            </div>
          </Container>
        </Section>
      ) : null}

      {solutions.visible !== false ? (
        <Section background="muted">
          <Container>
            <SectionHeading
              eyebrow={solutions.eyebrow}
              title={renderAccentTitle(solutions.title)}
              align="center"
              className="mb-4"
            />
            <p className="mb-10 text-center text-aptus-sm text-aptus-text-muted md:text-aptus-base">
              {solutions.subtitle}
            </p>
            <div className="aptus-live-card-grid aptus-live-card-grid--3">
              {solutions.items.map((item) => (
                <article key={item.title} className="aptus-live-value-card flex flex-col">
                  <h3 className="aptus-live-value-card__title">{item.title}</h3>
                  <p className="aptus-live-value-card__body flex-1">{item.description}</p>
                  <div className="mt-5">
                    <ReadMoreButton href={`mailto:${SITE.email}`} label="Learn More" />
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {process.visible !== false ? (
        <Section background="white">
          <Container>
            <SectionHeading
              eyebrow={process.eyebrow}
              title={renderAccentTitle(process.title)}
              align="center"
              className="mb-10"
            />
            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
              {process.items.map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-aptus-primary text-lg font-semibold text-white">
                    {item.step}
                  </div>
                  <h3 className="mt-4 font-semibold text-aptus-text">{item.title}</h3>
                  <p className="mt-2 text-aptus-sm leading-relaxed text-aptus-text-muted">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
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
            <div className="aptus-live-card-grid aptus-live-card-grid--2">
              {whyChoose.items.map((item) => (
                <article key={item.title} className="aptus-live-value-card">
                  <h3 className="aptus-live-value-card__title">{item.title}</h3>
                  <p className="aptus-live-value-card__body">{item.description}</p>
                </article>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {content.showContactCta !== false ? <ContactCtaSection /> : null}
    </>
  );
}
