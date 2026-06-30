import type {
  AutodeskProductBenefit,
  AutodeskProductCategory,
  AutodeskProductContent,
  AutodeskProductDownload,
  AutodeskProductFaq,
  AutodeskProductFeature,
  AutodeskProductIndustry,
  AutodeskProductMediaItem,
  AutodeskProductSummary,
  AutodeskProductTestimonial,
} from "@/types/autodesk-product";
import { AUTODESK_CATEGORY_LABELS } from "@/types/autodesk-product";

/** Raw Odoo `aptus.autodesk.product` record shape. */
export type OdooAutodeskProductRecord = {
  id: number;
  name: string;
  url_slug: string;
  active: boolean;
  is_published: boolean;
  is_featured: boolean;
  product_category: AutodeskProductCategory | false;
  product_icon?: string | false;
  product_badge?: string | false;
  hero_title?: string | false;
  hero_subtitle?: string | false;
  hero_image?: string | false;
  product_description?: string | false;
  product_overview?: string | false;
  highlights_json?: string | false;
  key_benefits_json?: string | false;
  features_json?: string | false;
  industry_applications_json?: string | false;
  media_json?: string | false;
  downloads_json?: string | false;
  faqs_json?: string | false;
  testimonials_json?: string | false;
  cta_text?: string | false;
  cta_button_label?: string | false;
  cta_button_url?: string | false;
  seo_title?: string | false;
  seo_description?: string | false;
  seo_keywords?: string | false;
  og_image?: string | false;
  related_product_ids?: number[] | [number, string][];
  sequence?: number;
};

export function getAutodeskProductModelName(): string {
  return process.env.ODOO_AUTODESK_PRODUCT_MODEL?.trim() || "aptus.autodesk.product";
}

function parseJsonArray<T>(raw: string | false | null | undefined): T[] {
  if (!raw || typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function normalizeCategory(raw: AutodeskProductCategory | false): AutodeskProductCategory {
  if (raw === "engineering_design" || raw === "aec_bim" || raw === "water_infrastructure") {
    return raw;
  }
  return "engineering_design";
}

export function mapOdooAutodeskProductSummary(
  record: OdooAutodeskProductRecord,
): AutodeskProductSummary {
  const category = normalizeCategory(record.product_category);
  return {
    id: record.id,
    slug: record.url_slug,
    name: record.name,
    category,
    categoryLabel: AUTODESK_CATEGORY_LABELS[category],
    heroTitle: record.hero_title || record.name,
    heroSubtitle: record.hero_subtitle || "",
    productBadge: record.product_badge || undefined,
    productIcon: record.product_icon || undefined,
    isFeatured: Boolean(record.is_featured),
    seoTitle: record.seo_title || null,
    seoDescription: record.seo_description || null,
  };
}

export function mapOdooAutodeskProductContent(
  record: OdooAutodeskProductRecord,
  related: AutodeskProductSummary[] = [],
): AutodeskProductContent {
  const summary = mapOdooAutodeskProductSummary(record);

  return {
    ...summary,
    heroImage: record.hero_image || undefined,
    productDescription: record.product_description || "",
    productOverview: record.product_overview || "",
    highlights: parseJsonArray<string>(record.highlights_json).filter(
      (item) => typeof item === "string" && item.trim(),
    ),
    features: parseJsonArray<AutodeskProductFeature>(record.features_json),
    benefits: parseJsonArray<AutodeskProductBenefit>(record.key_benefits_json),
    industries: parseJsonArray<AutodeskProductIndustry>(record.industry_applications_json),
    media: parseJsonArray<AutodeskProductMediaItem>(record.media_json),
    downloads: parseJsonArray<AutodeskProductDownload>(record.downloads_json),
    faqs: parseJsonArray<AutodeskProductFaq>(record.faqs_json),
    testimonials: parseJsonArray<AutodeskProductTestimonial>(record.testimonials_json),
    ctaText: record.cta_text || undefined,
    ctaButtonLabel: record.cta_button_label || "Request a Quote",
    ctaButtonUrl: record.cta_button_url || `mailto:info@aptusinfotech.com`,
    seoKeywords: record.seo_keywords || undefined,
    ogImage: record.og_image || record.hero_image || undefined,
    relatedProducts: related,
    source: "odoo",
  };
}

export const AUTODESK_PRODUCT_FIELDS: string[] = [
  "name",
  "url_slug",
  "active",
  "is_published",
  "is_featured",
  "product_category",
  "product_icon",
  "product_badge",
  "hero_title",
  "hero_subtitle",
  "hero_image",
  "product_description",
  "product_overview",
  "highlights_json",
  "key_benefits_json",
  "features_json",
  "industry_applications_json",
  "media_json",
  "downloads_json",
  "faqs_json",
  "testimonials_json",
  "cta_text",
  "cta_button_label",
  "cta_button_url",
  "seo_title",
  "seo_description",
  "seo_keywords",
  "og_image",
  "related_product_ids",
  "sequence",
];

export const AUTODESK_PRODUCT_SUMMARY_FIELDS: string[] = [
  "name",
  "url_slug",
  "is_published",
  "is_featured",
  "product_category",
  "product_icon",
  "product_badge",
  "hero_title",
  "hero_subtitle",
  "seo_title",
  "seo_description",
  "sequence",
];
