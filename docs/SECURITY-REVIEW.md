# Security review — Aptus (frontend + backend + shared)

Date: 2026-07-12  
Scope: Marketing CMS (Next.js) + Odoo JSON-RPC + contact/career forms.  
Standard: OWASP (ASVS / API / LLM Top 10 where applicable).

## 1. Database security

| Check | Status | Notes |
|-------|--------|-------|
| App DB publicly exposed | **N/A / OK** | No Postgres/MySQL/Mongo/SQLite in this app. Content is Odoo over HTTPS JSON-RPC + optional local marketing JSON. |
| Least privilege | **Ops + docs** | Use a dedicated Odoo API user with read (write only if seeding) on `website.page`, `website.menu`, `ir.ui.view`. Documented in `backend/.env.example`. |
| Secure authentication | **OK** | Odoo API key via env (`ODOO_API_KEY`); never `NEXT_PUBLIC_*`; secret-bearing RPC uses `cache: "no-store"`. |
| Authorized hosts only | **OK (architecture)** | App does not open a DB port. Network access is outbound HTTPS to `ODOO_URL` only. Restrict Odoo itself via Odoo.com / firewall (ops). |

**Remediation applied:** `USE_LOCAL_PAGE_JSON` can no longer force disk JSON in production (`local-page-json.ts`).

## 2. Secrets management

| Check | Status | Notes |
|-------|--------|-------|
| `.env` in `.gitignore` | **OK** | `.env*` ignored; `!.env.example` / `!.env.production.example` only. |
| Secrets in git history | **OK** | No tracked `.env.local`; history search for `.env.local` empty. No history rewrite needed. |
| Hard-coded secrets | **OK** | None found in tracked source. |
| Env migration | **OK** | All secrets via `process.env` / Vercel env. Checklist in `shared/lib/session-policy.ts`. |

**Action for operators:** Keep rotating `ODOO_API_KEY`, `ODOO_REVALIDATE_TOKEN`, `SMTP_PASS` if ever exposed; never commit `.env.local`.

## 3. Rate limiting

| Check | Status | Notes |
|-------|--------|-------|
| Public CMS GETs | **OK** | Backend middleware `publicRead` (120/min/IP). |
| Contact / career | **OK** | IP `publicWrite` + email identity limits; CORS-aware 429. |
| Revalidate (BE + FE) | **OK** | IP + token identity; FE middleware added for `/api/revalidate`. |
| Debug `/api/odoo` | **OK** | `debug` preset; prod disabled; token required. |
| Health | **OK** | Exempt (probes). |
| 429 shape | **OK** | JSON + `Retry-After` / `X-RateLimit-*`. |

**Residual:** In-memory counters (documented); use shared store (e.g. Upstash) if many replicas. IP uses trusted-proxy rules (`VERCEL` / `TRUST_PROXY`).

## 4. Prompt injection (AI)

| Check | Status | Notes |
|-------|--------|-------|
| AI/LLM features | **N/A / OK** | None present (`HAS_AI_FEATURES = false`). |
| Future guardrails | **Documented** | `shared/lib/ai-prompt-policy.ts` — roles, delimiters, never put user text in system prompt. |

## Summary

No traditional database to lock down; Odoo is the data plane. Secrets hygiene and rate limits are in place. No AI surface today. Highest residual risk under scale is process-local rate limiting — upgrade path noted in code.
