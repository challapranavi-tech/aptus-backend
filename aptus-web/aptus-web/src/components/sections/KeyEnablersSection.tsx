import { RevealOnScroll } from "@/components/animations/RevealOnScroll";
import { AccentTitle } from "@/components/sections/AccentTitle";
import type { KeyEnablersSectionContent } from "@/types/sections";

export type KeyEnablersSectionProps = KeyEnablersSectionContent;

export function KeyEnablersSection({
  visible = true,
  presentation,
  eyebrow,
  title,
  subtitle,
  items,
}: KeyEnablersSectionProps) {
  if (!visible) return null;

  void presentation;

  return (
    <section className="aptus-live-section">
      <div className="aptus-live-container">
        <div className="aptus-live-enablers">
          <RevealOnScroll className="text-center lg:text-center">
            <p className="aptus-live-eyebrow aptus-live-eyebrow--services">{eyebrow}</p>
            <h2 className="aptus-live-title">
              <AccentTitle {...title} />
            </h2>
            <p className="aptus-live-lead mt-4">{subtitle}</p>
          </RevealOnScroll>
          <div>
            {items.map((item, index) => (
              <RevealOnScroll key={item.number} delay={0.06 * index}>
                <article className="aptus-live-enabler-card">
                  <p className="aptus-live-enabler-card__num">{item.number}</p>
                  <h3 className="aptus-live-enabler-card__title">{item.title}</h3>
                  <p className="aptus-live-enabler-card__body">{item.description}</p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
