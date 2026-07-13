/**
 * Session / auth posture for this monorepo (OWASP Session Management).
 *
 * security: There is NO end-user login, logout, JWT, or browser session cookie
 * in Aptus (frontend marketing site + CMS API). Do not invent a logout flow
 * for accounts that do not exist.
 *
 * What exists instead:
 *  1. Public CMS reads — no session; object access = published + website scope.
 *  2. Shared webhook secrets (ODOO_REVALIDATE_TOKEN, ODOO_DEBUG_TOKEN) — compared
 *     per request via secureCompare; not cookies; not stored in the browser.
 *     "Logout" for these is credential ROTATION in env + Odoo, not a user action.
 *  3. OdooRpcSession — in-process server handle holding ODOO_API_KEY for JSON-RPC.
 *     Never sent to clients. Invalidate with invalidateOdooClientSession() after
 *     rotating ODOO_API_KEY so the old key cannot be reused from a warm worker.
 *
 * Client storage: this app must not write auth tokens to cookies, localStorage,
 * or sessionStorage. Forms use React state only.
 */

export const HAS_END_USER_SESSIONS = false as const;

/** Names that must never appear as NEXT_PUBLIC_* (defense-in-depth checklist). */
export const SERVER_ONLY_SECRET_ENV_NAMES = [
  "ODOO_API_KEY",
  "ODOO_REVALIDATE_TOKEN",
  "ODOO_DEBUG_TOKEN",
  "SMTP_PASS",
  "SMTP_USER",
] as const;
