/** Autodesk product category — matches Odoo selection values. */
export type AutodeskProductCategory =
  | "engineering_design"
  | "aec_bim"
  | "water_infrastructure";

export type AutodeskProductCategoryLabel =
  | "Engineering Design"
  | "AEC & BIM"
  | "Water Infrastructure";

export const AUTODESK_CATEGORY_LABELS: Record<AutodeskProductCategory, AutodeskProductCategoryLabel> = {
  engineering_design: "Engineering Design",
  aec_bim: "AEC & BIM",
  water_infrastructure: "Water Infrastructure",
};

export type AutodeskProductFeature = {
  title: string;
  description: string;
  icon?: string;
};

export type AutodeskProductBenefit = {
  title: string;
  description: string;
  kind?: "business" | "roi";
};

export type AutodeskProductIndustry = {
  title: string;
  description: string;
  icon?: string;
};

export type AutodeskProductMediaItem = {
  type: "image" | "video";
  title?: string;
  url: string;
  thumbnailUrl?: string;
};

export type AutodeskProductDownload = {
  title: string;
  description?: string;
  url: string;
  fileType?: string;
};

export type AutodeskProductFaq = {
  question: string;
  answer: string;
};

export type AutodeskProductTestimonial = {
  quote: string;
  author: string;
  role?: string;
  company?: string;
};

export type AutodeskProductSummary = {
  id: number;
  slug: string;
  name: string;
  category: AutodeskProductCategory;
  categoryLabel: AutodeskProductCategoryLabel;
  heroTitle: string;
  heroSubtitle: string;
  productBadge?: string;
  productIcon?: string;
  isFeatured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type AutodeskProductContent = AutodeskProductSummary & {
  heroImage?: string;
  productDescription: string;
  productOverview: string;
  highlights: string[];
  features: AutodeskProductFeature[];
  benefits: AutodeskProductBenefit[];
  industries: AutodeskProductIndustry[];
  media: AutodeskProductMediaItem[];
  downloads: AutodeskProductDownload[];
  faqs: AutodeskProductFaq[];
  testimonials: AutodeskProductTestimonial[];
  ctaText?: string;
  ctaButtonLabel: string;
  ctaButtonUrl: string;
  seoKeywords?: string;
  ogImage?: string;
  relatedProducts: AutodeskProductSummary[];
  source: "odoo" | "static";
};

export type AutodeskProductLeadType = "contact" | "demo" | "quote" | "download";

export type AutodeskProductLeadPayload = {
  leadType: AutodeskProductLeadType;
  productSlug: string;
  productName: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
};
