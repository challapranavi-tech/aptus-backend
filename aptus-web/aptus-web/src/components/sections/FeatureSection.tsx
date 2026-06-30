import Image from "next/image";
import Link from "next/link";
import { RevealOnScroll } from "@/components/animations/RevealOnScroll";
import { AccentTitle } from "@/components/sections/AccentTitle";
import type { FeatureSectionContent } from "@/types/sections";

export type FeatureSectionProps = FeatureSectionContent;

export function FeatureSection({
  visible = true,
  presentation,
  eyebrow,
  title,
  description,
  imageSrc,
  imageAlt,
  href,
  imagePosition = "left",
  background = "white",
}: FeatureSectionProps) {
  if (!visible) return null;

  void presentation;

  const sectionClass =
    background === "muted"
      ? "aptus-live-section aptus-live-section--muted"
      : "aptus-live-section";

  return (
    <section className={sectionClass}>
      <div className="aptus-live-container">
        <div
          className={`aptus-live-feature ${imagePosition === "right" ? "aptus-live-feature--image-right" : "aptus-live-feature--image-left"}`}
        >
          <RevealOnScroll className="aptus-live-feature__media" delay={0.05}>
            <Image src={imageSrc} alt={imageAlt} width={500} height={410} />
          </RevealOnScroll>
          <RevealOnScroll className="aptus-live-feature__content" delay={0.12}>
            {eyebrow ? <p className="aptus-live-eyebrow">{eyebrow}</p> : null}
            <h2 className="aptus-live-title">
              <AccentTitle {...title} />
            </h2>
            <p className="aptus-live-lead">{description}</p>
            <Link href={href} className="aptus-live-btn">
              Read More
            </Link>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
