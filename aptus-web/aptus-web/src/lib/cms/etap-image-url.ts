/** Paths served from Next.js `public/` — never rewrite to Odoo (SSR/client must match). */
function isNextPublicAsset(path: string): boolean {
  return path.startsWith("/images/");
}

/** Paths that live on the Odoo host and need an absolute URL for next/image. */
function isOdooHostedPath(path: string): boolean {
  return path.startsWith("/web/") || path.startsWith("/aptus_");
}

/**
 * Odoo base URL available in both server and client bundles.
 * Do not use server-only ODOO_BASE_URL here — that causes hydration mismatches.
 */
function getOdooPublicBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_ODOO_BASE_URL?.trim() || "").replace(/\/$/, "");
}

/** Resolve Odoo-hosted image paths for next/image. Local `/images/...` assets pass through unchanged. */
export function resolveOdooImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (isNextPublicAsset(url)) return url;

  const base = getOdooPublicBaseUrl();
  if (!base || !isOdooHostedPath(url)) return url;

  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}
