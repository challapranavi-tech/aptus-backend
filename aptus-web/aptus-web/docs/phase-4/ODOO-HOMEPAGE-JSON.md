# Odoo Homepage JSON Field — Editor Guide

**Field name:** `x_homepage_sections_json`  
**Model:** `website.page`  
**Homepage record:** id **226** (website aptusinfotech.com, url `/`)

---

## What this field does

Editors paste **JSON** describing homepage sections. Next.js reads this field on every request (no cache in dev) and renders React components — **not** the Odoo HTML builder.

Changes appear on `http://localhost:3000/` after save + browser refresh.

---

## Where to edit in Odoo

1. Open **Website → Site → Pages**
2. Open **Home** (website aptusinfotech.com)
3. Find **Homepage Sections JSON (Next.js)** / `x_homepage_sections_json`
4. Edit JSON and **Save**

If the field is not visible:

- Enable **Studio** (or ask admin)
- Add field to the form view, or use **Settings → Technical → Database Structure → Models → Page**

---

## JSON structure

Only include sections you want to override. Omitted sections use code defaults.

```json
{
  "hero": {
    "id": "hero",
    "visible": true,
    "imageSrc": "/images/25-years-1024x256.png",
    "imageAlt": "Aptus Infotech 25 Years",
    "imageWidth": 1024,
    "imageHeight": 256
  },
  "features": [
    {
      "id": "elv",
      "visible": true,
      "eyebrow": "ELV & Security",
      "title": {
        "before": "Aptus Infotech's comprehensive",
        "accent": "ELV & Security"
      },
      "description": "Your updated description here.",
      "imageSrc": "/images/Aptusinfo.jpg",
      "imageAlt": "ELV and Security",
      "href": "/elv-solutions",
      "imagePosition": "left",
      "background": "white"
    }
  ],
  "services": {
    "id": "services",
    "visible": true,
    "eyebrow": "SERVICES",
    "title": { "before": "We Provide Industry Demand", "accent": "Services" },
    "items": [
      {
        "title": "ELV Solutions",
        "description": "...",
        "icon": "lightbulb",
        "hoverImageSrc": "https://aptusinfotech.com/wp-content/uploads/2025/05/Home-Automation.webp"
      }
    ]
  },
  "keyEnablers": { "...": "..." },
  "testimonial": { "...": "..." }
}
```

### Quick test edit

Change one value, e.g. hero imageAlt:

```json
"imageAlt": "TEST — Odoo sync works"
```

Save in Odoo → refresh localhost → banner alt text / content should reflect the change.

---

## SEO (separate fields)

Use standard Odoo fields on the same page:

- **Website meta title**
- **Website meta description**

These update the browser tab and meta tags without editing JSON.

---

## Setup commands (developers)

```bash
npm run cms:setup-homepage-field   # Create field on Odoo (already done on staging)
npm run cms:seed-homepage          # Push default JSON to page id=226
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Changes not showing | Hard refresh (Ctrl+Shift+R); run `npm run dev:clean` |
| Invalid JSON | Odoo save may fail or site uses defaults — validate JSON at jsonlint.com |
| Field missing | Run `npm run cms:setup-homepage-field` |
| Wrong page edited | Must be page **id=226**, website **7** |

---

## Icon values for services

`lightbulb` | `cog` | `bim`

## Feature backgrounds

`white` | `muted`

## Image paths

Use paths under `/images/...` for local assets, or full `https://` URLs for Odoo/CDN images.
