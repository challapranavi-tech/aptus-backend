/**
 * CMS cache TTL for `unstable_cache` in Odoo fetchers.
 * Defaults to 0 in development so Odoo edits show up immediately on localhost.
 *
 * Route ISR is configured separately: `export const revalidate = 300` on
 * `app/(site)/layout.tsx` (Next.js requires a literal for segment config).
 */
export function getCmsRevalidateSec(): number {
  const fromEnv = process.env.ODOO_CMS_REVALIDATE_SEC?.trim();
  if (fromEnv !== undefined && fromEnv !== "") {
    const parsed = Number(fromEnv);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }

  if (process.env.NODE_ENV === "development") return 0;
  return 300;
}
