import {
  AUTODESK_INNER_PAGE_DEFS,
  type AutodeskInnerPageKey,
} from "@/lib/cms/autodesk-inner-registry";
import { getAutodeskInnerContent } from "@/lib/cms/autodesk-pages-content";
import { getSoftwareInnerPageKeyBySlug } from "@/lib/cms/software-inner-pages-content";
import { SITE } from "@/lib/constants";
import type {
  AutodeskProductCategory,
  AutodeskProductContent,
  AutodeskProductFeature,
} from "@/types/autodesk-product";
import { AUTODESK_CATEGORY_LABELS } from "@/types/autodesk-product";
import type { MarketingPageContent } from "@/types/marketing-page";
import { fetchAutodeskProductBySlug } from "@/lib/server/odoo/autodesk-products";

const SLUG_CATEGORY: Record<string, AutodeskProductCategory> = {
  autocad: "engineering_design",
  "3ds-max": "engineering_design",
  revit: "engineering_design",
  "civil-3d": "engineering_design",
  "autocad-lt": "engineering_design",
  "aec-collection": "aec_bim",
  "bim-collaborate-pro": "aec_bim",
  "autodesk-docs": "aec_bim",
  "autodesk-build": "aec_bim",
  "autodesk-takeoff": "aec_bim",
  navisworks: "aec_bim",
  infodrainage: "water_infrastructure",
  "infowater-pro": "water_infrastructure",
  "infoworks-icm": "water_infrastructure",
  "infoworks-ws-pro": "water_infrastructure",
};

function registryDefForSlug(slug: string) {
  const normalized = slug.replace(/^\//, "");
  return AUTODESK_INNER_PAGE_DEFS.find((def) => def.path.replace(/^\//, "") === normalized);
}

function mapMarketingToAutodeskProduct(
  slug: string,
  content: MarketingPageContent,
  label: string,
  category: AutodeskProductCategory,
): AutodeskProductContent {
  const features: AutodeskProductFeature[] =
    content.cardSections?.[0]?.items.map((item) => ({
      title: item.title,
      description: item.body,
    })) ?? [];

  const benefits =
    content.cardSections?.[1]?.items.map((item) => ({
      title: item.title,
      description: item.body,
      kind: "business" as const,
    })) ?? [];

  return {
    id: 0,
    slug: slug.replace(/^\//, ""),
    name: label,
    category,
    categoryLabel: AUTODESK_CATEGORY_LABELS[category],
    heroTitle: content.hero?.title.accent || label,
    heroSubtitle: content.hero?.subtitle || content.metaDescription || "",
    isFeatured: false,
    seoTitle: content.metaTitle,
    seoDescription: content.metaDescription,
    productDescription: content.intro?.paragraphs.join("\n\n") || "",
    productOverview: content.intro?.paragraphs[0] || "",
    highlights: content.intro?.paragraphs.slice(1) ?? [],
    features,
    benefits,
    industries: [],
    media: [],
    downloads: [],
    faqs: [],
    testimonials: [],
    ctaButtonLabel: content.hero?.ctaLabel || "Request a Quote",
    ctaButtonUrl: content.hero?.ctaHref || `mailto:${SITE.email}`,
    relatedProducts: [],
    source: "static",
  };
}

function staticAutodeskProduct(slug: string): AutodeskProductContent | null {
  const normalized = slug.replace(/^\//, "");
  const def = registryDefForSlug(normalized);
  if (!def) return null;

  const key = getSoftwareInnerPageKeyBySlug(normalized) as AutodeskInnerPageKey | null;
  const marketing = key ? getAutodeskInnerContent(key) : null;
  if (!marketing) return null;

  const category = SLUG_CATEGORY[normalized] ?? "engineering_design";
  return mapMarketingToAutodeskProduct(normalized, marketing, def.label, category);
}

/** Odoo `aptus.autodesk.product` first, then static registry fallback. */
export async function fetchAutodeskProductPage(
  slug: string,
): Promise<AutodeskProductContent | null> {
  const odooProduct = await fetchAutodeskProductBySlug(slug);
  if (odooProduct) return odooProduct;
  return staticAutodeskProduct(slug);
}

export function isKnownAutodeskProductSlug(slug: string): boolean {
  const normalized = slug.replace(/^\//, "");
  return Boolean(registryDefForSlug(normalized));
}
