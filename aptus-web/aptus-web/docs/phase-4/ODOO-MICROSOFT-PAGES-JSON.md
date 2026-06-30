# Microsoft Pages — Odoo JSON Guide

Microsoft uses the same **marketing page** pattern as About, Adobe, Autodesk, and Oracle.

**Field:** `x_page_sections_json` on `website.page`

## Pages

| Route | Odoo URL | Page ID |
|-------|----------|---------|
| `/microsoft` (hub) | `/microsoft` | 178 |
| `/microsoft-365-apps` | `/microsoft-365-apps` | 193 |
| `/microsoft-365-business` | `/microsoft-365-business` | 196 |
| `/microsoft-visio` | `/microsoft-visio` | 222 |
| `/power-bi` | `/power-bi` | 198 |

## Setup

```bash
npm run cms:setup-page-field       # once
npm run cms:export-microsoft-json  # export JSON from code defaults
npm run cms:seed-microsoft-pages   # push JSON to Odoo
```

JSON templates: `content/odoo-json/microsoft/`

## Renderer

- Hub: `MicrosoftPageView` → `MarketingPageView`
- Products: `MicrosoftPageView` with sub-nav → `MarketingPageView`
