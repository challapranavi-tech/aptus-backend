# CSS Inventory — Phase 1 Audit

**Date:** June 24, 2026

---

## 1. Stylesheet Summary

| File | Lines | Size | Loaded by | Domain |
|------|-------|------|-----------|--------|
| `src/styles/customer-dashboard.css` | 4,033 | 98.8 KB | `PortalStyles.tsx` | Portal / auth |
| `public/css/customer-dashboard.css` | 2,608 | 67.7 KB | Legacy JS (?) | Portal — **drifted copy** |
| `src/styles/aptus.css` | 1,195 | 31.8 KB | `PortalStyles.tsx` | Portal / shared buttons |
| `public/css/aptus.css` | 1,195 | 31.8 KB | Legacy JS | **Identical** to `src/` copy |
| `src/styles/site-header.css` | 340 | 8.2 KB | Root layout + portal | Marketing header |
| `src/styles/cms-content.css` | 112 | 3.0 KB | `CmsPageBody.tsx` | Odoo HTML overrides |
| `src/app/globals.css` | 15 | 0.3 KB | Root layout | Tailwind entry + tokens |
| **Total** | **~9,298** | **~241 KB** | | |

### Duplicate analysis

| Pair | Hash match | Action needed |
|------|------------|---------------|
| `src/styles/aptus.css` ↔ `public/css/aptus.css` | ✅ Identical | Consolidate to single source; update legacy JS references |
| `src/styles/customer-dashboard.css` ↔ `public/css/customer-dashboard.css` | ❌ **Different** | **Drift risk** — portal React uses `src/` (4,033 lines); legacy may use `public/` (2,608 lines) |

---

## 2. Styling Architecture

### 2.1 Marketing site

```
globals.css (Tailwind + CSS variables)
    └── site-header.css (isolated masthead — fights Bootstrap bleed)
    └── cms-content.css (Odoo HTML scoping — when CMS path active)
    └── Tailwind utility classes in components
```

**Tailwind theme** (`tailwind.config.ts`):

| Token | Value |
|-------|-------|
| `aptus-primary` | `#1352A3` |
| `aptus-green` | `#13934B` |
| `aptus-accent` | `#67DB85` |
| `aptus-muted` / `aptus-section` | `rgba(36, 100, 140, 0.06)` |
| `font-poppins` | Poppins via `next/font` |
| `max-w-content` | `1300px` |

**CSS variables** (`globals.css`):

```css
:root {
  --aptus-primary: #1352a3;
  --aptus-green: #13934b;
  --aptus-accent: #67db85;
  --aptus-section: rgba(36, 100, 140, 0.06);
}
```

**Gap:** No spacing scale, elevation/shadow tokens, radius tokens, or typography scale as CSS variables. Font sizes are inline Tailwind classes (`text-3xl`, `md:text-5xl`, etc.).

### 2.2 Portal

```
PortalStyles.tsx
    └── bootstrap/dist/css/bootstrap.min.css  (~200 KB)
    └── aptus.css (buttons, navbar, auth, legacy marketing classes)
    └── customer-dashboard.css (monolithic dashboard styles)
    └── site-header.css (shared with marketing)
```

Bootstrap JS loaded from CDN in `PortalScripts.tsx`.

### 2.3 Odoo CMS HTML path

When `CmsPageBody` renders Odoo content:

1. Odoo inline `<style>` blocks are scoped to `.aptus-cms-content` (via `sanitizeOdooCmsHtml`)
2. `cms-content.css` overrides Odoo/Bootstrap snippet classes (`.s_banner`, `.btn-primary`, `.display-*`)
3. Odoo chrome (header/footer) hidden with `display: none !important`

This is a **compatibility shim**, not a design system — it replicates Odoo presentation inside Next.js.

---

## 3. CSS Categories in `aptus.css` (1,195 lines)

| Category | Examples | Used by |
|----------|----------|---------|
| Buttons | `.btn-aptus-primary`, `.btn-aptus-cta`, `.btn-aptus-outline*` | Portal, legacy |
| Navigation | `.aptus-navbar`, `.aptus-nav-link`, `.aptus-topbar` | Portal (marketing uses `site-header.css`) |
| Auth | `.aptus-auth`, `.aptus-auth-card` | Login/register |
| Animations | `.gsap-word` (class only — **no GSAP JS**) | Unused stub |
| Legacy marketing | Various section classes | Portal legacy content |

**Colors in aptus.css (hardcoded, not variables):**

| Color | Hex | Usage |
|-------|-----|-------|
| Brand blue | `#1352A3` | Primary buttons, links |
| Brand green | `#13934B` | Hover states |
| Amber/CTA | `#F5A623` | CTA buttons, focus rings |
| Dark text | `#1A1A2E` | CTA text |

These match Tailwind tokens but are duplicated as raw hex in CSS files.

---

## 4. `site-header.css` Analysis (340 lines)

- **Purpose:** Isolate marketing header from Bootstrap/portal CSS bleed
- **`!important` count:** 124 occurrences
- **Root cause:** Defensive overrides against Bootstrap global styles loaded on portal routes sharing the same layout tree

Key classes: `.aptus-masthead`, `.aptus-masthead__topbar`, `.aptus-masthead__nav`, dropdown menus.

**Debt:** High `!important` density indicates fragile CSS isolation. Phase 2 should use CSS layers or stricter scoping to reduce override warfare.

---

## 5. `cms-content.css` Analysis (112 lines)

Scoped under `.aptus-cms-content`:

| Rule type | Purpose |
|-----------|---------|
| Odoo chrome hiding | Hide embedded header/footer from Odoo embed snippets |
| Typography | h1–h4 sizing, colors, line-height |
| Odoo snippets | `.s_banner`, `.s_features`, `.s_call_to_action` padding |
| Bootstrap compat | `.btn-primary`, `.display-*`, `.container` |
| Social icons | Fix emoji glyph sizing in Odoo embeds |

**Debt:** This file exists solely because Odoo HTML is rendered directly. It should be **deprecated** once structured sections replace HTML injection.

---

## 6. `customer-dashboard.css` Analysis (4,033 lines)

Monolithic file covering:

- `.aptus-customer-dashboard` — dashboard shell
- `.aptus-auth` — login/register layouts
- `.aptus-dashboard-card`, `.aptus-subscription-card` — cards
- `.aptus-navbar` — portal navigation
- Section-specific overrides via `[data-aptus-dashboard-section=...]`
- `@keyframes` for pulse/spin animations

**Debt:** Single 4K-line file violates maintainability goals. Out of marketing scope but contributes to overall project complexity.

---

## 7. Conflict & Duplication Matrix

| Conflict | Severity | Description |
|----------|----------|-------------|
| Tailwind vs Bootstrap | Medium | Marketing uses Tailwind; portal uses Bootstrap. Shared root layout loads `site-header.css` globally. |
| Tailwind vs cms-content.css | Medium | When Odoo HTML renders, cms-content.css applies Bootstrap-like styles inside `.aptus-cms-content` while rest of page uses Tailwind. |
| aptus.css vs Tailwind tokens | Low | Same colors defined in 3 places: Tailwind config, `:root` vars, aptus.css hex values. |
| src vs public CSS drift | **High** | `customer-dashboard.css` differs between `src/` and `public/` — unpredictable styling if legacy JS loads public copy. |
| Inline Odoo styles | Medium | `sanitizeOdooCmsHtml` scopes inline `<style>` from Odoo but cannot fully prevent layout conflicts. |
| `!important` in site-header | Medium | 124 overrides — maintenance burden, specificity wars. |

---

## 8. Dead / Legacy CSS Candidates

| Item | Location | Evidence |
|------|----------|----------|
| `public/css/*.css` | `public/css/` | Duplicates of `src/styles/`; legacy portal JS may reference these |
| `.gsap-word` | `aptus.css:439` | No GSAP library installed; class unused in React components |
| Bootstrap classes in marketing | N/A | Marketing components don't import Bootstrap — clean |
| Odoo snippet overrides | `cms-content.css` | Needed only while HTML injection path exists |

---

## 9. Design Token Gap Analysis (vs Architecture Vision)

| Token system | Status |
|--------------|--------|
| Colors | Partial — 4 brand colors in Tailwind + CSS vars |
| Typography scale | Missing — ad hoc Tailwind classes |
| Spacing scale | Missing — ad hoc `py-16`, `px-4`, `gap-10` |
| Shadows / elevation | Missing — inline `shadow-md`, `shadow-sm` |
| Border radius | Missing — inline `rounded-lg` |
| Font presets (Inter, Poppins, Manrope) | Poppins only |
| Font scale presets (Small, Medium, Large) | Not implemented |
| Theme (Light/Dark) | Not implemented |
| Component variants (Standard, Compact, Featured) | Not implemented |

---

## 10. Recommendations for Phase 2

1. **Create `src/styles/tokens.css`** — single source for colors, spacing, typography, shadows, radius as CSS custom properties.
2. **Extend `tailwind.config.ts`** — map all tokens to Tailwind theme extensions.
3. **Deprecate hex duplicates** in `aptus.css` — reference CSS variables instead.
4. **Resolve public/css drift** — delete or sync `public/css/customer-dashboard.css`; point legacy JS to `src/styles/` copies or remove legacy path.
5. **Reduce `!important` in site-header.css** — investigate CSS `@layer` or portal/marketing style isolation via layout boundaries.
6. **Plan cms-content.css retirement** — mark as transitional; target removal after Phase 3 homepage rebuild.
7. **Do not add Bootstrap to marketing** — continue Tailwind-only for marketing site.
