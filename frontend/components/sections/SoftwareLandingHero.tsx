import { Container } from "@/components/ui";
import { isTopRequestQuoteCta } from "@/components/quote/quote-modal-utils";
import type { SoftwareLandingHero as SoftwareLandingHeroData } from "@/types";
import Link from "next/link";

interface SoftwareLandingHeroProps {
  data: SoftwareLandingHeroData;
}

const btnClass: Record<"blue" | "green" | "sky", string> = {
  blue: "aptus-software-btn-blue",
  green: "aptus-software-btn-green",
  sky: "aptus-software-btn-sky",
};

export function SoftwareLandingHero({ data }: SoftwareLandingHeroProps) {
  const actions = (data.actions ?? []).filter(
    (action) => !isTopRequestQuoteCta(action.label),
  );

  return (
    <section className="aptus-software-hero" data-section="software-landing-hero">
      <Container className="aptus-software-hero__inner aptus-software-container">
        {data.title && <h1 className="aptus-software-hero-title">{data.title}</h1>}
        {data.tagline && <h2 className="aptus-software-hero-tagline">{data.tagline}</h2>}
        {data.highlight && <h2 className="aptus-software-hero-highlight">{data.highlight}</h2>}
        {actions.length > 0 && (
          <div className="aptus-software-hero-actions">
            {actions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={`aptus-software-btn ${btnClass[action.tone ?? "blue"]}`}
              >
                {action.label}
              </Link>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
