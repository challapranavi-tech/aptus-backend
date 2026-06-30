# Phase 4 — Aptus Case Studies Page

**Route:** `/aptus-case-studies`  
**Odoo page URL:** `/aptus-case-studies` (website aptusinfotech.com)  
**JSON field:** `x_case_studies_sections_json` — label **Case Studies Page Sections JSON (Next.js)**

---

## Setup (developers, one time)

```bash
npm run cms:setup-case-studies-field
npm run cms:seed-case-studies
```

Optional env overrides in `.env.local`:

```env
# ODOO_CMS_CASE_STUDIES_JSON_FIELD=x_case_studies_sections_json
# ODOO_CMS_CASE_STUDIES_PAGE_URL=/aptus-case-studies
# ODOO_CMS_CASE_STUDIES_PAGE_ID=161
```

---

## JSON sections

| Key | What it controls |
|-----|------------------|
| `hero` | Page title and subtitle |
| `caseStudies` | Project cards with PDF links |
| `painPoints` | Challenge cards + closing paragraph |
| `whyChoose` | Why Aptus cards |
| `transformCta` | Mid-page quote banner |
| `testimonials` | Client quote cards |
| `showContactCta` | Show/hide contact banner at bottom |

Only include keys you want to override — omitted sections use code defaults.

---

## Files

| File | Purpose |
|------|---------|
| `src/app/(site)/aptus-case-studies/page.tsx` | Route |
| `src/components/pages/aptus-case-studies/CaseStudiesPageView.tsx` | Section layout |
| `src/lib/cms/case-studies-content.ts` | Default content fallback |
| `src/lib/cms/case-studies-json.ts` | Parse/merge Odoo JSON |
| `src/lib/cms/case-studies-mapper.ts` | Odoo → props |
