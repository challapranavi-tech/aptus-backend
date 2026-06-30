# ETAP Page — CMS Architecture

**Odoo decides WHAT content appears. Next.js decides HOW that content appears.**

ETAP uses the **same workflow as ELV, homepage, and software pages**: JSON on `website.page`, fetched via the Odoo JSON-2 API.

## Data flow

```
Odoo website.page (/etap, id 175)
  └── x_etap_sections_json
           │
           ▼
fetchEtapPageData()  →  mapOdooToEtapPageData()
           │
           ▼
EtapPageRenderer + section components (Tailwind, GSAP)
```

## Editing content

1. In Odoo Studio, add **ETAP Page Sections JSON (Next.js)** (`x_etap_sections_json`) to the `website.page` form for `/etap`.
2. Paste or edit JSON (export template: `content/odoo-json/etap/etap-sections.json`).
3. SEO fields: standard `website_meta_title` / `website_meta_description` on the same page record.

## Setup scripts

```bash
npm run cms:setup-etap-field   # create x_etap_sections_json on website.page
npm run cms:seed-etap          # push default JSON to page id 175 (/etap)
```

Requires `ODOO_BASE_URL`, `ODOO_API_KEY`, and `ODOO_DB` in `.env.local`.

## Next.js files

| Path | Purpose |
|------|---------|
| `content/odoo-json/etap/etap-sections.json` | Export template / default content |
| `src/types/etap-page.ts` | CMS JSON schema |
| `src/types/etap.ts` | Renderer prop types |
| `src/lib/cms/etap-content.ts` | Default content (from JSON file) |
| `src/lib/cms/etap-json.ts` | Parse / merge Odoo JSON |
| `src/lib/cms/etap-mapper.ts` | CMS JSON → renderer props |
| `src/lib/cms/etap-icons.ts` | Icon key → SVG paths |
| `src/lib/cms/fetch-etap-page.ts` | Odoo fetch + cache |
| `src/components/pages/etap/` | Section components |
| `src/app/(site)/[...slug]/page.tsx` | Routes `/etap` |

## Environment

```env
ODOO_BASE_URL=...
ODOO_API_KEY=...
ODOO_DB=...
# Optional overrides:
ODOO_CMS_ETAP_JSON_FIELD=x_etap_sections_json
ODOO_CMS_ETAP_PAGE_ID=175
```

## Fallback behavior

If Odoo is unavailable or JSON is empty, the page renders from `content/odoo-json/etap/etap-sections.json` defaults — same pattern as ELV and other CMS pages.

## Images

Product images live in `public/images/etap/` and are referenced in JSON as `/images/etap/...`.

## Note on aptus_etap_page Odoo module

The optional `odoo-etap-page/aptus_etap_page` headless CMS module (`GET /api/etap-page`) is **not** used by this Next.js app. ETAP content is managed on the existing `website.page` record like other site pages.
