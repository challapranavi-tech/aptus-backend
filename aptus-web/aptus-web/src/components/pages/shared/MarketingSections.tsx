import { AccentSpan, Button, Container, ReadMoreButton, Section, SectionHeading } from "@/components/ui";
import { SITE } from "@/lib/constants";

type PageHeroProps = {
  title: React.ReactNode;
  subtitle?: string;
  cta?: { href: string; label: string };
  centered?: boolean;
};

export function PageHero({ title, subtitle, cta, centered = true }: PageHeroProps) {
  return (
    <Section background="muted" spacing="featured">
      <Container className={centered ? "text-center" : undefined}>
        <h1 className="aptus-live-title">{title}</h1>
        {subtitle ? <p className="aptus-live-lead mt-4">{subtitle}</p> : null}
        {cta ? (
          <div className="mt-8">
            <ReadMoreButton href={cta.href} label={cta.label} />
          </div>
        ) : null}
      </Container>
    </Section>
  );
}

type InfoCardProps = {
  title: string;
  body: string;
};

export function InfoCard({ title, body }: InfoCardProps) {
  return (
    <article className="aptus-live-value-card">
      <h3 className="aptus-live-value-card__title">{title}</h3>
      <p className="aptus-live-value-card__body">{body}</p>
    </article>
  );
}

export function ContactCtaSection() {
  return (
    <Section background="primary">
      <Container className="text-center">
        <SectionHeading
          eyebrow="Get in touch"
          title={
            <>
              Have questions? <AccentSpan className="text-aptus-accent">We can help</AccentSpan>
            </>
          }
          align="center"
          className="[&_h2]:text-white [&_p]:text-aptus-text-inverse/90"
        />
        <p className="mx-auto mt-4 max-w-2xl text-aptus-sm leading-relaxed text-white/90 md:text-aptus-base">
          Speak with our team about software, ELV, or IT solutions tailored to your business in Oman.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <ReadMoreButton href={`mailto:${SITE.email}`} label="Email Us" />
          <Button href={`tel:${SITE.phone.replace(/\s/g, "")}`} variant="outline-light" size="md">
            {SITE.phone}
          </Button>
        </div>
      </Container>
    </Section>
  );
}
