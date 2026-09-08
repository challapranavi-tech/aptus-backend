import { SOFTWARE_FULL_CATALOG } from "@/data/software-full-catalog";
import { productSlugFromHref } from "@/data/software-purchase-catalog";

const CATALOG_BROWSE_LABEL =
  /^(browse products?|explore products?|explore software|explore .+ solutions?)$/i;

/** Software nav brand hubs that should surface Explore products → pre-filtered catalog. */
export const SOFTWARE_BRAND_HUB_IDS = new Set(
  SOFTWARE_FULL_CATALOG.map((brand) => brand.id),
);

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
    if (brand.id === normalized) return brand.id;
    if (brand.href && productSlugFromHref(brand.href) === normalized) {
      return brand.id;
    }
    if (brand.products.some((product) => productSlugFromHref(product.href) === normalized)) {
      return brand.id;
    }
  }

  return undefined;
}

/** Brands picker shown from software-home Explore products. */
export function softwareBrandsHref(): string {
  return "/software-solutions/brands";
}

/** Parse `?brand=adobe` or `?brand=adobe,microsoft` into catalog brand ids. */
export function parseCatalogBrandIds(param: string | null | undefined): string[] {
  if (!param?.trim()) return [];
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const part of param.split(/[,+]/)) {
    const id = part.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

/** Main software catalog URL, optionally filtered to one or more brands. */
export function softwareCatalogHref(brandIds?: string | string[]): string {
  const base = "/software-solutions/products";
  const ids = (Array.isArray(brandIds) ? brandIds : brandIds ? [brandIds] : [])
    .map((id) => id.trim())
    .filter(Boolean);
  if (!ids.length) return base;
  return `${base}?brand=${ids.map(encodeURIComponent).join(",")}`;
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

export type BrandHeroAction = {
  label: string;
  href: string;
  tone?: "blue" | "green" | "sky";
};

/**
 * Brand hub heroes always lead with Explore products → catalog?brand=.
 * Keeps any other CMS CTAs after it (deduped by label).
 */
export function withBrandExploreProductsAction(
  pageSlug: string,
  actions: BrandHeroAction[] = [],
): BrandHeroAction[] {
  const brandId = brandIdFromPageSlug(pageSlug);
  if (!brandId || !SOFTWARE_BRAND_HUB_IDS.has(brandId)) {
    return actions;
  }

  const explore: BrandHeroAction = {
    label: "Explore products",
    href: softwareCatalogHref(brandId),
    tone: "blue",
  };

  const rest = actions.filter((action) => !CATALOG_BROWSE_LABEL.test(action.label.trim()));
  return [explore, ...rest];
}
