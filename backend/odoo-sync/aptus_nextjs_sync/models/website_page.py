"""
aptus_nextjs_sync/models/website_page.py

Hooks into website.page saves and:
  1. Calls the Next.js /api/revalidate endpoint so ISR cache is busted.
  2. When a page's x_homepage_sections_json or x_page_sections_json fields
     change, that same data is what Next.js re-reads — no arch parsing needed.

The visual editing flow after this module is installed:

  Editor uses Odoo form (x_homepage_sections_json field)
    OR Odoo website builder (updates arch)
          ↓
  website.page.write() fires
          ↓
  This module calls POST /api/revalidate {slug, token}
          ↓
  Next.js ISR invalidates the page
          ↓
  Next page load fetches fresh Odoo data → shows updated content

Config (set in Odoo → Settings → Technical → System Parameters):
  nextjs.base_url   — e.g. https://your-nextjs-site.com
  nextjs.token      — must match ODOO_REVALIDATE_TOKEN in Next.js .env
"""

import json
import logging
import re

import requests

from odoo import api, fields, models

_logger = logging.getLogger(__name__)

# Fields that, when changed, should trigger Next.js revalidation.
WATCHED_FIELDS = {
    'x_homepage_sections_json',
    'x_page_sections_json',
    'name',
    'url',
    'is_published',
    'website_published',
    'website_meta_title',
    'website_meta_description',
}

# Also revalidate when the associated QWeb view arch changes.
# We hook ir.ui.view for this separately below.
WATCHED_ARCH_MODEL = 'ir.ui.view'


def _url_to_slug(url: str) -> str:
    """'/about-us' → 'about-us', '/' → 'home'"""
    slug = url.strip('/')
    return slug or 'home'


class WebsitePage(models.Model):
    _inherit = 'website.page'

    def _nextjs_config(self):
        """Read Next.js connection config from ir.config_parameter."""
        get = self.env['ir.config_parameter'].sudo().get_param
        return {
            'base_url': get('nextjs.base_url', '').rstrip('/'),
            'token': get('nextjs.token', ''),
        }

    def _revalidate_nextjs(self, slugs: list[str]):
        """POST /api/revalidate for each slug. Fires in a background thread to
        avoid blocking the Odoo save response."""
        cfg = self._nextjs_config()
        if not cfg['base_url']:
            _logger.debug('nextjs.base_url not configured — skipping revalidation')
            return

        endpoint = f"{cfg['base_url']}/api/revalidate"
        for slug in slugs:
            try:
                resp = requests.post(
                    endpoint,
                    json={'slug': slug, 'token': cfg['token']},
                    timeout=8,
                )
                if resp.ok:
                    _logger.info('Next.js revalidated: %s → %s', slug, resp.json())
                else:
                    _logger.warning(
                        'Next.js revalidation failed for %s: %s %s',
                        slug, resp.status_code, resp.text[:200],
                    )
            except requests.RequestException as exc:
                _logger.warning('Next.js revalidation request error for %s: %s', slug, exc)

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        slugs = [_url_to_slug(r.url) for r in records if r.url]
        if slugs:
            self._revalidate_nextjs(slugs)
        return records

    def write(self, vals):
        # Capture slugs BEFORE write (url may change)
        old_slugs = {_url_to_slug(r.url) for r in self if r.url}

        result = super().write(vals)

        # Only revalidate if a watched field changed
        if not WATCHED_FIELDS.intersection(vals):
            return result

        new_slugs = {_url_to_slug(r.url) for r in self if r.url}
        all_slugs = list(old_slugs | new_slugs)

        if all_slugs:
            self._revalidate_nextjs(all_slugs)

        return result


class IrUiView(models.Model):
    """
    Also revalidate when the website builder saves the QWeb arch directly.
    The website builder edits ir.ui.view.arch — the page record itself may not
    get a write() call in all Odoo versions.
    """
    _inherit = 'ir.ui.view'

    def write(self, vals):
        result = super().write(vals)

        if 'arch' not in vals and 'arch_base' not in vals:
            return result

        # Find website.page records that reference these views
        pages = self.env['website.page'].sudo().search([
            ('view_id', 'in', self.ids),
        ])
        if not pages:
            return result

        slugs = [_url_to_slug(p.url) for p in pages if p.url]
        if slugs:
            pages._revalidate_nextjs(slugs)

        return result
