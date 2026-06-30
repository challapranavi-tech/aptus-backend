# Oracle Pages — Odoo JSON Guide

Oracle uses the same **marketing page** pattern as About, Adobe, and Autodesk.

**Field:** `x_page_sections_json` on `website.page`

## Pages

| Route | Odoo URL | Page ID |
|-------|----------|---------|
| `/oracle` (hub) | `/oracle` | 279 |
| `/oracle-primavera-p6` | `/oracle-primavera-p6` | 176 |
| `/aconex` | `/aconex` | 221 |

## Setup

```bash
npm run cms:setup-page-field    # once
npm run cms:export-oracle-json  # export JSON from code defaults
npm run cms:seed-oracle-pages   # push JSON to Odoo
```

JSON templates: `content/odoo-json/oracle/`

## Renderer

- Hub: `OraclePageView` → `MarketingPageView`
- Products: `OraclePageView` with sub-nav → `MarketingPageView`
