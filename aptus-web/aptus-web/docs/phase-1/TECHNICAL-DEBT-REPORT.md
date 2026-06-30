# Technical Debt Report — Phase 1 Audit

**Date:** June 24, 2026  
**Severity scale:** 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low

---

## 1. Debt Summary

| Severity | Count | Category |
|----------|-------|----------|
| 🔴 Critical | 2 | Architecture / CMS |
| 🟠 High | 6 | Architecture, CSS, Content |
| 🟡 Medium | 8 | Routes, Components, DX |
| 🟢 Low | 5 | Cleanup, Documentation |

**Overall assessment:** The project has a working Odoo integration and a clean static React fallback, but the **live CMS path violates the core architecture principle** (Odoo owns content, Next.js owns presentation). Resolving this is the primary debt item blocking Phases 3–5.

---

## 2. Critical Issues

### 🔴 TD-001 — HTML injection bypasses React presentation layer

**Location:** `CmsPageBody.tsx`, `app/(site)/page.tsx`, `[...slug]/page.tsx`

**Problem:** When Odoo returns HTML ≥ 200 chars, the homepage and catch-all routes render raw Odoo markup via `dangerouslySetInnerHTML`. Odoo controls layout, styling, and structure — not Next.js.

**Impact:**
- Cannot add GSAP animations to CMS-driven pages
- CSS conflicts between Odoo inline styles and Tailwind
- Pixel-perfect control impossible
- Violates architecture vision

**Remediation (Phase 3):** Replace HTML injection with structured Odoo fields → `cms-mapper.ts` → typed section props → React components. Keep HTML path as temporary bridge for unmigrated inner pages.

---

### 🔴 TD-002 — Dual parallel content sources

**Location:** `lib/constants.ts` vs Odoo `website.page`

**Problem:** Marketing content exists in two places:
1. Hardcoded constants + static React components
2. Odoo HTML pages

There is no single source of truth. Editors updating Odoo may not see changes if the static fallback renders, and vice versa.

**Impact:** Content drift, editor confusion, unpredictable live site behavior.

**Remediation:** Define Odoo as sole content source. Static fallbacks become dev-only or are removed after migration. Structured JSON fields replace both HTML and constants.

---

## 3. High Priority Issues

### 🟠 TD-003 — No structured CMS mapper or section types

**Location:** `types/cms.ts`, `lib/server/odoo/content/pages.ts`

**Problem:** `CmsPageContent` only exposes `{ html, metaTitle, metaDescription }`. No section schema, no presentation settings mapping (theme, alignment, font presets).

**Impact:** Cannot implement controlled editor settings from architecture doc.

**Remediation:** Add `types/sections.ts`, `lib/cms/cms-mapper.ts`, extend Odoo models or JSON fields.

---

### 🟠 TD-004 — CSS file drift between `src/` and `public/`

**Location:** `src/styles/customer-dashboard.css` (4,033 lines) vs `public/css/customer-dashboard.css` (2,608 lines)

**Problem:** Files are **not identical**. Legacy portal JS may load the outdated public copy while React portal loads the src copy.

**Impact:** Inconsistent styling depending on code path; silent regressions when only one copy is updated.

**Remediation:** Delete `public/css/` duplicates or automate sync. Audit `public/js/aptus_portal_auth.js` for CSS references.

---

### 🟠 TD-005 — Monolithic CSS (4K+ lines)

**Location:** `src/styles/customer-dashboard.css`, `src/styles/aptus.css`

**Problem:** Portal styles are large undifferentiated files. `site-header.css` uses 124 `!important` rules to fight Bootstrap bleed.

**Impact:** Hard to maintain, high specificity conflicts, slow onboarding.

**Remediation:** Phase 2 design tokens + modular CSS. Consider CSS modules or scoped styles for portal in a later phase.

---

### 🟠 TD-006 — No GSAP / animation layer

**Location:** Missing `animations/`, `hooks/useGSAP.ts`; `.gsap-word` stub in `aptus.css`

**Problem:** Architecture requires GSAP, ScrollTrigger, parallax. None installed. Only CSS transitions on marketing components.

**Impact:** Cannot replicate premium interactive experiences from aptusinfotech.com.

**Remediation:** Phase 3 — add `gsap`, `@gsap/react`, create animation hooks and section-level animation wrappers.

---

### 🟠 TD-007 — Odoo CMS data quality

**Source:** `node scripts/list-odoo-pages.mjs` (staging, June 2026)

**Problem:**
- 134 total pages, only 22 published
- Duplicate URLs (multiple `/`, `/fortinet`, `/kaspersky`, `/palo-alto`, `/sophos`, `/microsoft`, `/construction-cloud`)
- 4 duplicate home page records (2 published, 2 draft)

**Impact:** `pickBestCmsPage()` heuristics may select wrong record. Unpredictable homepage content.

**Remediation:** Odoo admin cleanup — consolidate duplicates, pin homepage via `ODOO_CMS_HOME_PAGE_ID`, unpublish obsolete drafts.

---

### 🟠 TD-008 — Missing marketing routes

**Location:** `lib/cms/main-pages.ts` defines routes not implemented in `app/`

**Problem:**
- `/elv-solutions` — no `app/(site)/elv-solutions/page.tsx`
- `/aptus-case-studies` — no route file
- Nav items for ELV and Case Studies point to `#`

**Impact:** Broken navigation, pages only reachable via catch-all (Odoo HTML only, no static fallback).

**Remediation:** Add routes in Phase 4 following `about-us` hybrid pattern.

---

## 4. Medium Priority Issues

### 🟡 TD-009 — `CmsRoutePage` fetches inside component

**Location:** `components/cms/CmsRoutePage.tsx`

**Problem:** Architecture says pages fetch data, components receive props. `CmsRoutePage` calls `fetchOdooPageByUrl()` internally.

**Impact:** Minor pattern inconsistency; harder to test and compose.

**Remediation:** Move fetch to page files; pass `page | null` and `fallback` as props.

---

### 🟡 TD-010 — Section components don't receive props from pages

**Location:** `components/home/*`

**Problem:** `ServicesGrid`, `KeyEnablers`, `Testimonial` import `constants.ts` directly. `ElvSection`/`SoftwareSection` hardcode content.

**Impact:** Violates "pages fetch, components render" principle.

**Remediation:** Refactor to prop-driven sections in Phase 3.

---

### 🟡 TD-011 — `cms-content.css` is a Bootstrap/Odoo compatibility layer

**Location:** `src/styles/cms-content.css`

**Problem:** 112 lines of overrides for Odoo snippet classes (`.s_banner`, `.btn-primary`, `.display-*`). Duplicates concerns that Tailwind/design system should own.

**Impact:** Third styling paradigm alongside Tailwind and Bootstrap.

**Remediation:** Retire when HTML injection path is removed.

---

### 🟡 TD-012 — Portal components exceed 300-line standard

**Location:**
- `OrderPaymentModal.tsx` — 491 lines
- `OverviewDashboard.tsx` — 332 lines

**Problem:** Architecture standard is ≤300 lines per component.

**Impact:** Reduced readability (portal scope; lower priority for marketing migration).

**Remediation:** Split into sub-components when portal is next touched.

---

### 🟡 TD-013 — Legacy JavaScript in `public/js/`

**Location:** `public/js/aptus_portal_auth.js`

**Problem:** Legacy portal purchase/subscription UI still referenced by `PortalLegacyContent.tsx`. Mixed React + vanilla JS architecture.

**Impact:** Two UI paradigms in portal; legacy CSS/JS dependencies.

**Remediation:** Continue React migration (see `docs/PHASE3-8-DELIVERABLES.md`). Out of marketing scope.

---

### 🟡 TD-014 — No public CMS API routes

**Location:** Missing `/api/homepage`, `/api/services`, etc.

**Problem:** Architecture doc lists BFF endpoints. Current implementation uses direct server imports (valid for SSR).

**Impact:** None for SSR-only architecture. Required only if client components need CMS data.

**Remediation:** Defer until client-side fetching is needed. Document server-import pattern as intentional.

---

### 🟡 TD-015 — Color/token triplication

**Location:** `tailwind.config.ts`, `globals.css`, `aptus.css`

**Problem:** Brand colors defined in three places with slightly different casing (`#1352A3` vs `#1352a3`).

**Impact:** Risk of drift during theme updates.

**Remediation:** Phase 2 — single `tokens.css` referenced by Tailwind and legacy CSS.

---

### 🟡 TD-016 — README / docs out of sync

**Location:** Project README vs actual Odoo CMS integration

**Problem:** README may still describe static HTML replica. Existing `docs/PHASE3-8-DELIVERABLES.md` covers portal, not marketing CMS.

**Impact:** Developer onboarding confusion.

**Remediation:** Update README after Phase 2. Phase 1 docs (this folder) address marketing audit.

---

## 5. Low Priority Issues

### 🟢 TD-017 — `.gsap-word` CSS stub without GSAP

**Location:** `aptus.css:439`

**Problem:** CSS class exists for GSAP SplitText-style animation but library not installed.

**Remediation:** Remove stub or implement in Phase 3.

---

### 🟢 TD-018 — `HeroBanner` is image-only

**Location:** `components/home/HeroBanner.tsx`

**Problem:** No title, subtitle, or CTA props — unlike architecture's `HeroSection`.

**Remediation:** Expand in Phase 3 homepage rebuild.

---

### 🟢 TD-019 — Nav dropdown children are placeholders

**Location:** `lib/constants.ts` → `NAV_ITEMS`

**Problem:** About Us sub-links and ELV/Case Studies hrefs are `#`.

**Remediation:** Wire to routes as pages are built in Phase 4.

---

### 🟢 TD-020 — `SoftwarePage` density

**Location:** `components/pages/software/SoftwarePage.tsx` (238 lines)

**Problem:** Single file with many product categories; could split into sections.

**Remediation:** Refactor during Phase 4 inner pages.

---

### 🟢 TD-021 — Duplicate `loadEnvLocal(ROOT)` call

**Location:** `scripts/list-odoo-pages.mjs` lines 13 and 31

**Problem:** Harmless duplicate call in script.

**Remediation:** Remove duplicate when touching script.

---

## 6. Architecture Alignment Scorecard

| Principle | Score | Notes |
|-----------|-------|-------|
| Odoo owns content | 6/10 | Content in Odoo but as HTML blobs, not structured fields |
| Next.js owns presentation | 4/10 | True for static fallback; false when CMS HTML renders |
| Pages fetch, components render | 5/10 | Pages fetch for CMS; sections read constants directly |
| Separation of content & presentation | 3/10 | HTML injection collapses separation |
| Scalable component system | 6/10 | Good primitives started; sections not abstracted |
| GSAP animation layer | 0/10 | Not started |
| No CSS conflicts | 4/10 | Triple styling systems; 124 `!important` in header |
| Design tokens | 4/10 | Partial colors only |
| Enterprise-grade structure | 7/10 | Good server/client boundary, TypeScript, ISR caching |
| Easy developer onboarding | 5/10 | Dual CMS paths and CSS systems add complexity |

**Overall alignment with architecture vision: ~44%**

---

## 7. Prioritized Remediation Roadmap

### Immediate (before Phase 2)

| ID | Action | Effort |
|----|--------|--------|
| TD-007 | Clean up duplicate Odoo pages; pin homepage ID in `.env.local` | 1–2 hrs (Odoo admin) |
| TD-004 | Audit and resolve `public/css` vs `src/styles` drift | 2–4 hrs |

### Phase 2 — Design System

| ID | Action |
|----|--------|
| TD-015 | Create unified design tokens |
| TD-005 | Begin modularizing CSS; reduce `!important` in site-header |
| TD-011 | Mark cms-content.css as deprecated |

### Phase 3 — Homepage Rebuild

| ID | Action |
|----|--------|
| TD-001 | Replace homepage HTML injection with section composition |
| TD-002 | Migrate content from constants to Odoo structured fields |
| TD-003 | Implement cms-mapper and section types |
| TD-006 | Add GSAP layer |
| TD-010 | Refactor sections to prop-driven |
| TD-018 | Build full HeroSection |

### Phase 4 — Inner Pages

| ID | Action |
|----|--------|
| TD-008 | Add missing routes |
| TD-019 | Wire navigation |
| TD-009 | Normalize fetch-in-page pattern |
| TD-020 | Split dense page components |

---

## 8. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Odoo HTML path blocks GSAP/animations | High | High | Prioritize homepage structured migration |
| CSS regressions during token migration | Medium | Medium | Visual regression checklist; keep portal CSS isolated |
| Odoo duplicate pages serve wrong content | Medium | High | Pin `ODOO_CMS_HOME_PAGE_ID`; clean staging DB |
| Legacy JS loads drifted public CSS | Medium | Medium | Remove public CSS duplicates |
| Scope creep into portal refactor | Medium | Low | Keep marketing and portal tracks separate |

---

## 9. What Is Working Well (Preserve)

- **Odoo JSON-2 client** — clean, typed, cached (`lib/server/odoo/client.ts`)
- **Server-side fetching with ISR** — correct pattern for headless CMS
- **HTML rewrite/sanitize pipeline** — good transitional bridge (`rewrite-html.ts`)
- **Marketing/portal CSS isolation intent** — separate header CSS, no Bootstrap on marketing
- **Static section components** — good visual reference for Phase 3 pixel-perfect rebuild
- **Hybrid fallback pattern** — `CmsRoutePage` with static fallback is a sensible migration bridge
- **TypeScript throughout** — strong typing in server layer and most components

---

## 10. Sign-off Checklist (Phase 1 Complete)

- [x] Component inventory documented
- [x] CSS inventory documented
- [x] Technical debt report with prioritized items
- [x] Odoo CMS page audit (134 pages, 22 published)
- [x] Architecture alignment scorecard
- [x] Phase 2–3 remediation roadmap

**Phase 1 status: Complete**  
**Ready to proceed to Phase 2 (Design System)**
