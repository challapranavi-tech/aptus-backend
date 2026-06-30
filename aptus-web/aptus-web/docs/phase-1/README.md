# Phase 1 — System Audit

**Project:** Aptus Infotech Modernization (Odoo Headless CMS + Next.js)  
**Date:** June 24, 2026  
**Scope:** `aptus-web` marketing site, CMS integration, and shared frontend assets

## Deliverables

| Document | Description |
|----------|-------------|
| [Component Inventory](./COMPONENT-INVENTORY.md) | All React components, responsibilities, line counts, architecture alignment |
| [CSS Inventory](./CSS-INVENTORY.md) | Stylesheets, design tokens, duplication, and conflict analysis |
| [Technical Debt Report](./TECHNICAL-DEBT-REPORT.md) | Prioritized issues, risks, and Phase 2–3 recommendations |
| [Cleanup Report](./CLEANUP-REPORT.md) | Odoo CMS pin + CSS duplicate removal (completed) |

## Executive Summary

The codebase is a **hybrid platform**: a Next.js 15 marketing site with Odoo CMS HTML injection, plus a separate customer portal backed by Odoo ERP. The marketing side has a solid foundation (server-side Odoo fetch, static React section fallbacks, Tailwind theme) but **does not yet match the target architecture** where Odoo supplies structured content and Next.js owns all presentation.

### Key metrics

| Area | Count |
|------|-------|
| React components (`src/components/`) | 41 files |
| Marketing section components | 7 (+ 3 shared primitives) |
| App routes (marketing) | 4 explicit + catch-all |
| Odoo `website.page` records | 134 (22 published) |
| CSS files (excl. `node_modules`) | 7 in `src/`, 2 mirrored in `public/` |
| Total CSS lines | ~9,300 |
| GSAP integration | None |
| Components over 300 lines | 3 (all portal) |

### Critical finding

When Odoo returns homepage HTML (currently the live path), **Next.js cedes presentation control** via `dangerouslySetInnerHTML`. The static React homepage (`StaticHomePage`) is architecturally correct but only used as a fallback.

### Recommended next step

Proceed to **Phase 2 (Design System)** in parallel with scoping **Phase 3 (Homepage Rebuild)** — specifically the Odoo structured content schema and `cms-mapper` layer that will replace HTML injection for the homepage.
