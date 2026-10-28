# Aptus Next.js Sync — Odoo Module

Connects Odoo's website builder to the Next.js frontend.
Every time a website page is saved (arch or custom JSON fields),
the module calls `POST /api/revalidate` on the Next.js server,
which busts the ISR cache so the next visitor gets fresh content.

---

## How the edit flow works after installation

```
Non-technical editor opens Odoo website builder
        ↓
Edits text / image on the visual page
        ↓
Clicks Save / Publish in Odoo
        ↓
aptus_nextjs_sync.write() fires (hooks website.page + ir.ui.view)
        ↓
POST https://your-site.com/api/revalidate  {slug, token}
        ↓
Next.js drops its cached page
        ↓
Next visitor: Next.js fetches fresh data from Odoo → re-renders → serves
```

---

## Option A — Install the full module (recommended for production)

### 1. Copy the module to Odoo addons path

```bash
# On your Odoo server
cp -r aptus_nextjs_sync /path/to/odoo/addons/
# OR if using a custom addons path:
cp -r aptus_nextjs_sync /opt/odoo/custom-addons/
```

### 2. Restart Odoo

```bash
sudo systemctl restart odoo
# or
sudo service odoo restart
```

### 3. Enable developer mode in Odoo

`Settings → General Settings → Developer Tools → Activate developer mode`

### 4. Update module list & install

```
Apps → Update Apps List → search "Aptus Next.js Sync" → Install
```

### 5. Set the system parameters

`Settings → Technical → Parameters → System Parameters`

| Key | Example value |
|-----|--------------|
| `nextjs.base_url` | `https://your-production-site.com` (or `http://localhost:3000` for local dev) |
| `nextjs.token` | Same value as `ODOO_REVALIDATE_TOKEN` in Next.js (generate with `openssl rand -hex 32`) |

**Security:** treat `nextjs.token` / `ODOO_REVALIDATE_TOKEN` as a long-lived shared secret. Store it only in Odoo system parameters and server env vars (never in client JS, git, or query strings in production). Rotate with `openssl rand -hex 32` and update backend, frontend, and Odoo together.

---

## Option B — Server Action (zero-install, for staging/testing)

No server access needed.  Works in any Odoo instance.

### 1. Go to Settings → Technical → Server Actions → New

Fill in:
- **Name**: `Next.js Revalidate on Page Save`
- **Model**: `Website Page` (`website.page`)
- **Action To Do**: `Execute Python Code`
- **Python Code**: paste contents of `SERVER_ACTION.py` (edit the two constants at the top)
- **When to run**: check **On save** (triggers on create + write)

### 2. Save & test

Open any website page in Odoo, make a small change, hit Save.
Check Odoo logs (`Settings → Technical → Logging`) for lines starting with
`Next.js revalidate`.

---

## Verifying the Next.js endpoint manually

Use POST in production (GET is disabled there). Local dev may use GET for convenience.

```bash
curl -X POST https://your-site.com/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"slug":"home","token":"YOUR_ODOO_REVALIDATE_TOKEN"}'
```

Expected response:
```json
{ "revalidated": true, "slugs": ["home"] }
```

To revalidate the whole site cache (use sparingly):

```bash
curl -X POST https://your-site.com/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"all":true,"token":"YOUR_ODOO_REVALIDATE_TOKEN"}'
```

Local dev only (query string — do not use in production):

```
http://localhost:3000/api/revalidate?slug=home&token=YOUR_ODOO_REVALIDATE_TOKEN
```

---

## What about the visual editor ↔ x_homepage_sections_json gap?

The Odoo website builder writes changes to the QWeb **arch** field.
The Next.js frontend reads `x_homepage_sections_json` (richer, structured).

These are two separate fields.  After this module fires revalidation,
Next.js re-fetches — but it still reads `x_homepage_sections_json` first.

**Two ways to keep them in sync:**

### Path 1 — Edit x_homepage_sections_json directly (simplest)
Create an Odoo form view on `website.page` with individual fields for each
content piece (heading, description, button label, …).  Editors fill in the
form → click Save → revalidation fires → Next.js shows the change.
This is structured, predictable, and non-technical editors can use it.

### Path 2 — Full visual editing (advanced, requires Odoo dev)
Extend this module with a `_sync_arch_to_json()` method that:
1. Reads `view_id.arch` via lxml
2. Extracts text nodes at known XPath positions
3. Updates `x_homepage_sections_json` on the same record

This turns the visual builder into the source of truth but requires
mapping Odoo's QWeb XPaths to the JSON schema keys.

---

## Files

```
odoo-sync/
├── aptus_nextjs_sync/
│   ├── __manifest__.py
│   ├── __init__.py
│   └── models/
│       ├── __init__.py
│       └── website_page.py   ← core logic
├── SERVER_ACTION.py           ← zero-install copy-paste version
└── README.md                  ← this file
```
