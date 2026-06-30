# Phase 4 — Software Solutions Page

**Route:** `/software`  
**Odoo page URL:** `/software-solutions` (website aptusinfotech.com)  
**JSON field:** `x_software_sections_json` — label **Software Page Sections JSON (Next.js)**

---

## What this page does

Same pattern as the homepage and ELV page:

- Odoo stores section content in JSON
- Next.js renders React sections (hero, intro, categories grid, process, why choose, contact CTA)
- Odoo HTML builder is **not** used for this route

---

## Setup (developers, one time)

```bash
npm run cms:setup-software-field   # Create field on website.page
npm run cms:seed-software          # Seed default JSON to /software-solutions page
```

Optional env overrides in `.env.local`:

```env
# ODOO_CMS_SOFTWARE_JSON_FIELD=x_software_sections_json
# ODOO_CMS_SOFTWARE_PAGE_URL=/software-solutions
# ODOO_CMS_SOFTWARE_PAGE_ID=123
```

---

## Where to edit in Odoo

1. Open **Website → Site → Pages**
2. Open **Software Solutions** (url `/software-solutions`, website aptusinfotech.com)
3. Find **Software Page Sections JSON (Next.js)** — add via Studio if not visible
4. Edit JSON → **Save** → refresh `http://localhost:3000/software`

---

## JSON sections

| Key | What it controls |
|-----|------------------|
| `hero` | Page title, subtitle, CTA button |
| `intro` | Two-column intro with eyebrow + paragraphs |
| `categories` | Grid of software category cards |
| `process` | 5-step delivery process |
| `whyChoose` | Why Aptus cards |
| `showContactCta` | Show/hide contact banner at bottom |

Only include keys you want to override — omitted sections use code defaults.

---

## Files

| File | Purpose |
|------|---------|
| `src/app/(site)/software/page.tsx` | Route |
| `src/components/pages/software/SoftwarePageView.tsx` | Section layout |
| `src/lib/cms/software-content.ts` | Default content fallback |
| `src/lib/cms/software-json.ts` | Parse/merge Odoo JSON |
| `src/lib/cms/software-mapper.ts` | Odoo → props |

See also: [ODOO-ELV-JSON.md](./ODOO-ELV-JSON.md) and [ODOO-HOMEPAGE-JSON.md](./ODOO-HOMEPAGE-JSON.md).
