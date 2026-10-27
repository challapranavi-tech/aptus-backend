import { productSlugFromHref } from "@/data/software-purchase-catalog";
import { PDF_CATALOG_TITLES_BY_SLUG } from "@/data/pdf-software-catalog";

export function getProductCatalogTitle(hrefOrSlug: string): string | undefined {
  const slug = hrefOrSlug.startsWith("/")
    ? productSlugFromHref(hrefOrSlug)
    : hrefOrSlug.trim().toLowerCase();
  return PDF_CATALOG_TITLES_BY_SLUG[slug];
}
