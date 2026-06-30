import Image from "next/image";
import { HeroEntrance } from "@/components/animations/RevealOnScroll";
import type { HeroSectionContent } from "@/types/sections";

export type HeroSectionProps = HeroSectionContent;

export function HeroSection({
  visible = true,
  presentation,
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
}: HeroSectionContent) {
  if (!visible) return null;

  void presentation;

  return (
    <section className="aptus-live-hero-banner">
      <HeroEntrance>
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={imageWidth}
          height={imageHeight}
          className="h-auto w-full"
          priority
        />
      </HeroEntrance>
    </section>
  );
}
