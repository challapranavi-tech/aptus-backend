# Odoo & Vercel environment matrix

Monorepo layout: `frontend/` (Vercel/Netlify) + `backend/` (Odoo API). See root `README.md`.

Which Odoo instance each deployment talks to, and who owns the secrets.

## Instances

| Instance | Purpose | Typical `ODOO_URL` |
|----------|---------|-------------------|
| **Staging** | Editor testing, content seeding, dev | `aptusinfotech-staging-*.dev.odoo.com` |
| **Production** | Live site content (when provisioned) | TBD — separate Odoo.com database or on-prem |

Local dev uses staging values from `.env.example` → `.env.local`.

Production Vercel values use the same keys as `.env.production.example`.

## Vercel environment mapping

| Vercel scope | Next.js URL | Odoo instance | Notes |
|--------------|-------------|---------------|-------|
| **Production** | Production domain | Production Odoo | Real editors, real visitors |
| **Preview** | `*.vercel.app` PR previews | **Staging** Odoo only | Never point previews at production Odoo |
| **Development** | `localhost` | Staging (`.env.local`) | Optional `content/odoo-json` overrides |

Set env vars per scope in Vercel → Project → Settings → Environment Variables.
Use separate `ODOO_API_KEY` and `ODOO_REVALIDATE_TOKEN` per Odoo instance.

## Secret ownership

| Secret | Set in | Must match |
|--------|--------|------------|
| `ODOO_API_KEY` | Vercel + local `.env.local` | Odoo user API key for that instance |
| `ODOO_REVALIDATE_TOKEN` | Vercel + local `.env.local` | Odoo `nextjs.token` system parameter |
| `nextjs.base_url` | Odoo system parameters | Vercel deployment URL for that environment |

**Rotation:** generate a new token (`openssl rand -hex 32`), update Vercel and Odoo `nextjs.token` together, then revoke the old value.

**Owner:** designate one person/role for Vercel env vars and one for Odoo system parameters so preview/prod never share the wrong `ODOO_URL`.

## Cache revalidation

Odoo `aptus_nextjs_sync` POSTs to `{nextjs.base_url}/api/revalidate` with `{ slug, token }`.

- `/api/revalidate` is **fail-closed**: missing `ODOO_REVALIDATE_TOKEN` → 503.
- GET with query params is **development only**; use POST + JSON body in production.

## Navigation (code-owned)

Main site navigation is **not** driven by Odoo `website.menu`. Source of truth:

- `data/site-nav.ts` — edit and regenerate via `aptus-web/scripts/generate-site-nav.mjs` when syncing from the live site.

Page body content **is** Odoo-driven (`website.page` + `x_page_sections_json`).

## Before cloning staging → production Odoo

Clean staging data **before** clone, not after launch:

1. Run TD-007 cleanup on staging (see `aptus-web/docs/phase-1/TECHNICAL-DEBT-REPORT.md`):
   - Consolidate duplicate `website.page` URLs (`/`, `/fortinet`, `/kaspersky`, etc.)
   - Archive duplicate home page records; pin `ODOO_CMS_HOME_PAGE_ID` if using aptus-web tooling
2. Unpublish obsolete drafts (134 pages / 22 published on staging as of last audit).
3. Clone or export clean data to production.
4. Install `aptus_nextjs_sync`, set `nextjs.base_url` + `nextjs.token` on the **production** instance.
5. Set Vercel Production env vars from `.env.production.example` — verify `ODOO_URL` is production, not staging.

## Checklist (launch)

- [ ] Vercel Production `ODOO_URL` / `ODOO_DB` point at production Odoo (or staging if intentionally staging-backed)
- [ ] Vercel Preview scopes use staging Odoo only
- [ ] Frontend `APTUS_API_URL` + `NEXT_PUBLIC_API_URL` = **backend** HTTPS URL (never `localhost`, never `…/odoo/website`)
- [ ] `ODOO_REVALIDATE_TOKEN` set in Vercel Production (and staging if webhooks enabled)
- [ ] Odoo `nextjs.token` matches Vercel for each instance
- [ ] Odoo `nextjs.base_url` matches the Vercel URL for that instance
- [ ] Backend `APTUS_FRONTEND_URL` = live frontend URL (revalidate fan-out)
- [ ] Private Vercel Blob linked on **backend** (`BLOB_READ_WRITE_TOKEN`) for career applies
- [ ] Probe `GET https://<backend>/api/health` → `"ready": true` and all `checks` true
- [ ] TD-007 duplicate pages resolved on source DB before clone
- [ ] Editors told: page content in Odoo; navigation in `data/site-nav.ts` (PR required)
- [ ] Website pages **published** in Odoo (unpublished → empty CMS → local fallback or 404)
