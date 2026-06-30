import Image from "next/image";
import { RevealOnScroll } from "@/components/animations/RevealOnScroll";
import type { TestimonialSectionContent } from "@/types/sections";

export type TestimonialSectionProps = TestimonialSectionContent;

export function TestimonialSection({
  visible = true,
  quote,
  authorName,
  authorTitle,
  authorImageSrc,
  backgroundImageSrc,
}: TestimonialSectionProps) {
  if (!visible) return null;

  return (
    <section
      className="aptus-live-testimonial"
      style={{ backgroundImage: `url(${backgroundImageSrc})` }}
    >
      <div className="aptus-live-testimonial__inner">
        <RevealOnScroll>
          <blockquote className="aptus-live-testimonial__quote">{quote}</blockquote>
          <footer>
            <Image
              src={authorImageSrc}
              alt={authorName}
              width={94}
              height={94}
              className="aptus-live-testimonial__avatar"
            />
            <cite className="not-italic">
              <span className="aptus-live-testimonial__name">{authorName}</span>
              <span className="aptus-live-testimonial__role">{authorTitle}</span>
            </cite>
          </footer>
        </RevealOnScroll>
      </div>
    </section>
  );
}
