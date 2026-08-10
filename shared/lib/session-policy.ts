/**
 * Session / auth posture for this monorepo (OWASP Session Management).
 *
 * End-user auth lives on the frontend Customer Portal:
 *  - RS256 JWT access tokens (in-memory) + httpOnly refresh cookie
 *  - Portal routes under /portal/* gated by frontend/middleware.ts
 *  - Passwords: scrypt hashes on Odoo res.partner (x_portal_password_hash)
 *  - Redis/KV: refresh rotation, OTP recovery, rate limits (file fallback in dev)
 *
 * Marketing/CMS auth (unchanged):
 *  1. Public CMS reads — no session; object access = published + website scope.
 *  2. Shared webhook secrets (ODOO_REVALIDATE_TOKEN, ODOO_DEBUG_TOKEN) — compared
 *     per request via secureCompare; not cookies; not stored in the browser.
 *     "Logout" for these is credential ROTATION in env + Odoo, not a user action.
 *  3. OdooRpcSession (backend) — in-process server handle holding ODOO_API_KEY for
 *     JSON-RPC CMS/CRM. Never sent to clients. Invalidate with
 *     invalidateOdooClientSession() after rotating ODOO_API_KEY.
 *
 * Portal Odoo uses JSON-2 Bearer API (frontend/lib/server/odoo) separately from
 * the backend JSON-RPC client — same Odoo instance, different transport.
 */

export const HAS_END_USER_SESSIONS = true as const;

/** Names that must never appear as NEXT_PUBLIC_* (defense-in-depth checklist). */
export const SERVER_ONLY_SECRET_ENV_NAMES = [
  "ODOO_API_KEY",
  "ODOO_REVALIDATE_TOKEN",
  "ODOO_DEBUG_TOKEN",
  "SMTP_PASS",
  "SMTP_USER",
  "JWT_PRIVATE_KEY",
  "JWT_PUBLIC_KEY",
  "PII_ENCRYPTION_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
] as const;
