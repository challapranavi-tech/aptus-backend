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

---

# Follow-up review — Customer Portal (auth, orders, payments, subscriptions, admin)

Date: 2026-08-09
Scope: `frontend/app/api/{auth,orders,payments,subscriptions,cart,notifications,admin,cron}/**`, `frontend/lib/server/**`, `frontend/middleware.ts`, `shared/lib/**`. This is the large customer-facing account/checkout system added after the review above; it introduces real credential storage, JWTs, PII, and payment handling, so it gets its own OWASP pass (ASVS + API Top 10 + LLM Top 10).

## 1. Database security

| Check | Status | Notes |
|-------|--------|-------|
| Publicly accessible by default | **OK** | Still no self-hosted DB. System of record is Odoo (outbound HTTPS JSON-RPC only, `frontend/lib/server/odoo/client.ts`). Session/OTP/rate-limit state lives in **Upstash Redis**, reached over HTTPS REST with a bearer token (`@upstash/redis`, `frontend/lib/server/kv-store.ts`) — no inbound port is ever opened by this app. |
| Least privilege | **OK (docs) / Ops-dependent** | `ODOO_USER`/`ODOO_API_KEY` documented as a dedicated non-admin API user (`.env.example`); Odoo authorization itself is out of this repo's control — operators must ensure that user has only the model access it needs. |
| Secure authentication | **OK** | Odoo: API key over HTTPS JSON-RPC. Redis: token-authenticated REST (Upstash). No DB credentials ever reach the browser (`NEXT_PUBLIC_*` is never used for any of these). |
| Authorized hosts only | **OK (architecture)** | No listening DB port exists in this codebase to restrict; all data-plane traffic is this app calling out to Odoo/Upstash over HTTPS. |
| Dev fallback safety | **OK** | Without Upstash configured, `kv-store.ts`/`shared/lib/rate-limit.ts` fall back to a local file/in-memory store and `assertProductionBackend()` **throws** if `NODE_ENV=production` and Upstash isn't configured — a shared store can't silently go missing in prod. |
| Secrets-at-rest for PII | **OK** | `phone`/`taxId`/`street`/`street2` are AES-256-GCM encrypted (`frontend/lib/server/pii-crypto.ts`) before being persisted; key is required (throws) in production (`getPiiEncryptionKey`). |

**Residual / ops action:** Confirm the Odoo API user used by the portal has write access scoped to only `res.partner`, `sale.order`, `crm.lead` etc. as documented — this is an Odoo-side ACL, not something enforceable from this repo.

## 2. Secrets management

| Check | Status | Notes |
|-------|--------|-------|
| `.env` excluded from VCS | **OK** | Root `.gitignore` ignores `.env`, `.env.*`, `.env.local`, `.env.production`, `.env.*.local` for both `frontend/` and `backend/`, and re-ignores even `.env.production.example` (may hold near-real values) — only `*.env.example` templates are tracked. |
| Secrets in git history | **1 real leak found — needs rotation** | Full-history search for `.env`/`.pem`/`id_rsa`/`AKIA…`/PEM headers found nothing. **However**, the literal shared-webhook secret `aptus-revalidate-2026` **was committed** in `backend/odoo-sync/SERVER_ACTION.py` (and `README.md`) in early commits (`653f7fb`, `86c5568`) before the module was parameterized. The file in the current tree is sanitized to a placeholder (`YOUR_ODOO_REVALIDATE_TOKEN`), but the real value is still permanently recoverable from history by anyone who can read the repo. A local (gitignored, never-committed) `backend/.env.production.example` reference file on this machine still has `ODOO_REVALIDATE_TOKEN` set to that same exposed value — **treat it as compromised and rotate `ODOO_REVALIDATE_TOKEN` on the frontend, backend, and Odoo's `nextjs.token` system parameter immediately.** The `.env.production.example` file was itself only ever committed with empty/placeholder values (`f6d6bf7` and earlier) — that specific leak path is closed. |
| Hard-coded secrets in source | **OK** | No hardcoded API keys/passwords found in `frontend/`, `backend/`, or the new `backend/scripts/*.mjs` seed/admin scripts — all read from `process.env`. |
| Fail-closed in production | **OK** | `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`, `PII_ENCRYPTION_KEY`, and the shared rate-limit/KV store all **throw at startup/request time** if unset with `NODE_ENV=production`, instead of silently falling back to a dev default. |
| Constant-time secret comparison | **Fixed** | All token checks (`shared/lib/secure-compare.ts`) were constant-time except `frontend/app/api/cron/cart-reminders/route.ts`, which compared the `Authorization` header with plain `!==`. **Remediated** — see below. |
| Dead insecure fallback | **Removed** | `frontend/lib/server/config.ts` had an unused, deprecated `getJwtSecret()` that returned a hardcoded literal (`"dev-only-change-me-in-production"`) if `JWT_SECRET` was unset. It had zero callers anywhere in the repo — a pure footgun if ever wired up again. Deleted rather than fixed (nothing depended on it).
| Untracked files sanity-checked | **OK** | `.postman/resources.yaml` (untracked) contains only a workspace id, no credentials. |
| `.gitignore` filename coverage | **Minor gap** | Covers `.env*` and `*.pem` but not `*.key`, `id_rsa*`, or `credentials.json` by name. Low risk today (nothing matching those names exists in the tree), but worth closing so a future accidental `id_rsa` or `service-account.json` drop is caught automatically. |
| Local plaintext secrets file | **Ops action needed** | `backend/.env.production.example` exists locally (gitignored, never committed) and is filled in with real production values (Odoo API key, Odoo user, Resend API key, revalidate token) for operator reference. This isn't a git leak, but a plaintext secrets file on a workstation is exactly what a secrets manager (Vercel env vars / 1Password / etc.) exists to replace. Recommend moving these values into Vercel's encrypted env var store (already the documented production path) and deleting the local copy once confirmed there. |

### Remediation applied in this review

```8:12:frontend/app/api/cron/cart-reminders/route.ts
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  // security: constant-time compare (OWASP) — a plain !== leaks timing info
  // proportional to matching-prefix length on a secret bearer token.
  if (!secret || !auth || !secureCompare(auth, `Bearer ${secret}`)) {
```

`getJwtSecret()` removed from `frontend/lib/server/config.ts` (unused; RS256 keys via `getJwtPrivateKey`/`getJwtPublicKey` are the only signing path).

**Action for operators — do this now:** `ODOO_REVALIDATE_TOKEN` is confirmed exposed in git history (see above) and must be rotated:
1. Generate a new value: `openssl rand -hex 32`.
2. Set it as `ODOO_REVALIDATE_TOKEN` in both the frontend and backend Vercel projects (Production **and** Preview scopes).
3. Update Odoo's `nextjs.token` system parameter (Settings → Technical → System Parameters) to the same value — the `aptus_nextjs_sync` module reads it from there, not from a file.
4. Redeploy both apps so the new value takes effect.
5. Decision recorded: rotate only, leave existing git history intact (rewriting `main` on the shared GitHub remote would require a force-push affecting other clones — not done without a separate explicit request).

Keep rotating `ODOO_API_KEY`, `JWT_PRIVATE_KEY`/`PUBLIC_KEY`, `PII_ENCRYPTION_KEY`, `CRON_SECRET`, `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`, and `RESEND_API_KEY` on any real or suspected exposure; never commit `.env.local`/`.env.production`. The local `backend/.env.production.example` reference copy should be retired in favor of Vercel's env var store once its values are confirmed present there.

## 3. Rate limiting

The portal has a dedicated, centrally-enforced rate limiter (`frontend/lib/server/rate-limit.ts` + `rate-limit-policy.ts` + `rate-limit-guard.ts`), applied globally in `frontend/middleware.ts` for **every** `/api/*` route (matcher `["/portal/:path*", "/api/:path*"]`) — so a new route is protected by the `default` policy the moment it ships, before anyone remembers to add a specific one. Algorithm is a sliding-window counter (weighted previous+current window) backed by Upstash Redis in production, with a documented in-memory fallback that fails loud if used in prod without Redis configured.

| Area | Status | Notes |
|------|--------|-------|
| IP-based limiting | **OK** | Every policy has an `ip` rule; IP resolved via a trust chain (`client-ip.ts`) that only trusts `X-Forwarded-For`/platform headers behind a known proxy (Vercel/Cloudflare/`RATE_LIMIT_TRUSTED_PROXY_HOPS`), otherwise treats the address as untrusted and logs a warning rather than pretending it's authoritative. |
| User-based limiting | **OK** | Authenticated routes add a `user` rule keyed by JWT `sub` (`identifyUser` — accepts a valid access token, refresh cookie, or legacy session cookie strictly for attribution, not authorization). |
| Per-identifier limiting (pre-auth) | **OK** | `login`, `forgot-password/send-otp`, `verify-otp`, `reset`, `check-identification`, `verify-email/resend` all additionally rate-limit by the **submitted email/token** (`IDENTIFIER_RULES`) inside the route handler — closing the gap where an attacker spreads a credential-stuffing/OTP-guessing attack across many IPs. |
| 429 response shape | **OK** | JSON body `{ error, code: "RATE_LIMITED", retryAfter }` + `Retry-After`, `RateLimit-*`, `X-RateLimit-*` headers, `Cache-Control: no-store` (`rateLimitExceededResponse`). |
| Auth endpoints specifically | **OK** | `login` (10/15min + 50/day per IP, 8/15min per email), `register` (5/15min + 20/day), `refresh` (120/15min IP, 40/15min user), `logout`, OTP send/verify all have tailored, tight limits — see table in `rate-limit-policy.ts`. |
| Payments/orders/subscriptions | **OK** | `orders/place`, `payments/checkout` (Stripe PaymentIntent creation), `subscriptions/create|request|cancel` all rate-limited both by IP and by user, with destructive/costly actions (cancellation, PaymentIntent) capped tighter than reads. |
| Admin routes | **OK** | Matched by `/^\/api\/admin(\/.*)?$/` (generous but present) **and** every admin route additionally checks `isAdminClaims()` (role or `ADMIN_EMAILS` allowlist) after authentication — rate limiting is not the only control here, authorization is enforced per-route too. |
| Webhook (`payments/webhook`) | **OK** | Deliberately looser IP cap (Stripe's source ranges are wide/dynamic) but `exemptFromGlobal` is scoped narrowly — actual authenticity is enforced by HMAC signature verification (`verifyStripeWebhookSignature`, timing-safe), not by the rate limit. |
| Backend (CMS) `/api/*` | **OK** | Separate middleware (`backend/middleware.ts`) applies IP presets (`publicRead`/`publicWrite`/`authWriteIp`/`debug`) to every backend route; multipart upload routes are excluded from Edge middleware (documented ceiling: Edge body-cloning 502s on large uploads) and instead self-enforce via `enforceIpRateLimit`/`enforceKeyRateLimit` inside the handler — confirmed present in `careers/apply`. |
| Cron endpoint | **OK (after fix)** | `/api/cron/cart-reminders` is bearer-token gated (`CRON_SECRET`), not itself rate-limited, but it's not a public-facing form; token check hardened to constant-time in this review. |

**Residual (documented, not changed):** in-memory rate-limit counters are used automatically only when Upstash isn't configured; production is already fail-loud about this (logs + `degraded: true` in decisions), so it's a monitored risk rather than a silent gap.

## 4. Prompt injection / AI features

| Check | Status | Notes |
|-------|--------|-------|
| AI/LLM integrations present | **None found** | Searched `frontend/` and `backend/` (source + `package.json` dependencies) for OpenAI/Anthropic/LangChain/`@ai-sdk`/embeddings/chat-completion usage. The only hits are a marketing-copy sentence mentioning "OpenAI" as a brand name in `frontend/components/adobe/HeroSection.tsx` and the guardrail doc itself — no actual model calls anywhere. `HAS_AI_FEATURES = false` in `shared/lib/ai-prompt-policy.ts` remains accurate. |
| Guardrails for future AI features | **Documented, unchanged** | `shared/lib/ai-prompt-policy.ts` already codifies OWASP LLM01 guidance: never concatenate user text into the system prompt, use structured `system`/`user` roles, delimit untrusted input (`wrapUntrustedUserInput` wraps text in `<user_input>` tags and strips any embedded closing tag to prevent delimiter breakout), validate/filter length, rate-limit AI endpoints, prefer allowlisted tool-calling over free-form instruction following. No change needed since there is no AI surface to apply it to yet. |

## Summary of this pass

The Customer Portal (JWT auth with RS256 + revocation list, scrypt password hashing with timing-safe verification, AES-256-GCM PII encryption, Stripe payments with signature-verified/deduplicated webhooks, admin RBAC, and a centrally-enforced sliding-window rate limiter applied to literally every `/api/*` route) was already built to a high security bar. This review found and fixed two small gaps — a non-constant-time secret comparison on the cron endpoint, and a dead code path holding a hardcoded fallback secret — and found no committed secrets, no missing rate limiting on sensitive endpoints, and no AI/LLM surface to protect against prompt injection. No functional behavior was changed.
