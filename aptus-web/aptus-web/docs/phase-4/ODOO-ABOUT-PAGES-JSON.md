# About Us Pages — Odoo JSON Guide

All About Us pages use the shared **marketing page** pattern with field `x_page_sections_json`.

## Pages

| Route | Odoo URL | Page ID |
|-------|----------|---------|
| `/about-us` | `/our-story` (shared content) | 249 |
| `/our-story` | `/our-story` | 249 |
| `/our-team` | `/our-team` | 227 |
| `/aptus-policy` | `/aptus-policy` | 165 |
| `/why-aptus-infotech` | `/why-aptus-infotech` | 250 |
| `/winning-together` | `/winning-together` | 251 |
| `/aptus-infotech-iso-certifications` | `/aptus-infotech-iso-certifications` | 253 |
| `/career` | `/career` | 209 |
| `/contact-us` | `/contact-us` | 211 |

## Setup

```bash
npm run cms:setup-page-field
npm run cms:seed-about-pages
```

## JSON sections (optional keys)

`hero`, `intro`, `cards`, `lists`, `team`, `certifications`, `contactInfo`, `text`, `showKeyEnablers`, `showPartnerships`, `showContactCta`

Omitted keys use code defaults from `src/lib/cms/about-pages-content.ts`.

## Files

- `src/components/pages/shared/MarketingPageView.tsx` — shared renderer
- `src/lib/cms/about-pages-content.ts` — defaults + config
- `src/lib/cms/fetch-about-page.ts` — Odoo fetch
