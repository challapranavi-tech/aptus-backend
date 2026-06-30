import type { AccentTitleContent } from "@/types/sections";

export type SoftwareHeroContent = {
  id: string;
  visible?: boolean;
  title: AccentTitleContent;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type SoftwareIntroContent = {
  id: string;
  visible?: boolean;
  eyebrow: string;
  title: AccentTitleContent;
  paragraphs: string[];
};

export type SoftwareCategoryItemContent = {
  title: string;
  description: string;
};

export type SoftwareCategoriesGridContent = {
  id: string;
  visible?: boolean;
  eyebrow: string;
  title: AccentTitleContent;
  subtitle: string;
  items: SoftwareCategoryItemContent[];
};

export type SoftwareProcessStepContent = {
  step: string;
  title: string;
  description: string;
};

export type SoftwareProcessContent = {
  id: string;
  visible?: boolean;
  eyebrow: string;
  title: AccentTitleContent;
  items: SoftwareProcessStepContent[];
};

export type SoftwareWhyChooseItemContent = {
  title: string;
  description: string;
};

export type SoftwareWhyChooseContent = {
  id: string;
  visible?: boolean;
  eyebrow: string;
  title: AccentTitleContent;
  items: SoftwareWhyChooseItemContent[];
};

export type SoftwarePageContent = {
  metaTitle: string | null;
  metaDescription: string | null;
  source: "static" | "odoo";
  hero: SoftwareHeroContent;
  intro: SoftwareIntroContent;
  categories: SoftwareCategoriesGridContent;
  process: SoftwareProcessContent;
  whyChoose: SoftwareWhyChooseContent;
  showContactCta?: boolean;
};
