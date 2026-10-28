# Aptus Project Architecture

This document explains how the Aptus monorepo is organized, how data moves across apps, and where to make common technical changes.

## 1) Monorepo Overview

Repository root contains three apps:

- `frontend`: current public marketing site
- `backend`: Odoo CMS API bridge for the frontend
- `aptus-web/aptus-web`: legacy/parallel site and customer portal

Additional shared/reference areas:

- `shared/types`: shared TypeScript types
- `docs`: project/deployment documentation
- `assets`, `categorized_assets`, `LIVE WEBSITE`: extracted media and archived website sources

## 2) Architecture Pattern

Primary production flow follows a decoupled CMS architecture:

1. User requests a page in `frontend`
2. `frontend` fetches content from `backend` API (`APTUS_API_URL`)
3. `backend` fetches and maps Odoo content
4. `frontend` renders mapped sections through `SectionRenderer`

Content ownership model:

- Odoo owns page body content
- Code owns global nav structure (`site-nav.ts`)
- ISR revalidation is triggered by Odoo and propagated backend -> frontend

## 3) Top-Level Structure

```text
Aptus/
├── frontend/
├── backend/
├── aptus-web/
├── shared/
├── docs/
├── assets/
├── categorized_assets/
├── LIVE WEBSITE/
├── scripts/
└── package.json
```

## 4) Frontend (`frontend`) Details

### Purpose

Public website rendering layer for all marketing pages.

### Key folders

- `frontend/app`: Next.js App Router pages and API route
- `frontend/components`: UI building blocks and page/section components
- `frontend/data`: CMS client, nav, slug/media maps
- `frontend/hooks`: reusable hooks (GSAP context)
- `frontend/lib`: utilities, GSAP config, design-system helpers
- `frontend/public/images`: static image assets
- `frontend/styles`: layered global/component/page CSS

### Important files

- `frontend/app/layout.tsx`: app shell (header/footer/providers)
- `frontend/app/page.tsx`: home route
- `frontend/app/[slug]/page.tsx`: dynamic route handler
- `frontend/data/cms.ts`: frontend CMS HTTP client
- `frontend/components/sections/SectionRenderer.tsx`: section dispatcher
- `frontend/components/layout/Header.tsx`, `frontend/components/layout/Footer.tsx`
- `frontend/data/site-nav.ts`: code-owned nav menu
- `frontend/styles/globals.css`: style import entrypoint
- `frontend/next.config.ts`: redirects + image host rules

### Runtime route surface

- `/` (home)
- `/:slug` (dynamic marketing pages)
- `/api/revalidate` (frontend ISR invalidation endpoint)

## 5) Backend (`backend`) Details

### Purpose

API-only Next.js app that reads Odoo CMS data, maps it into app types, and serves it to `frontend`.

### Key folders

- `backend/app/api`: CMS, health, Odoo debug, revalidation routes
- `backend/data`: CMS data layer and mock fallback
- `backend/lib/odoo`: Odoo client, RPC, mappers, parsers
- `backend/content/odoo-json`: local JSON fallback/override by slug
- `backend/content/odoo-xml`: extracted XML artifacts
- `backend/odoo-sync`: Odoo-side integration module assets
- `backend/scripts`: export/seed/explore scripts

### Important files

- `backend/app/api/cms/home/route.ts`
- `backend/app/api/cms/pages/[slug]/route.ts`
- `backend/app/api/cms/site-config/route.ts`
- `backend/app/api/cms/slugs/route.ts`
- `backend/app/api/cms/case-studies/route.ts`
- `backend/app/api/revalidate/route.ts`
- `backend/data/cms.ts`: Odoo-first data strategy + fallbacks
- `backend/lib/odoo/client.ts`, `backend/lib/odoo/rpc.ts`
- `backend/lib/odoo/page-json-mapper.ts`, `backend/lib/odoo/json-mapper.ts`

### CMS fallback ladder

Order used in `backend/data/cms.ts`:

1. Odoo content (if configured and available)
2. Local disk JSON (`backend/content/odoo-json/**`)
3. Mock content (`backend/data/mock-cms.ts`)

## 6) Legacy App (`aptus-web/aptus-web`) Details

### Purpose

Contains legacy/parallel implementation for marketing pages and customer portal features (auth, renewals, purchases, subscriptions, payments).

### Key folders

- `aptus-web/aptus-web/src/app`: routes (site, auth, portal, API)
- `aptus-web/aptus-web/src/components`: page/layout/portal components
- `aptus-web/aptus-web/src/lib`: CMS helpers, auth, Odoo and payment server logic
- `aptus-web/aptus-web/src/styles`: legacy style layers

### Notable integrations

- Stripe API integration
- Upstash Redis for OTP/rate-limits in production
- Portal route guard middleware
- Odoo connection for account/contact/order flows

## 7) Data Flow

### Frontend + backend path

```text
Browser -> frontend route -> frontend/data/cms.ts
-> backend /api/cms/* -> backend/data/cms.ts
-> backend/lib/odoo/* -> Odoo
-> mapped Section[] / Page -> frontend SectionRenderer
```

### Revalidation path

```text
Odoo save event
-> backend /api/revalidate (token check)
-> backend revalidatePath cache purge
-> backend fan-out call to frontend /api/revalidate
-> frontend revalidatePath purge
```

## 8) Styling System

Main app styling in `frontend` combines Tailwind + custom CSS layers.

- Entry: `frontend/styles/globals.css`
- Design tokens: `frontend/styles/tokens.css`, `frontend/styles/theme.css`
- Base/utilities/animations: `base.css`, `utilities.css`, `animations.css`
- Component styles: `frontend/styles/components/*.css`
- Section styles: `frontend/styles/sections/*.css`
- Page/family styles: `frontend/styles/pages/*.css`, `*-pages.css`

## 9) Animation System

Primary animation stack:

- GSAP + ScrollTrigger

Key files:

- `frontend/lib/gsap/config.ts`
- `frontend/components/providers/GSAPProvider.tsx`
- `frontend/hooks/useGSAPContext.ts`
- section components in `frontend/components/sections/*`

## 10) Key Configuration Files

Root:

- `package.json`: workspace scripts (`frontend`, `backend`)
- `vercel.json`: root deploy behavior

Frontend:

- `frontend/package.json`
- `frontend/next.config.ts`
- `frontend/tsconfig.json`
- `frontend/postcss.config.mjs`
- `frontend/eslint.config.mjs`
- `frontend/.env.example`

Backend:

- `backend/package.json`
- `backend/next.config.ts`
- `backend/tsconfig.json`
- `backend/eslint.config.mjs`
- `backend/.env.example`
- `backend/.env.production.example`

Legacy:

- `aptus-web/aptus-web/package.json`
- `aptus-web/aptus-web/next.config.ts`
- `aptus-web/aptus-web/tailwind.config.ts`
- `aptus-web/aptus-web/tsconfig.json`
- `aptus-web/aptus-web/.env.example`

Environment matrix and token practices:

- `docs/odoo-environments.md`

## 11) Assets and Content Sources

Runtime assets:

- `frontend/public/images/**`

Local content fallback:

- `backend/content/odoo-json/**`

Reference archives:

- `assets/**`
- `categorized_assets/**`
- `LIVE WEBSITE/**`

## 12) Where to Change What (Technical Map)

- App shell/header/footer: `frontend/app/layout.tsx`, `frontend/components/layout/*`
- Navigation tree: `frontend/data/site-nav.ts` (and backend mirror)
- Route behavior: `frontend/app/page.tsx`, `frontend/app/[slug]/page.tsx`
- CMS fetch logic: `frontend/data/cms.ts`, `backend/data/cms.ts`
- Odoo mapping: `backend/lib/odoo/*mapper*.ts`
- Page section UI: `frontend/components/sections/*`
- Quote modal behavior: `frontend/components/quote/*`
- Revalidation behavior: `backend/app/api/revalidate/route.ts`, `frontend/app/api/revalidate/route.ts`

