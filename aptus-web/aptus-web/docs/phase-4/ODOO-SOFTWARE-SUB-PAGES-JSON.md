# Software Category Hubs — Odoo JSON

Build **11 category landing pages** first. Inner product pages (AutoCAD, Photoshop, etc.) stay on Odoo HTML until each category hub is done.

## Build order

| # | Category | Website URL | Odoo page ID |
|---|----------|-------------|--------------|
| 1 | Autodesk | `/autodesk` | **162** |
| 2 | Electrical Software | `/electrical-software` | Create in Odoo |
| 3 | Adobe | `/adobe` | **177** |
| 4 | Oracle | `/oracle` | **279** (hub) + inner pages seeded |
| 5 | Microsoft | `/microsoft` | **178** (hub) + 4 inner pages seeded |
| 6 | Multimedia | `/multimedia-software-solutions` | **180** |
| 7 | Quantity Takeoff | `/quantity-takeoff` | Create in Odoo |
| 8 | Structural Software | `/structural-software` | Create in Odoo |
| 9 | Cyber Security Solutions | `/cyber-security-solution` | **179** |
| 10 | Educational Software | `/educational-software` | Create in Odoo |
| 11 | EDMS | `/edms` | Create in Odoo |

## Field

Use **`Page Sections JSON (Next.js)`** (`x_page_sections_json`) on each category `website.page`.

## Seed existing Odoo categories

```bash
npm run cms:seed-software-pages
```

## Minimal JSON per category

```json
{
  "hero": {
    "id": "hero",
    "title": { "accent": "Autodesk" }
  },
  "showContactCta": true
}
```

## Inner pages (later)

Product pages like `/autocad`, `/revit`, `/fortinet` still load Odoo HTML until we rebuild them category by category.

## Nav

The Software dropdown shows all 11 categories with a dark panel (matching live site). Hover a category to open its product flyout.
