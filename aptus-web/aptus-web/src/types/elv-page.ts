import type { AccentTitleContent } from "@/types/sections";

export type ElvHeroContent = {
  id: string;
  visible?: boolean;
  title: AccentTitleContent;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type ElvIntroContent = {
  id: string;
  visible?: boolean;
  eyebrow: string;
  title: AccentTitleContent;
  paragraphs: string[];
};

export type ElvSolutionItemContent = {
  title: string;
  description: string;
};

export type ElvSolutionsGridContent = {
  id: string;
  visible?: boolean;
  eyebrow: string;
  title: AccentTitleContent;
  subtitle: string;
  items: ElvSolutionItemContent[];
};

export type ElvProcessStepContent = {
  step: string;
  title: string;
  description: string;
};

export type ElvProcessContent = {
  id: string;
  visible?: boolean;
  eyebrow: string;
  title: AccentTitleContent;
  items: ElvProcessStepContent[];
};

export type ElvWhyChooseItemContent = {
  title: string;
  description: string;
};

export type ElvWhyChooseContent = {
  id: string;
  visible?: boolean;
  eyebrow: string;
  title: AccentTitleContent;
  items: ElvWhyChooseItemContent[];
};

export type ElvPageContent = {
  metaTitle: string | null;
  metaDescription: string | null;
  source: "static" | "odoo";
  hero: ElvHeroContent;
  intro: ElvIntroContent;
  solutions: ElvSolutionsGridContent;
  process: ElvProcessContent;
  whyChoose: ElvWhyChooseContent;
  showContactCta?: boolean;
};
