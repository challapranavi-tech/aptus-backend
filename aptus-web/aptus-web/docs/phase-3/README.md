# Phase 3 — Homepage Rebuild

**Date:** June 24, 2026  
**Status:** Complete

---

## Deliverables

| Item | Status |
|------|--------|
| React section composition (no HTML injection on `/`) | Done |
| Typed section models | `src/types/sections.ts` |
| CMS content fetcher + mapper | `content-fetcher.ts`, `cms-mapper.ts` |
| Section components | `src/components/sections/` |
| GSAP + ScrollTrigger animations | `RevealOnScroll`, `HeroEntrance` |
| Odoo SEO metadata integration | Meta from Odoo, content from structured defaults |

---

## Architecture

```
HomePage (RSC)
  └── fetchHomePageContent()
        ├── fetchOdooHomePage()     ← Odoo website.page (SEO)
        └── mapOdooToHomePageContent()  ← typed section props
  └── <HomePageView content={...} />
        ├── HeroSection
        ├── FeatureSection × N
        ├── ServicesSection
        ├── KeyEnablersSection
        └── TestimonialSection
```

**Key rule enforced:** The homepage never renders `CmsPageBody` / `dangerouslySetInnerHTML`. Next.js owns all presentation.

---

## Section Components

| Component | Props source | Animation |
|-----------|--------------|-----------|
| `HeroSection` | `content.hero` | `HeroEntrance` (load) |
| `FeatureSection` | `content.features[]` | `RevealOnScroll` |
| `ServicesSection` | `content.services` | Staggered reveal |
| `KeyEnablersSection` | `content.keyEnablers` | Staggered cards |
| `TestimonialSection` | `content.testimonial` | `RevealOnScroll` |

All sections accept optional `presentation` settings (Phase 2 mapper) for future Odoo editor presets.

---

## CMS Integration

### Current (Phase 3)

- **SEO** from Odoo: `metaTitle`, `metaDescription`
- **Section content** from `DEFAULT_HOMEPAGE_CONTENT` in `homepage-content.ts`
- Mapper overlays Odoo meta onto static section props

### Next (Odoo model migration)

Extend `mapOdooToHomePageContent()` to parse structured JSON fields from a custom Odoo model (e.g. `website.homepage.section` records) instead of static defaults.

---

## GSAP Layer

| File | Role |
|------|------|
| `src/hooks/useGSAP.ts` | Registers ScrollTrigger, re-exports GSAP |
| `src/components/animations/RevealOnScroll.tsx` | Scroll-triggered fade/slide |
| | `HeroEntrance` — hero load animation |

Dependencies: `gsap`, `@gsap/react`

Animations are isolated in client components; section shells remain server-rendered where possible.

---

## Files Removed

- `src/components/home/*` — replaced by `src/components/sections/*`

---

## Verification

```bash
npm run dev          # Homepage at http://localhost:3000
npm run build        # Production build
```

Homepage should show React sections with scroll animations. Odoo HTML injection path is no longer used for `/`.

---

## Next Steps (Phase 4)

- Apply section pattern to inner pages (`/software`, `/about-us`, etc.)
- Add Odoo structured section models
- Add routes for `/elv-solutions`, `/aptus-case-studies`
- Wire nav dropdown links
