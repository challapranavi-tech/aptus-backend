export type AccentTitleContent = {
  before?: string;
  accent: string;
  after?: string;
};

export type CaseStudyItemContent = {
  title: string;
  description: string;
  pdfHref?: string;
  readMoreLabel?: string;
  imageSrc?: string;
  imageAlt?: string;
};

export type KeyProjectItemContent = {
  title: string;
  description: string;
  imageSrc?: string;
  imageAlt?: string;
};

export type CaseStudiesPartnerLogoContent = {
  src: string;
  alt: string;
};

export type CaseStudiesPageContent = {
  hero: {
    visible?: boolean;
    title: AccentTitleContent;
    subtitle: string;
    backgroundImage?: string;
  };
  caseStudies: {
    visible?: boolean;
    title: AccentTitleContent;
    items: CaseStudyItemContent[];
  };
  keyProjects?: {
    visible?: boolean;
    title: AccentTitleContent;
    items: KeyProjectItemContent[];
  };
  painPoints?: {
    visible?: boolean;
    title: AccentTitleContent;
    items: { title: string; description: string }[];
    closingParagraph: string;
  };
  whyChoose?: {
    visible?: boolean;
    eyebrow?: string;
    title: AccentTitleContent;
    items: { title: string; description: string }[];
  };
  transformCta?: {
    visible?: boolean;
    title: AccentTitleContent;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
  };
  testimonials?: {
    visible?: boolean;
    eyebrow: string;
    title: AccentTitleContent;
    subtitle?: string;
    items: {
      quote: string;
      authorName: string;
      authorRole: string;
      company: string;
    }[];
  };
  partnerships?: {
    visible?: boolean;
    title: AccentTitleContent;
    logos: CaseStudiesPartnerLogoContent[];
  };
  showContactCta?: boolean;
  contactCta?: {
    heading: string;
    subtitle?: string;
    showForm?: boolean;
    submitLabel?: string;
    layout?: "light";
  };
};
