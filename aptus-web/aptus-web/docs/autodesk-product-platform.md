# Autodesk Product Platform

> **Active approach:** Autodesk pages use `website.page` + `x_page_sections_json` (same as About/Adobe).
> See [ODOO-AUTODESK-PAGES-JSON.md](./phase-4/ODOO-AUTODESK-PAGES-JSON.md).
> The custom `aptus.autodesk.product` module below is optional / deferred.

**Odoo decides WHAT content appears. Next.js decides HOW that content appears.**

## Architecture

```
Odoo aptus.autodesk.product
  ├── Structured fields (hero, SEO, category, CTA)
  └── JSON fields (features, benefits, FAQs, media, downloads)
           │
           ▼
src/lib/server/odoo/autodesk-products.ts
           │
           ▼
AutodeskProductPageView (premium React + GSAP)
```

## Odoo module

Install `odoo-modules/aptus_autodesk_product` on staging Odoo:

1. Copy module to Odoo addons path
2. Update apps list → Install **Aptus Autodesk Product Platform**
3. Edit products under **Website → Configuration → Autodesk Products**

## API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/products` | List published products (`?category=engineering_design`) |
| GET | `/api/products/[slug]` | Single product JSON |
| GET | `/api/product-categories` | Category list with counts |
| GET | `/api/site-settings` | Site contact metadata |
| POST | `/api/products/leads` | Public lead → Odoo CRM |

## Dynamic routing

New products added in Odoo with `url_slug` + `is_published` appear at `/{slug}` automatically via `[...slug]/page.tsx` — no frontend code changes required.

Static fallbacks in `autodesk-pages-content.ts` apply when the Odoo model is unavailable.

## Environment

```env
ODOO_AUTODESK_PRODUCT_MODEL=aptus.autodesk.product
ODOO_SOFTWARE_CRM_TEAM_ID=5
ODOO_SOFTWARE_COMPANY_ID=2
```

## Scripts

```bash
npm run cms:seed-autodesk-products    # Full content for all 15 products (aptus.autodesk.product)
npm run cms:seed-autodesk-inner-pages # Legacy website.page JSON (optional)
```

JSON export templates are written to `content/odoo-json/autodesk/` when seeding.

## Lead workflow

Visitor submits form on product page → `POST /api/products/leads` → `crm.lead` opportunity on software sales team.
