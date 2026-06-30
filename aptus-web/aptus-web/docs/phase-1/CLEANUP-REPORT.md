# Phase 1 Cleanup Report

**Date:** June 24, 2026  
**Scope:** Odoo CMS configuration + CSS duplicate removal

---

## 1. Odoo CMS Cleanup

### Problem

Staging Odoo had **134 `website.page` records** with duplicate URLs and **4 home page records** on different websites. Without a pinned homepage ID, selection depended on heuristics (`ODOO_CMS_INCLUDE_UNPUBLISHED`, HTML length), which could change when new drafts were added.

### Audit results (`npm run cms:audit`)

| Metric | Value |
|--------|-------|
| Total pages | 134 |
| Published | 22 |
| Draft | 112 |
| Duplicate URL groups | 12 |
| Home page records | 4 |

**Home page candidates on `/`:**

| ID | Status | Website | HTML size |
|----|--------|---------|-----------|
| **226** | Draft | **7 (aptusinfotech.com)** | **85,340 chars** ← pinned |
| 4 | Draft | 1 (My Website) | 46,279 chars |
| 8 | Published | 2 (Aptusinfotech) | 30,531 chars |
| 2 | Published | (none) | 46 chars (stub) |

### Actions taken (codebase)

1. **Pinned homepage** in `.env.local`:
   ```
   ODOO_CMS_HOME_PAGE_ID=226
   ODOO_CMS_PREFER_PUBLISHED=true
   ```
   Page 226 is the aptusinfotech.com home content (website_id=7). It remains draft — `ODOO_CMS_INCLUDE_UNPUBLISHED=true` stays enabled until it is published in Odoo.

2. **Hardened CMS fetchers** (`src/lib/server/odoo/content/pages.ts`):
   - All page-by-URL queries now filter by `ODOO_CMS_WEBSITE_ID` at the Odoo domain level
   - `listOdooCmsPageUrls()` filters to target website and deduplicates URLs
   - Static path generation (`[...slug]`) no longer includes pages from other websites

3. **Added audit script** — `npm run cms:audit` runs `scripts/audit-cms-pages.mjs`

4. **Improved list script** — `npm run cms:pages` now shows record IDs and filters by website

### Manual steps remaining (Odoo admin)

These require Odoo backend access and should be done when convenient:

| Priority | Action | Reason |
|----------|--------|--------|
| High | **Publish** `website.page` id=226 on aptusinfotech.com | Makes homepage live in Odoo; then set `ODOO_CMS_INCLUDE_UNPUBLISHED=false` |
| Medium | Archive or unpublish duplicate home pages (ids 2, 4, 8) | Removes ambiguity on `/` |
| Medium | Review 12 duplicate URL groups | e.g. `/sophos`, `/kaspersky` exist on websites 1, 7, and unassigned |
| Low | Archive 112 draft pages not needed for Next.js | Reduces noise in Odoo CMS |

**Duplicate URLs to review in Odoo** (pages on wrong websites):

- `/` — 4 records across websites 1, 2, 7, and unassigned
- `/sophos`, `/kaspersky`, `/palo-alto` — 3 records each
- `/fortinet`, `/construction-cloud` — 2 records each
- `/microsoft`, `/infowater-pro`, `/infoworks-icm`, `/infoworks-ws-pro`, `/multimedia-software-solutions`, `/advanced-control-room-solutions` — 2 records each

After publishing page 226, update `.env.local`:

```env
ODOO_CMS_INCLUDE_UNPUBLISHED=false
```

---

## 2. CSS Cleanup

### Problem

`public/css/` contained duplicate copies of portal stylesheets that had **drifted** from the canonical `src/styles/` versions:

| File | `src/styles/` | `public/css/` | Match |
|------|---------------|---------------|-------|
| `aptus.css` | 1,195 lines | 1,195 lines | Identical |
| `customer-dashboard.css` | 4,033 lines | 2,608 lines | **Drifted** |

### Audit findings

- **No references** to `/css/aptus.css` or `/css/customer-dashboard.css` anywhere in the codebase
- React portal loads styles via `PortalStyles.tsx` → `@/styles/*.css` only
- Legacy `public/js/aptus_portal_auth.js` does not inject stylesheets
- Bootstrap CSS loads from `node_modules`, not `public/css/`

The `public/css/` copies were **dead code** with drift risk.

### Actions taken

1. **Deleted** `public/css/aptus.css`
2. **Deleted** `public/css/customer-dashboard.css`
3. **Canonical source** remains `src/styles/` (loaded by `PortalStyles.tsx`)

### CSS architecture after cleanup

```
Marketing site
  └── globals.css (Tailwind + tokens)
  └── site-header.css
  └── cms-content.css (Odoo HTML shim — transitional)

Portal
  └── PortalStyles.tsx
        └── bootstrap/dist/css/bootstrap.min.css
        └── src/styles/aptus.css
        └── src/styles/customer-dashboard.css
        └── src/styles/site-header.css
```

---

## 3. Verification

Run after cleanup:

```bash
npm run cms:audit    # Confirm pin recommendation matches id=226
npm run cms:pages    # List pages on website_id=7 only
npm run build        # Confirm static paths generate without cross-website duplicates
```

---

## 4. Debt items resolved

| ID | Item | Status |
|----|------|--------|
| TD-004 | CSS drift between `src/` and `public/` | ✅ Resolved — dead duplicates removed |
| TD-007 | Odoo duplicate pages / unpinned home | ✅ Mitigated — pinned id=226 + website filter |
| TD-007 | Odoo admin cleanup | ⏳ Manual — publish page 226, archive duplicates |

---

## 5. Updated env reference

```env
# CMS — aptusinfotech.com (website_id=7)
ODOO_CMS_WEBSITE_ID=7
ODOO_CMS_HOME_PAGE_ID=226
ODOO_CMS_INCLUDE_UNPUBLISHED=true   # until page 226 is published
ODOO_CMS_PREFER_PUBLISHED=true
```

See `.env.example` for full CMS variable documentation.
