import type { CmsPresentationSettings } from "@/lib/design-system/presentation";

export type AccentTitleContent = {
  before: string;
  accent: string;
  after?: string;
};

export type ServiceIconType = "lightbulb" | "cog" | "bim";

export type SectionBase = {
  id: string;
  visible?: boolean;
  presentation?: CmsPresentationSettings;
};

export type HeroSectionContent = SectionBase & {
  imageSrc: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
};

export type FeatureSectionContent = SectionBase & {
  eyebrow: string;
  title: AccentTitleContent;
  description: string;
  imageSrc: string;
  imageAlt: string;
  href: string;
  imagePosition?: "left" | "right";
  background?: "white" | "muted";
};

export type ServiceItemContent = {
  title: string;
  description: string;
  icon: ServiceIconType;
  hoverImageSrc?: string;
};

export type ServicesSectionContent = SectionBase & {
  eyebrow: string;
  title: AccentTitleContent;
  items: ServiceItemContent[];
};

export type KeyEnablerItemContent = {
  number: string;
  title: string;
  description: string;
};

export type KeyEnablersSectionContent = SectionBase & {
  eyebrow: string;
  title: AccentTitleContent;
  subtitle: string;
  items: KeyEnablerItemContent[];
};

export type TestimonialSectionContent = SectionBase & {
  quote: string;
  authorName: string;
  authorTitle: string;
  authorImageSrc: string;
  backgroundImageSrc: string;
};

export type HomePageContent = {
  metaTitle: string | null;
  metaDescription: string | null;
  source: "static" | "odoo";
  hero: HeroSectionContent;
  features: FeatureSectionContent[];
  services: ServicesSectionContent;
  keyEnablers: KeyEnablersSectionContent;
  testimonial: TestimonialSectionContent;
};
