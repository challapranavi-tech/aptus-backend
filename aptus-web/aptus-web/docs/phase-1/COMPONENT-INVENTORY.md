# Component Inventory — Phase 1 Audit

**Date:** June 24, 2026  
**Total components:** 41 TSX files in `src/components/`

---

## 1. Inventory by Domain

### 1.1 Marketing — Homepage Sections (`components/home/`)

| Component | Lines | Props | Data source | Fetches API | Reusable | Notes |
|-----------|-------|-------|-------------|-------------|----------|-------|
| `StaticHomePage.tsx` | 18 | None | Composes children | No | No | Page-level composer only |
| `HeroBanner.tsx` | 17 | None | Hardcoded image path | No | Partial | Single image banner; no title/subtitle props |
| `FeatureSection.tsx` | 88 | Typed (`FeatureSectionProps`) | Props | No | **Yes** | Generic two-column feature block |
| `ElvSection.tsx` | (in FeatureSection) | None | Hardcoded copy + image | No | No | Wrapper around `FeatureSection` |
| `SoftwareSection.tsx` | (in FeatureSection) | None | Hardcoded copy + image | No | No | Wrapper around `FeatureSection` |
| `ServicesGrid.tsx` | 64 | None | `lib/constants.ts` → `SERVICES` | No | Partial | 3-card grid; no props interface |
| `KeyEnablers.tsx` | 36 | None | `lib/constants.ts` → `KEY_ENABLERS` | No | Partial | Numbered list section |
| `Testimonial.tsx` | 34 | None | Hardcoded quote | No | Partial | Single static testimonial |

**Architecture alignment:** Partial. `FeatureSection` follows the target pattern (typed props, no fetch). Section wrappers (`ElvSection`, `SoftwareSection`) and grid sections import constants directly instead of receiving props from a page.

**Gap vs target `sections/` folder:** These should move to `components/sections/` and receive all content via props from the page layer.

---

### 1.2 Marketing — Inner Pages (`components/pages/`)

| Component | Lines | Props | Data source | Notes |
|-----------|-------|-------|-------------|-------|
| `about-us/AboutUsPage.tsx` | 76 | None | Hardcoded JSX + shared sections | Static fallback for `/about-us` |
| `software/SoftwarePage.tsx` | 238 | None | Hardcoded product categories | Static fallback for `/software` |
| `shared/MarketingSections.tsx` | 72 | Typed | `SITE` constant for contact | `PageHero`, `InfoCard`, `ContactCtaSection` |

**Architecture alignment:** Good component patterns (`PageHero` accepts typed props). Content is static, not Odoo-driven. `SoftwarePage` at 238 lines is acceptable but dense — candidate for splitting into sub-sections in Phase 4.

---

### 1.3 CMS Rendering (`components/cms/`)

| Component | Lines | Props | Responsibility | Issue |
|-----------|-------|-------|----------------|-------|
| `CmsPageBody.tsx` | 17 | `html`, `className?` | Renders Odoo HTML via `dangerouslySetInnerHTML` | **Bypasses React presentation layer** |
| `CmsRoutePage.tsx` | 14 | `odooUrl`, `fallback` | Fetches Odoo page; renders HTML or fallback | **Fetches inside component**, not page file |

**Used by:**
- `app/(site)/page.tsx` — homepage
- `app/(site)/about-us/page.tsx` — via `CmsRoutePage`
- `app/(site)/software/page.tsx` — via `CmsRoutePage`
- `app/(site)/[...slug]/page.tsx` — catch-all (Odoo only, no fallback)

---

### 1.4 Layout (`components/layout/`)

| Component | Lines | Props | Styling | Notes |
|-----------|-------|-------|---------|-------|
| `Header.tsx` | 205 | None | `site-header.css` + Tailwind | Sticky masthead, nav dropdowns; dropdown child links are `#` placeholders |
| `HeaderAuthActions.tsx` | 100 | None | Mixed | Login/register/portal links |
| `Footer.tsx` | 95 | None | Tailwind | Contact info from `constants.ts` |

**Architecture alignment:** Good separation from portal. Header is isolated from Bootstrap via dedicated CSS file.

---

### 1.5 UI Primitives (`components/ui/`)

| Component | Lines | Props | Design system role |
|-----------|-------|-------|-------------------|
| `SectionHeading.tsx` | 25 | Typed (`eyebrow`, `title`, `align`, `className`) | Typography primitive |
| `ReadMoreButton.tsx` | 16 | Typed (`href`, `label?`) | CTA primitive |

**Gap:** No Button, Card, Badge, Input, or Container primitives for marketing. Portal uses Bootstrap classes directly.

---

### 1.6 Icons (`components/icons/`)

| Component | Lines | Notes |
|-----------|-------|-------|
| `SocialIcons.tsx` | 39 | SVG icons for footer social links |

---

### 1.7 Auth (`components/auth/`)

| Component | Lines | Domain | Notes |
|-----------|-------|--------|-------|
| `CustomerLoginForm.tsx` | 180 | Portal login | Uses `dangerouslySetInnerHTML` for status messages |
| `LoginForm.tsx` | 93 | General login | — |
| `LoginRedirect.tsx` | 14 | Routing helper | — |
| `LoginStatusBanner.tsx` | 14 | Feedback UI | — |
| `AuthCardFoot.tsx` | 16 | Layout | — |
| `OdooConnectionBanner.tsx` | 37 | Dev/status | Shows Odoo connectivity |

**Out of scope** for marketing modernization but shares Odoo integration patterns.

---

### 1.8 Portal (`components/portal/`) — 18 files

| Component | Lines | Over 300? | Notes |
|-----------|-------|-----------|-------|
| `OrderPaymentModal.tsx` | 491 | **Yes** | Stripe payment flow |
| `OverviewDashboard.tsx` | 332 | **Yes** | Dashboard summary |
| `SubscriptionCard.tsx` | 237 | No | — |
| `PortalSections.tsx` | 210 | No | Legacy section renderer |
| `PortalDashboardShell.tsx` | 170 | No | Layout shell |
| `OrdersPanel.tsx` | 153 | No | — |
| `NotificationsPanel.tsx` | 139 | No | — |
| `DashboardShell.tsx` | 122 | No | — |
| `CancellationConfirmModal.tsx` | 106 | No | — |
| `SubscriptionsPanel.tsx` | 78 | No | — |
| `RenewalConfirmModal.tsx` | 55 | No | — |
| `PortalAuthGuard.tsx` | 51 | No | — |
| `PortalLegacyContent.tsx` | 48 | No | Renders legacy HTML/JS |
| `PortalPageInit.tsx` | 23 | No | — |
| `NotificationCountBadge.tsx` | 18 | No | — |
| `PortalScripts.tsx` | 17 | No | Loads Bootstrap JS from CDN |
| `PortalStyles.tsx` | 9 | No | Imports Bootstrap + aptus CSS |
| `PortalProviders.tsx` | 5 | No | Context wrapper |

**Note:** Portal components are outside the marketing modernization scope but contribute to overall CSS/JS complexity (Bootstrap, legacy JS, monolithic CSS).

---

## 2. Page → Component Data Flow

### Current (Marketing)

```
┌─────────────────────────────────────────────────────────────┐
│  PATH A — Odoo HTML (live when CMS content exists)          │
│  Page (RSC) → fetchOdooHomePage() → CmsPageBody(html)       │
│  ❌ No React sections, no typed props                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PATH B — Static fallback                                   │
│  Page (RSC) → StaticHomePage → section components           │
│  ⚠️  Sections read constants.ts directly, not page props    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PATH C — Hybrid (about-us, software)                       │
│  Page → CmsRoutePage → Odoo HTML OR static fallback page    │
└─────────────────────────────────────────────────────────────┘
```

### Target (Architecture vision)

```
Page (RSC) → content-fetcher → cms-mapper → typed section props
          → HeroSection / ServicesSection / … (presentation only)
```

---

## 3. Route Coverage

| Route | Page file | Odoo URL | Static fallback | Status |
|-------|-----------|----------|-----------------|--------|
| `/` | `(site)/page.tsx` | `/` | `StaticHomePage` | Live — Odoo HTML preferred |
| `/about-us` | `(site)/about-us/page.tsx` | `/about-us` | `AboutUsPage` | Hybrid |
| `/software` | `(site)/software/page.tsx` | `/software-solutions` | `SoftwarePage` | Hybrid |
| `/elv-solutions` | — | `/elv-solutions` | — | **Missing route** (defined in `MAIN_PAGES`) |
| `/aptus-case-studies` | — | `/aptus-case-studies` | — | **Missing route** (defined in `MAIN_PAGES`) |
| `/*` | `(site)/[...slug]/page.tsx` | Matched URL | None (404 if missing) | Catch-all for ~120+ Odoo pages |

**Odoo CMS inventory (staging):** 134 `website.page` records — 22 published, 112 draft. Duplicate URLs exist (e.g. multiple `/`, `/fortinet`, `/kaspersky` records).

---

## 4. Component Standards Checklist

| Standard | Marketing | Portal | CMS |
|----------|-----------|--------|-----|
| Single responsibility | Partial | Mixed | OK |
| Under 300 lines | ✅ All | ❌ 2 files | ✅ |
| TypeScript interfaces | Partial | Partial | Minimal |
| No direct API calls | ✅ Sections | ❌ Hooks in panels | ❌ `CmsRoutePage` fetches |
| No business logic in UI | ✅ | Mixed | N/A |
| Animations isolated | N/A (none) | N/A | N/A |

---

## 5. Missing Components (vs Architecture Vision)

| Planned | Status |
|---------|--------|
| `sections/HeroSection` | Partial — `HeroBanner` is image-only, no text props |
| `sections/ServicesSection` | Partial — `ServicesGrid` exists, not prop-driven |
| `sections/SolutionsSection` | Missing |
| `sections/ProductsSection` | Missing (SoftwarePage is page-level, not section) |
| `sections/TestimonialsSection` | Partial — single static `Testimonial` |
| `sections/CTASection` | Partial — `ContactCtaSection` in shared |
| `animations/*` | Missing entirely |
| `hooks/useGSAP.ts` | Missing |
| Design system: Button, Card, Container | Missing for marketing |

---

## 6. Recommendations for Phase 2–3

1. **Rename/move** `components/home/` → `components/sections/` with prop-driven APIs.
2. **Refactor** `ElvSection`, `SoftwareSection`, `ServicesGrid`, `KeyEnablers`, `Testimonial` to accept typed content props.
3. **Replace** `CmsPageBody` HTML path for homepage with section composition (keep HTML path temporarily for inner pages).
4. **Move fetch** out of `CmsRoutePage` into page files (pattern already used in `(site)/page.tsx`).
5. **Add routes** for `elv-solutions` and `aptus-case-studies` per `MAIN_PAGES`.
6. **Wire nav dropdowns** — currently `#` placeholders in `NAV_ITEMS`.
