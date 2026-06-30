/** CMS JSON stored in Odoo `x_etap_sections_json` on website.page (/etap). */

export type EtapTitlePart = {
  before?: string;
  accent?: string;
  after?: string;
};

export type EtapSectionTitle = string | EtapTitlePart;

export type EtapCtaLink = {
  label: string;
  href: string;
};

export type EtapHeroContent = {
  id?: string;
  visible?: boolean;
  aptusLogoSrc?: string;
  aptusLogoAlt?: string;
  etapLogoSrc?: string;
  etapLogoAlt?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  heroImageSrc?: string;
  heroImageAlt?: string;
  primaryCta?: EtapCtaLink;
  secondaryCta?: EtapCtaLink;
};

export type EtapOverviewContent = {
  id?: string;
  visible?: boolean;
  title?: EtapSectionTitle;
  subtitle?: string;
  paragraphs?: string[];
  checklist?: string[];
  highlightTitle?: string;
  highlightDescription?: string;
};

export type EtapSolutionItemContent = {
  title: string;
  description: string;
  icon?: string;
};

export type EtapSolutionsContent = {
  id?: string;
  visible?: boolean;
  eyebrow?: string;
  title?: EtapSectionTitle;
  subtitle?: string;
  items?: EtapSolutionItemContent[];
};

export type EtapBenefitItemContent = {
  title: string;
  icon?: string;
};

export type EtapBenefitsContent = {
  id?: string;
  visible?: boolean;
  title?: EtapSectionTitle;
  subtitle?: string;
  items?: EtapBenefitItemContent[];
};

export type EtapIndustryItemContent = {
  title: string;
  imageSrc?: string;
  imageAlt?: string;
  icon?: string;
};

export type EtapIndustriesContent = {
  id?: string;
  visible?: boolean;
  title?: EtapSectionTitle;
  subtitle?: string;
  items?: EtapIndustryItemContent[];
};

export type EtapPartnerItemContent = {
  title: string;
  description: string;
  icon?: string;
};

export type EtapPartnerContent = {
  id?: string;
  visible?: boolean;
  eyebrow?: string;
  title?: EtapSectionTitle;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  items?: EtapPartnerItemContent[];
};

export type EtapTestimonialItemContent = {
  quote: string;
  authorName: string;
  authorTitle?: string;
  authorCompany?: string;
  authorPhotoSrc?: string;
  companyLogoSrc?: string;
};

export type EtapTestimonialsContent = {
  id?: string;
  visible?: boolean;
  title?: string;
  subtitle?: string;
  items?: EtapTestimonialItemContent[];
};

export type EtapFaqItemContent = {
  question: string;
  answerHtml?: string;
  answer?: string;
};

export type EtapFaqsContent = {
  id?: string;
  visible?: boolean;
  title?: string;
  items?: EtapFaqItemContent[];
};

export type EtapCtaContent = {
  id?: string;
  visible?: boolean;
  title?: string;
  description?: string;
  primaryCta?: EtapCtaLink;
  secondaryCta?: EtapCtaLink;
  tertiaryCta?: EtapCtaLink;
};

export type EtapStatisticsItemContent = {
  value: string;
  label: string;
};

export type EtapStatisticsContent = {
  id?: string;
  visible?: boolean;
  items?: EtapStatisticsItemContent[];
};

export type EtapPageSections = {
  hero?: EtapHeroContent;
  overview?: EtapOverviewContent;
  solutions?: EtapSolutionsContent;
  benefits?: EtapBenefitsContent;
  industries?: EtapIndustriesContent;
  statistics?: EtapStatisticsContent;
  /** Primary key — `whyAptus` is accepted as an alias when reading Odoo JSON. */
  partner?: EtapPartnerContent;
  whyAptus?: EtapPartnerContent;
  testimonials?: EtapTestimonialsContent;
  faqs?: EtapFaqsContent;
  cta?: EtapCtaContent;
};

export type EtapPageContent = EtapPageSections & {
  metaTitle?: string;
  metaDescription?: string;
  source?: "odoo" | "default";
};

export type OdooEtapPageSectionsJson = EtapPageSections;
