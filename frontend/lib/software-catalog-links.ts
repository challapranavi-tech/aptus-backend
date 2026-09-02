import { SOFTWARE_FULL_CATALOG } from "@/data/software-full-catalog";
import { productSlugFromHref } from "@/data/software-purchase-catalog";

const CATALOG_BROWSE_LABEL =
  /^(browse products?|explore products?|explore software|explore .+ solutions?)$/i;

/** True when a hero/CTA should open the unified software catalog (optionally filtered). */
export function isCatalogBrowseAction(href: string, label?: string): boolean {
  const normalizedHref = href.trim().toLowerCase();
  if (normalizedHref === "#products" || normalizedHref === "#software" || normalizedHref === "#software-catalog") {
    return true;
  }
  if (!label) return false;
  if (!CATALOG_BROWSE_LABEL.test(label.trim())) return false;
  return !normalizedHref || normalizedHref.startsWith("#");
}

/** Resolve a page slug (e.g. autocad, autodesk, rib-costx) to a catalog brand id. */
export function brandIdFromPageSlug(slug: string): string | undefined {
  const normalized = slug.trim().toLowerCase().replace(/^\/+|\/+$/g, "");
  if (!normalized) return undefined;

  for (const brand of SOFTWARE_FULL_CATALOG) {
    if (brand.href && productSlugFromHref(brand.href) === normalized) {
      return brand.id;
    }
    if (brand.products.some((product) => productSlugFromHref(product.href) === normalized)) {
      return brand.id;
    }
  }

  return undefined;
}

/** Main software catalog URL, optionally filtered to one brand. */
export function softwareCatalogHref(brandId?: string): string {
  const base = "/software-solutions/products";
  if (!brandId) return base;
  return `${base}?brand=${encodeURIComponent(brandId)}`;
}

/** Rewrite in-page #Products / Browse Products links to the unified catalog. */
export function resolveSoftwareCatalogHref(
  pageSlug: string,
  href: string,
  label?: string,
): string {
  if (!isCatalogBrowseAction(href, label)) return href;
  return softwareCatalogHref(brandIdFromPageSlug(pageSlug));
}

/** Slug from a Next.js pathname (e.g. /autodesk → autodesk). */
export function slugFromPathname(pathname: string): string {
  return pathname.replace(/^\//, "").split("/").filter(Boolean)[0] ?? "";
}
