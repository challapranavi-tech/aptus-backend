# How to Edit Aptus Content (Cheatsheet)

This guide is for quickly finding where content, styles, navigation, and assets are controlled.

## 1) Change Homepage Content

Primary source:

- Odoo homepage content fields (via backend CMS mapping)

Code flow:

- `frontend/app/page.tsx`
- `frontend/data/cms.ts` (`getHomePage`)
- `backend/app/api/cms/home/route.ts`
- `backend/data/cms.ts`
- `backend/lib/odoo/json-mapper.ts`

Local fallback JSON path:

- `backend/content/odoo-json/*.json` (used by fallback strategy in dev)

## 2) Edit About Pages

About routes are dynamic in frontend:

- `frontend/app/[slug]/page.tsx`

Common about slugs:

- `/our-story`
- `/our-team`
- `/aptus-policy`
- `/why-aptus-infotech`
- `/winning-together`
- `/aptus-infotech-iso-certifications`
- `/career`
- `/contact-us`

Content source:

- Odoo page JSON fields
- fallback file per slug in `backend/content/odoo-json/<slug>.json`

Mapper used:

- `backend/lib/odoo/page-json-mapper.ts`

## 3) Change Services Content

Where services are rendered:

- Home services: section components through `frontend/components/sections/Services.tsx`
- Inner page feature/service cards: `frontend/components/sections/Features.tsx`

Where data comes from:

- Odoo JSON mapped by `backend/lib/odoo/json-mapper.ts` (home)
- Odoo JSON mapped by `backend/lib/odoo/page-json-mapper.ts` (inner pages)

Fallback content files:

- `backend/content/odoo-json/**.json`

## 4) Modify Navigation

Edit source of truth:

- `frontend/data/site-nav.ts`

Keep backend mirror aligned:

- `backend/data/site-nav.ts`

Rendered by:

- `frontend/components/layout/NavMenu.tsx`
- included in `frontend/components/layout/Header.tsx`

## 5) Edit Footer

Footer component:

- `frontend/components/layout/Footer.tsx`

Footer data entry point:

- `frontend/data/cms.ts` (`getSiteConfig`)
- backend response from `backend/app/api/cms/site-config/route.ts`

Fallback/default text object:

- `backend/data/mock-cms.ts` (`mockSiteConfig.footer`)

## 6) Replace Images

Static/local runtime images:

- `frontend/public/images/**`

CMS image URLs:

- Odoo content JSON fields (mapped into section media)
- local fallback JSON files in `backend/content/odoo-json/**`

If external host is new, update image allow-list:

- `frontend/next.config.ts` (`images.remotePatterns`)

## 7) Update Styles

Global style entry:

- `frontend/styles/globals.css`

Design tokens/theme:

- `frontend/styles/tokens.css`
- `frontend/styles/theme.css`

Component-level CSS:

- `frontend/styles/components/*.css`

Section-level CSS:

- `frontend/styles/sections/*.css`

Page/family CSS:

- `frontend/styles/pages/*.css`
- `frontend/styles/about-pages.css`
- `frontend/styles/software-pages.css`
- `frontend/styles/software-product-pages.css`
- `frontend/styles/elv-pages.css`
- `frontend/styles/elv-product-pages.css`
- `frontend/styles/case-studies-pages.css`

## 8) Add a New Page

Typical path (CMS-driven):

1. Create/publish page in Odoo with slug
2. Ensure backend can fetch slug (`/api/cms/slugs`)
3. Ensure section JSON shape maps in `backend/lib/odoo/page-json-mapper.ts`
4. Verify route is rendered through `frontend/app/[slug]/page.tsx`

If special layout is needed:

- add conditional render branch in `frontend/app/[slug]/page.tsx`
- create or reuse dedicated page view component in `frontend/components/pages/*`

## 9) Modify Animations

Global GSAP setup:

- `frontend/lib/gsap/config.ts`
- `frontend/components/providers/GSAPProvider.tsx`

Scoped animation hook:

- `frontend/hooks/useGSAPContext.ts`

Per-section animation logic:

- `frontend/components/sections/Hero.tsx`
- `frontend/components/sections/FeatureRow.tsx`
- `frontend/components/sections/Banner.tsx`
- `frontend/components/sections/Features.tsx`
- `frontend/components/sections/Services.tsx`
- `frontend/components/sections/KeyEnablers.tsx`
- `frontend/components/sections/Testimonials.tsx`
- `frontend/components/sections/CTA.tsx`

## 10) Deploy Changes

Frontend deployment configs:

- root `vercel.json`
- `frontend/vercel.json`
- `frontend/netlify.toml`

Backend deployment:

- deploy `backend` app separately with Odoo env vars

Critical env/token setup:

- `backend/.env.example`
- `frontend/.env.example`
- `docs/odoo-environments.md`

Revalidation endpoints:

- `backend/app/api/revalidate/route.ts`
- `frontend/app/api/revalidate/route.ts`

## Quick Troubleshooting

- Page shows 404 in frontend:
  - confirm slug exists in backend `/api/cms/slugs`
  - check hidden slug rules in frontend data helpers
- Content missing:
  - check Odoo page JSON fields
  - check fallback file in `backend/content/odoo-json`
  - inspect mapper logic in `backend/lib/odoo/page-json-mapper.ts`
- New image not rendering:
  - ensure image URL is valid
  - ensure host is allowed in `frontend/next.config.ts`
- Revalidation not working:
  - verify `ODOO_REVALIDATE_TOKEN` matches across Odoo/backend/frontend
  - verify backend can reach frontend revalidate URL

