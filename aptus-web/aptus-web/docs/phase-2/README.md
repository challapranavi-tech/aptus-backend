# Phase 2 — Design System

**Date:** June 24, 2026  
**Status:** Complete

---

## Deliverables

| Item | Location |
|------|----------|
| Design tokens (CSS variables) | `src/styles/tokens.css` |
| Tailwind theme extension | `tailwind.config.ts` |
| CMS presentation mapper | `src/lib/design-system/presentation.ts` |
| UI primitives | `src/components/ui/` |
| Migrated marketing components | `FeatureSection`, `ServicesGrid`, `MarketingSections` |

---

## 1. Token System

All marketing design values live in `src/styles/tokens.css` and are imported via `globals.css`.

### Colors

| Token | Value | Tailwind |
|-------|-------|----------|
| `--aptus-color-primary` | `#1352a3` | `bg-aptus-primary` |
| `--aptus-color-green` | `#13934b` | `bg-aptus-green` |
| `--aptus-color-accent` | `#67db85` | `bg-aptus-accent` |
| `--aptus-color-amber` | `#f5a623` | `bg-aptus-amber` |
| `--aptus-color-purple` | `#5b3ea6` | `bg-aptus-purple` |
| `--aptus-color-surface-muted` | `rgba(36,100,140,0.06)` | `bg-aptus-section` |

Legacy aliases (`--aptus-primary`, etc.) remain for `cms-content.css` and `site-header.css`.

### Typography

- Font families: Poppins (default), Inter, Manrope — loaded in `app/layout.tsx`
- Scale: `--aptus-font-size-xs` through `--aptus-font-size-5xl`
- Tailwind: `text-aptus-sm`, `text-aptus-lg`, `text-aptus-3xl`, etc.

### Spacing

- Base scale: `--aptus-space-1` through `--aptus-space-20`
- Section padding: `--aptus-section-padding-y` (4rem), `--aptus-section-padding-y-lg` (5rem)
- Tailwind: `py-section`, `py-section-lg`

### Layout

- Content max width: `1300px` → `max-w-content`
- Narrow: `48rem` → `max-w-narrow`

### Elevation & Radius

- Shadows: `shadow-aptus`, `shadow-aptus-lg`, `shadow-aptus-primary`
- Radius: `rounded-aptus`, `rounded-aptus-lg`, `rounded-pill`

---

## 2. CMS Presentation Presets

Odoo editors will eventually choose from controlled presets. The mapper in `presentation.ts` converts those enums to data attributes and classes — **never raw CSS**.

| Odoo preset | Maps to |
|-------------|---------|
| Theme: Light / Dark | `data-aptus-theme` |
| Font: Inter / Poppins / Manrope | `data-aptus-font` |
| Font scale: Small / Medium / Large | `data-aptus-font-scale` |
| Color: Brand Blue / Green / Purple | `data-aptus-color` |
| Variant: Standard / Compact / Featured | Section spacing classes |
| Alignment: Left / Center / Right | `text-left` / `text-center` / `text-right` |
| Visibility: Show / Hide | `hidden` when false |

Example (Phase 3):

```tsx
<Section presentation={{ theme: "light", alignment: "center", variant: "featured" }}>
  ...
</Section>
```

---

## 3. UI Components

### Button

```tsx
import { Button } from "@/components/ui";

<Button href="/software" variant="primary">Read More</Button>
<Button href="tel:+968..." variant="outline-light">Call Us</Button>
<Button variant="cta" onClick={...}>Get Started</Button>
```

Variants: `primary` | `secondary` | `cta` | `outline` | `outline-light` | `ghost`  
Sizes: `sm` | `md` | `lg`

### Container

```tsx
<Container size="content">{children}</Container>
```

### Section

```tsx
<Section background="muted" spacing="standard">{children}</Section>
```

Backgrounds: `white` | `muted` | `primary` | `gradient`  
Spacing: `standard` | `compact` | `featured`

### Card

```tsx
<Card variant="standard">
  <CardTitle>Title</CardTitle>
  <CardBody>Body text</CardBody>
</Card>
```

Variants: `standard` | `compact` | `featured`

### SectionHeading + AccentSpan

```tsx
<SectionHeading eyebrow="Services" title={<>We deliver <AccentSpan>value</AccentSpan></>} align="center" />
```

---

## 4. Component Migration (Phase 2)

| Component | Changes |
|-----------|---------|
| `ReadMoreButton` | Wraps `Button` |
| `FeatureSection` | Uses `Section` + `Container` |
| `ServicesGrid` | Uses `Section` + `Container` + `Card` |
| `MarketingSections` | Uses `Section`, `Container`, `Card`, `Button` |

Remaining home sections (`KeyEnablers`, `Testimonial`, `HeroBanner`) will migrate in Phase 3.

---

## 5. Usage Guidelines

1. **Marketing site only** — use Tailwind + design tokens; do not add Bootstrap
2. **No inline hex colors** — use `aptus-*` Tailwind classes or CSS variables
3. **Sections use `<Section>` + `<Container>`** — consistent spacing and max-width
4. **CTAs use `<Button>` or `<ReadMoreButton>`** — not ad-hoc anchor styles
5. **Portal CSS (`aptus.css`)** — unchanged in Phase 2; future pass will reference tokens

---

## 6. Next Steps (Phase 3)

- Move `components/home/` → `components/sections/`
- Wire Odoo structured content → `cms-mapper` → section props
- Apply `presentation` prop from Odoo settings on each section
- Add GSAP animation hooks on section roots
