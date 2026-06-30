import {
  FeatureSection,
  HeroSection,
  KeyEnablersSection,
  ServicesSection,
  TestimonialSection,
} from "@/components/sections";
import type { HomePageContent } from "@/types/sections";

type HomePageViewProps = {
  content: HomePageContent;
};

/** Composes all homepage sections from typed CMS content. */
export function HomePageView({ content }: HomePageViewProps) {
  return (
    <>
      <HeroSection {...content.hero} />
      {content.features.map((feature) => (
        <FeatureSection key={feature.id} {...feature} />
      ))}
      <ServicesSection {...content.services} />
      <KeyEnablersSection {...content.keyEnablers} />
      <TestimonialSection {...content.testimonial} />
    </>
  );
}
