import type { AccentTitleContent } from "@/types/sections";

export type CaseStudiesHeroContent = {
  id: string;
  visible?: boolean;
  title: AccentTitleContent;
  subtitle: string;
  backgroundImage?: string;
};

export type CaseStudyItemContent = {
  title: string;
  description: string;
  pdfHref: string;
  readMoreLabel?: string;
  imageSrc?: string;
  imageAlt?: string;
};

export type CaseStudiesPartnerLogoContent = {
  src: string;
  alt: string;
};

export type CaseStudiesPartnershipsContent = {
  id: string;
  visible?: boolean;
  title: AccentTitleContent;
  logos: CaseStudiesPartnerLogoContent[];
};

export type CaseStudiesGridContent = {
  id: string;
  visible?: boolean;
  eyebrow?: string;
  title: AccentTitleContent;
  items: CaseStudyItemContent[];
};

export type PainPointItemContent = {
  title: string;
  description: string;
};

export type PainPointsContent = {
  id: string;
  visible?: boolean;
  title: AccentTitleContent;
  items: PainPointItemContent[];
  closingParagraph: string;
};

export type CaseStudiesWhyChooseItemContent = {
  title: string;
  description: string;
};

export type CaseStudiesWhyChooseContent = {
  id: string;
  visible?: boolean;
  eyebrow: string;
  title: AccentTitleContent;
  items: CaseStudiesWhyChooseItemContent[];
};

export type TransformCtaContent = {
  id: string;
  visible?: boolean;
  title: AccentTitleContent;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
};

export type CaseStudyTestimonialItemContent = {
  quote: string;
  authorName: string;
  authorRole: string;
  company: string;
};

export type CaseStudyTestimonialsContent = {
  id: string;
  visible?: boolean;
  eyebrow: string;
  title: AccentTitleContent;
  subtitle?: string;
  items: CaseStudyTestimonialItemContent[];
};

export type CaseStudiesPageContent = {
  metaTitle: string | null;
  metaDescription: string | null;
  source: "static" | "odoo";
  hero: CaseStudiesHeroContent;
  caseStudies: CaseStudiesGridContent;
  painPoints: PainPointsContent;
  whyChoose: CaseStudiesWhyChooseContent;
  transformCta: TransformCtaContent;
  testimonials: CaseStudyTestimonialsContent;
  partnerships?: CaseStudiesPartnershipsContent;
  showContactCta?: boolean;
};
