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

## 5. Careers feature pass (job listing, resume upload, application submission)

New public surface handling PII (name, DOB, passport number, salary, uploaded documents). Reviewed against OWASP API Top 10.

### 5.1 Rate limiting

| Endpoint | Preset | Notes |
|----------|--------|-------|
| `GET /api/careers/jobs` (+ `/[slug]`) | `publicRead` (120/min/IP) | Read-only listing; generous so multi-step applicants aren't throttled. Response `Cache-Control` reduces load. |
| `POST /api/careers/parse-resume` | `publicWrite` (8 / 15 min / IP) | Upload endpoint; tighter IP cap. |
| `POST /api/careers/apply` | `publicWrite` (IP) **+** `publicWriteIdentity` (3 / 15 min / email) | Submission; strictest. Email cap survives IP rotation. |
| 429 shape | `Retry-After` + `X-RateLimit-Limit/Remaining/Reset` | via `rateLimitHeaders`, CORS-aware in middleware. |

Middleware (`backend/middleware.ts`) matches both `/api/career/` (legacy) and `/api/careers/*` (new). Thresholds chosen so a legitimate applicant completing the 6-step form (one submit, a few resume-parse calls) stays well under limits.

### 5.2 Input validation & sanitization

| Check | Status | Notes |
|-------|--------|-------|
| Schema validation at API boundary | **OK** | `parseApplicationFields` (server) re-validates the full payload — client validation is UX only. |
| Query/path params | **OK** | Job filter params length-clamped (`jobs/route.ts`); slug is matched against published jobs only. |
| Type/length/format constraints | **OK** | email/phone regex, length caps, numeric team size / experience patterns, date fields. |
| Allowlist fields | **OK** | `noticePeriod` ∈ fixed set — rejected server-side if off-list. |
| Reject unknown fields | **OK** | `rejectUnknownFormKeys` (dynamic `educationDoc_*` explicitly allowlisted). |
| **File type by content** | **OK (hardened)** | `shared/lib/file-signature.ts` sniffs magic bytes (PDF/OLE/OOXML/JPEG/PNG/WEBP); rejects MZ/ELF executables + SVG; `.docx` must look like Word OOXML (not a bare ZIP/JAR). Applied on `/api/careers/apply`, `parse-resume`, and legacy `/api/career/apply`. |
| Max file size | **OK** | Careers: 800 KB/file + 4.5 MB total. Legacy career: 4 MB/file + 4.5 MB total. |
| Double extensions | **OK (added)** | `hasAllowedExtension` rejects compound names like `malware.exe.pdf` / `x.svg.png`. |
| Zip bomb / inflate | **OK (added)** | `extract-text.ts` caps inflate output at 2 MB and refuses declared oversized `document.xml`. |
| Filename path traversal | **OK** | `sanitizeFilename` strips path separators + control chars, allowlists chars, caps length. |
| Error responses | **OK** | Per-field messages via `validationError`; sniffed type is **not** leaked to the client; no stack traces. |

**Remediation applied:** content/magic-byte validation (all upload routes); OOXML probe for `.docx`; compound-extension reject; inflate caps on resume parse; `noticePeriod` allowlist; query-param length clamps. (Passport copy is now mandatory for all candidates; nationality field removed.)

### 5.3 Secrets & API keys

| Check | Status | Notes |
|-------|--------|-------|
| Resume parsing keys | **N/A / OK** | Parsing is **stdlib-only** (`zlib` + regex) — no third-party service, no key, no browser-side secret. |
| Upload/storage keys | **N/A** | Files are streamed to HR via existing SMTP; no object-storage bucket/keys introduced. |
| Client bundle exposure | **OK** | Browser uses only `NEXT_PUBLIC_API_URL`; Odoo/SMTP creds stay server-side. |

### 5.4 IDOR

| Resource | Status | Notes |
|----------|--------|-------|
| Job detail by slug | **OK** | Odoo fetch filtered to `website_published = true`; unpublished jobs 404 like missing ones. |
| Uploaded documents | **N/A (by design)** | No file-retrieval endpoint exists — uploads are emailed to HR, never persisted behind a guessable URL, so there is no cross-applicant read surface to exploit. |
| Application status | **N/A** | No status/read-back endpoint. |

If a recruiter dashboard or document storage is added later, each `GET by id` must enforce a server-side ownership/role check before returning attachments.

### 5.5 Session & logout

**N/A** for the applicant flow — it is fully anonymous (no login, no cookies, no tokens). No change to the site's existing session posture. A future recruiter-review area must invalidate tokens server-side on logout and reject revoked/expired sessions.

### 5.6 Broader review (careers-specific)

- **Database:** unchanged — no app DB; applicant PII transits to Odoo/HR email only. Recommend a dedicated least-privilege Odoo user if `hr.applicant` writes are added.
- **Prompt injection:** **N/A** — resume auto-fill uses regex extraction, not an LLM. Resume text is never interpolated into any model prompt. If an LLM parser is adopted, treat resume text as untrusted (structured roles + delimiters + output validation) per `ai-prompt-policy.ts`.

## Summary

No traditional database to lock down; Odoo is the data plane. Secrets hygiene and rate limits are in place. No AI surface today. The new careers flow adds public upload/submission endpoints — hardened with content-based file validation, allowlist + length-bounded input validation, tiered rate limits, and no persisted-document retrieval surface (no IDOR). Highest residual risk under scale remains process-local rate limiting — upgrade path (shared store) noted in code.
