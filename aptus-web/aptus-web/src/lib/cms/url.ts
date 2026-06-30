/** Convert Next.js catch-all slug segments to an Odoo website.page url path. */
export function slugToPageUrl(slug: string[]): string {
  if (!slug.length) return "/";
  const path = slug.map((segment) => decodeURIComponent(segment)).join("/");
  return `/${path}`;
}

/** Convert Odoo page url to Next.js slug param array (excludes home). */
export function pageUrlToSlug(url: string): string[] | null {
  const normalized = url.startsWith("/") ? url : `/${url}`;
  if (normalized === "/" || normalized === "") return null;
  const segments = normalized.replace(/^\//, "").split("/").filter(Boolean);
  return segments.length ? segments : null;
}
