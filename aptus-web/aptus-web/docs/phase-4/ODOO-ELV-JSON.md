# Phase 4 — ELV Solutions Page

**Route:** `/elv-solutions`  
**Odoo page URL:** `/elv-solutions` (website aptusinfotech.com)  
**JSON field:** `x_elv_sections_json` — label **ELV Page Sections JSON (Next.js)**

---

## What this page does

Same pattern as the homepage:

- Odoo stores section content in JSON
- Next.js renders React sections (hero, intro, solutions grid, process, why choose, contact CTA)
- Odoo HTML builder is **not** used for this route

---

## Setup (developers, one time)

```bash
npm run cms:setup-elv-field   # Create field on website.page
npm run cms:seed-elv          # Seed default JSON to /elv-solutions page
```

Optional env overrides in `.env.local`:

```env
# ODOO_CMS_ELV_JSON_FIELD=x_elv_sections_json
# ODOO_CMS_ELV_PAGE_URL=/elv-solutions
# ODOO_CMS_ELV_PAGE_ID=123
```

---

## Where to edit in Odoo

1. Open **Website → Site → Pages**
2. Open **ELV Solutions** (url `/elv-solutions`, website aptusinfotech.com)
3. Use direct form link if the list opens the website preview:

   `https://YOUR-ODOO-URL/web#model=website.page&view_type=form&domain=[('url','=','/elv-solutions')]`

4. Find **ELV Page Sections JSON (Next.js)** — add via Studio if not visible (same as homepage)
5. Edit JSON → **Save** → refresh `http://localhost:3000/elv-solutions`

---

## JSON sections

| Key | What it controls |
|-----|------------------|
| `hero` | Page title, subtitle, CTA button |
| `intro` | Two-column intro with eyebrow + paragraphs |
| `solutions` | Grid of ELV service cards |
| `process` | 5-step delivery process |
| `whyChoose` | Why Aptus cards |
| `showContactCta` | Show/hide contact banner at bottom |

Only include keys you want to override — omitted sections use code defaults.

---

## Quick test

Change hero accent:

```json
"title": { "before": "Comprehensive", "accent": "TEST ELV", "after": "in Oman" }
```

Save in Odoo → hard refresh localhost.

---

## Files

| File | Purpose |
|------|---------|
| `src/app/(site)/elv-solutions/page.tsx` | Route |
| `src/components/pages/elv-solutions/ElvPageView.tsx` | Section layout |
| `src/lib/cms/elv-content.ts` | Default content fallback |
| `src/lib/cms/elv-json.ts` | Parse/merge Odoo JSON |
| `src/lib/cms/elv-mapper.ts` | Odoo → props |

See also: [ODOO-HOMEPAGE-JSON.md](./ODOO-HOMEPAGE-JSON.md) for the homepage editor guide.
