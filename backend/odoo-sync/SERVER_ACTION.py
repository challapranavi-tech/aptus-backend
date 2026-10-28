"""
ODOO SERVER ACTION — paste this into:
  Settings → Technical → Server Actions → New

  Model: website.page
  Action Type: Execute Python Code
  Trigger: On Save (on_write + on_create)

This is the zero-install version. It does the same job as the full module.
"""

import requests

# ── Config ──────────────────────────────────────────────────────────────────
NEXTJS_BASE_URL = "https://your-nextjs-site.com"   # ← change this
NEXTJS_TOKEN    = "YOUR_ODOO_REVALIDATE_TOKEN"    # ← must match Next.js env

# ── Helper ──────────────────────────────────────────────────────────────────
def url_to_slug(url):
    slug = (url or "").strip("/")
    return slug or "home"

# ── Main ────────────────────────────────────────────────────────────────────
watched = {
    'x_homepage_sections_json', 'x_page_sections_json',
    'name', 'url', 'is_published', 'website_published',
}

# `vals` is injected by Odoo — the dict of fields being written
changed = set(vals.keys()) & watched if 'vals' in dir() else watched

if not changed:
    pass  # nothing relevant changed, skip
else:
    slugs = list({url_to_slug(record.url) for record in records})
    endpoint = f"{NEXTJS_BASE_URL}/api/revalidate"

    for slug in slugs:
        try:
            r = requests.post(
                endpoint,
                json={"slug": slug, "token": NEXTJS_TOKEN},
                timeout=8,
            )
            log(f"Next.js revalidate '{slug}': {r.status_code} {r.text[:120]}")
        except Exception as e:
            log(f"Next.js revalidate error for '{slug}': {e}", level='warning')
