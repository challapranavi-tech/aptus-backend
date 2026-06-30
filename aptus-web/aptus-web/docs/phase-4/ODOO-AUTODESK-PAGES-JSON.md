# Autodesk Product Pages — Odoo JSON Guide

All 15 Autodesk product pages use the same **marketing page** pattern as About Us and Adobe.

**Field:** `x_page_sections_json` on `website.page`

## Pages

| Route | Odoo URL |
|-------|----------|
| `/autocad` | `/autocad` |
| `/3ds-max` | `/3ds-max` |
| `/revit` | `/revit` |
| `/civil-3d` | `/civil-3d` |
| `/aec-collection` | `/aec-collection` |
| `/autocad-lt` | `/autocad-lt` |
| `/bim-collaborate-pro` | `/bim-collaborate-pro` |
| `/autodesk-docs` | `/autodesk-docs` |
| `/autodesk-build` | `/autodesk-build` |
| `/autodesk-takeoff` | `/autodesk-takeoff` |
| `/navisworks` | `/navisworks` |
| `/infodrainage` | `/infodrainage` |
| `/infowater-pro` | `/infowater-pro` |
| `/infoworks-icm` | `/infoworks-icm` |
| `/infoworks-ws-pro` | `/infoworks-ws-pro` |

## Setup

```bash
npm run cms:setup-page-field          # once — creates x_page_sections_json
npm run cms:export-autodesk-json      # export JSON from code defaults
npm run cms:seed-autodesk-inner-pages # push JSON to Odoo website.page records
```

JSON templates live in `content/odoo-json/autodesk/`.

## JSON sections

`hero`, `intro`, `cardSections`, `showContactCta`

Omitted keys use defaults from `src/lib/cms/autodesk-pages-content.ts`.

## Renderer

- `AutodeskPageView` → `MarketingPageView` (React, not Odoo HTML)
