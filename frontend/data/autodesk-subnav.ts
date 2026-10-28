import type { NavigationItem } from "@/types";

/** Vertical sidebar on Autodesk product pages — matches live site sibling nav. */

/** Slugs hidden from nav, hub cards, and direct page access. */
export const AUTODESK_HIDDEN_SLUGS = new Set<string>(["palo-alto"]);

export function isAutodeskHiddenSlug(slug: string): boolean {
  return AUTODESK_HIDDEN_SLUGS.has(slug);
}

function slugFromHref(href?: string): string | undefined {
  if (!href || href === "#") return undefined;
  return href.replace(/^\//, "");
}

/** Strip hidden Autodesk product links from header nav while keeping nested flyout groups. */
export function filterSiteNavigation(items: NavigationItem[]): NavigationItem[] {
  const out: NavigationItem[] = [];
  for (const item of items) {
    const filtered = filterNavItem(item);
    if (filtered) out.push(filtered);
  }
  return out;
}

function filterNavItem(item: NavigationItem): NavigationItem | null {
  const slug = slugFromHref(item.href);
  if (slug && isAutodeskHiddenSlug(slug)) return null;

  if (!item.children?.length) return item;

  const children = item.children
    .map(filterNavItem)
    .filter((child): child is NavigationItem => child !== null);

  if (children.length === 0 && !item.href) return null;

  return children.length === item.children.length ? item : { ...item, children };
}

import { PDF_AUTODESK_RENEWAL_PRODUCTS } from "@/data/pdf-software-catalog";

/** Live vertical sidebar on Autodesk inner product pages (post-2030 et al.). */
export const AUTODESK_SUBNAV_LINKS = PDF_AUTODESK_RENEWAL_PRODUCTS;
