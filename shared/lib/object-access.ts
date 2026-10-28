/**
 * Object-level access helpers (OWASP API1 — Broken Object Level Authorization).
 *
 * This app has no end-user sessions: marketing CMS content is public when
 * published, and admin webhooks use a shared secret (not per-user ACLs).
 * Identifiers (slug, view id) must still be authorized server-side:
 *  - Public reads: only published pages for the configured website
 *  - Debug reads: only resources scoped to that website
 * Never trust the client to hide drafts or other sites' objects.
 */

export type PublishablePage = {
  is_published?: boolean | null;
  website_published?: boolean | null;
};

/** True when Odoo would treat the page as publicly visible. */
export function isOdooPagePublished(page: PublishablePage): boolean {
  return Boolean(page.is_published || page.website_published);
}
