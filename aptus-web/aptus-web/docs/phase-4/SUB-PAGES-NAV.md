# Sub-pages & Navigation

## What works now

### Full navigation (dropdowns)

The header menu is synced from **aptusinfotech.com** and includes:

- **About Us** — 8 sub-pages (Our Team, Our Story, Contact Us, etc.)
- **Software** — nested categories (Autodesk, Adobe, Microsoft, Cyber Security, …)
- **ELV Solutions** — nested ELV services (CCTV, Access Control, …)
- **Aptus Case Studies**

Regenerate after live site menu changes:

```bash
npm run cms:sync-nav
```

### Sub-page routing

| Page type | Example | How it loads |
|-----------|---------|--------------|
| **Rebuilt (React + Odoo JSON)** | `/`, `/software`, `/elv-solutions`, `/aptus-case-studies`, About pages, Software sub-pages | Typed sections — no HTML injection |
| **Sub-pages (for now)** | `/cctv`, ELV services, … | Odoo CMS HTML via `[...slug]` catch-all |

All dropdown links point to real routes. Sub-pages load content from Odoo until each is rebuilt like Software/ELV.

## Rebuild priority (same pattern as main pages)

1. ~~About Us hub + sub-pages~~ (done)
2. ~~Software sub-pages~~ (`/autodesk`, `/autocad`, `/adobe`, …) — see `ODOO-SOFTWARE-SUB-PAGES-JSON.md`
3. ELV service pages (`/cctv`, `/access-control-system`, …)

Each rebuild adds:

- `x_*_sections_json` field in Odoo
- React page view + content fetcher
- Optional seed script

## Env notes

- `ODOO_CMS_INCLUDE_UNPUBLISHED=true` — required while staging pages are draft
- `/software-solutions` redirects to `/software`
