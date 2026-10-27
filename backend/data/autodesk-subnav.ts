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

/** Live vertical sidebar on Autodesk inner product pages (post-2030 et al.). */
export const AUTODESK_SUBNAV_LINKS = [
  { label: "AutoCAD", href: "/autocad" },
  { label: "3ds Max", href: "/3ds-max" },
  { label: "Revit", href: "/revit" },
  { label: "Civil 3D", href: "/civil-3d" },
  { label: "AEC Collection", href: "/aec-collection" },
  { label: "AutoCAD LT", href: "/autocad-lt" },
  { label: "Forma Design Collaboration", href: "/bim-collaborate-pro" },
  { label: "Autodesk Docs", href: "/autodesk-docs" },
  { label: "Autodesk Build", href: "/autodesk-build" },
  { label: "Autodesk Takeoff", href: "/autodesk-takeoff" },
  { label: "Navisworks", href: "/navisworks" },
] as const;
