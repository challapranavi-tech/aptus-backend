import { KeyEnablersSection } from "@/components/sections";
import {
  ContactCtaSection,
  InfoCard,
  PageHero,
} from "@/components/pages/shared/MarketingSections";
import {
  Card,
  CardBody,
  CardTitle,
  Container,
  ReadMoreButton,
  Section,
  SectionHeading,
} from "@/components/ui";
import { buildKeyEnablersSectionContent } from "@/lib/cms/homepage-content";
import { renderAccentTitle } from "@/lib/cms/render-accent-title";
import { SITE } from "@/lib/constants";
import type { MarketingPageContent } from "@/types/marketing-page";

type MarketingPageViewProps = {
  content: MarketingPageContent;
};

/** Composes flexible marketing page sections from typed CMS content. */
export function MarketingPageView({ content }: MarketingPageViewProps) {
  const hero = content.hero;
  const intro = content.intro;
  const cards = content.cards;
  const lists = content.lists ?? [];
  const team = content.team;
  const certifications = content.certifications;
  const contactInfo = content.contactInfo;
  const text = content.text;

  return (
    <>
      {hero && hero.visible !== false ? (
        <PageHero
          title={renderAccentTitle(hero.title)}
          subtitle={hero.subtitle}
          cta={
            hero.ctaHref && hero.ctaLabel
              ? { href: hero.ctaHref, label: hero.ctaLabel }
              : undefined
          }
        />
      ) : null}

      {intro && intro.visible !== false ? (
        <Section background="white">
          <Container>
            {intro.title || intro.eyebrow ? (
              <SectionHeading
                eyebrow={intro.eyebrow}
                title={intro.title ? renderAccentTitle(intro.title) : undefined}
                className="mb-8"
              />
            ) : null}
            <div className="mx-auto max-w-4xl space-y-4">
              {intro.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="aptus-live-lead">
                  {paragraph}
                </p>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {text && text.visible !== false ? (
        <Section background={text.background ?? "white"}>
          <Container className={text.align === "center" ? "text-center" : undefined}>
            {text.title || text.eyebrow ? (
              <SectionHeading
                eyebrow={text.eyebrow}
                title={text.title ? renderAccentTitle(text.title) : undefined}
                align={text.align ?? "left"}
                className="mb-8"
              />
            ) : null}
            <div
              className={`space-y-4 text-aptus-sm leading-relaxed text-aptus-text-muted md:text-aptus-base ${text.align === "center" ? "mx-auto max-w-4xl" : "max-w-4xl"}`}
            >
              {text.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {cards && cards.visible !== false ? (
        <Section background="muted">
          <Container>
            {cards.title || cards.eyebrow ? (
              <SectionHeading
                eyebrow={cards.eyebrow}
                title={cards.title ? renderAccentTitle(cards.title) : undefined}
                align={cards.align ?? "center"}
                className="mb-10"
              />
            ) : null}
            <div className="aptus-live-card-grid aptus-live-card-grid--2">
              {cards.items.map((item) => (
                <InfoCard key={item.title} title={item.title} body={item.body} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {(content.cardSections ?? []).map((section, index) =>
        section.visible === false ? null : (
          <Section
            key={section.id}
            background={index % 2 === 0 ? "white" : "muted"}
          >
            <Container>
              {section.title || section.eyebrow ? (
                <SectionHeading
                  eyebrow={section.eyebrow}
                  title={section.title ? renderAccentTitle(section.title) : undefined}
                  align={section.align ?? "center"}
                  className="mb-10"
                />
              ) : null}
              <div className="aptus-live-card-grid aptus-live-card-grid--3">
                {section.items.map((item) => (
                  <article key={item.title} className="aptus-live-value-card">
                    <h3 className="aptus-live-value-card__title">{item.title}</h3>
                    <p className="aptus-live-value-card__body">{item.body}</p>
                  </article>
                ))}
              </div>
            </Container>
          </Section>
        ),
      )}

      {lists.map((list) =>
        list.visible === false ? null : (
          <Section key={list.id} background="white">
            <Container>
              {list.title || list.eyebrow ? (
                <SectionHeading
                  eyebrow={list.eyebrow}
                  title={list.title ? renderAccentTitle(list.title) : undefined}
                  className="mb-6"
                />
              ) : null}
              <ul className="space-y-3 text-aptus-sm leading-relaxed text-aptus-text-muted md:text-aptus-base">
                {list.items.map((item) => (
                  <li key={item.slice(0, 48)} className="flex gap-2">
                    <span className="text-aptus-primary" aria-hidden>
                      •
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Container>
          </Section>
        ),
      )}

      {team && team.visible !== false ? (
        <Section background="white">
          <Container>
            {team.title || team.eyebrow ? (
              <SectionHeading
                eyebrow={team.eyebrow}
                title={team.title ? renderAccentTitle(team.title) : undefined}
                align="center"
                className="mb-10"
              />
            ) : null}
            <div className="grid gap-8 md:grid-cols-2">
              {team.members.map((member) => (
                <Card key={member.name} variant="standard">
                  <CardTitle>{member.name}</CardTitle>
                  <p className="mt-1 text-aptus-sm font-medium text-aptus-brand">{member.role}</p>
                  <CardBody className="mt-4">{member.bio}</CardBody>
                </Card>
              ))}
            </div>
            {team.closingParagraphs?.length ? (
              <div className="mx-auto mt-10 max-w-4xl space-y-4 text-aptus-sm leading-relaxed text-aptus-text-muted md:text-aptus-base">
                {team.closingParagraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
            ) : null}
          </Container>
        </Section>
      ) : null}

      {certifications && certifications.visible !== false ? (
        <Section background="muted">
          <Container>
            {certifications.title || certifications.eyebrow ? (
              <SectionHeading
                eyebrow={certifications.eyebrow}
                title={
                  certifications.title ? renderAccentTitle(certifications.title) : undefined
                }
                align="center"
                className="mb-4"
              />
            ) : null}
            {certifications.intro ? (
              <p className="mx-auto mb-10 max-w-3xl text-center text-aptus-sm leading-relaxed text-aptus-text-muted md:text-aptus-base">
                {certifications.intro}
              </p>
            ) : null}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {certifications.items.map((item) => (
                <Card key={item.title} variant="standard" className="flex flex-col">
                  <CardTitle>{item.title}</CardTitle>
                  <CardBody className="flex-1">{item.description}</CardBody>
                  {item.downloadHref ? (
                    <div className="mt-5">
                      <ReadMoreButton
                        href={item.downloadHref}
                        label={item.downloadLabel ?? "Download"}
                      />
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
            {certifications.footerParagraph ? (
              <p className="mx-auto mt-10 max-w-4xl text-center text-aptus-sm leading-relaxed text-aptus-text-muted md:text-aptus-base">
                {certifications.footerParagraph}
              </p>
            ) : null}
          </Container>
        </Section>
      ) : null}

      {contactInfo && contactInfo.visible !== false ? (
        <Section background="white">
          <Container className="text-center">
            {contactInfo.title ? (
              <SectionHeading
                title={renderAccentTitle(contactInfo.title)}
                align="center"
                className="mb-4"
              />
            ) : null}
            {contactInfo.subtitle ? (
              <p className="mb-8 text-aptus-sm uppercase tracking-wide text-aptus-text-muted">
                {contactInfo.subtitle}
              </p>
            ) : null}
            <div className="mx-auto max-w-2xl space-y-4 text-aptus-sm leading-relaxed text-aptus-text-muted md:text-aptus-base">
              {contactInfo.address ? <p>{contactInfo.address}</p> : null}
              {contactInfo.email ? (
                <p>
                  <a href={`mailto:${contactInfo.email}`} className="text-aptus-primary hover:underline">
                    {contactInfo.email}
                  </a>
                </p>
              ) : null}
              {contactInfo.phone ? (
                <p>
                  <a
                    href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                    className="text-aptus-primary hover:underline"
                  >
                    {contactInfo.phone}
                  </a>
                </p>
              ) : null}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <ReadMoreButton href={`mailto:${SITE.email}`} label="Email Us" />
              <ReadMoreButton
                href={SITE.mapUrl}
                label="View on Map"
                variant="secondary"
              />
            </div>
          </Container>
        </Section>
      ) : null}

      {content.showKeyEnablers ? <KeyEnablersSection {...buildKeyEnablersSectionContent()} /> : null}

      {content.showPartnerships ? (
        <Section background="white">
          <Container className="text-center">
            <SectionHeading
              eyebrow="Partnerships"
              title={renderAccentTitle({
                before: "Winning together with",
                accent: "Strategic Alliances",
              })}
              align="center"
            />
            <p className="mx-auto mt-6 max-w-3xl text-aptus-sm leading-relaxed text-aptus-text-muted md:text-aptus-base">
              As Gold Partners of leading ISVs including Autodesk, Adobe, and Oracle, we combine
              genuine licensing with implementation expertise — helping clients across sectors adopt
              the right technology with confidence.
            </p>
          </Container>
        </Section>
      ) : null}

      {content.showContactCta !== false ? <ContactCtaSection /> : null}
    </>
  );
}
