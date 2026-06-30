# Aptus Frontend

Production-grade Next.js frontend scaffold for a headless Odoo CMS architecture.

## Architecture

```
Odoo (Content Management)
        ↓
       API
        ↓
Next.js Frontend
        ↓
GSAP Animations
        ↓
Website Visitors
```

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- GSAP
- ESLint

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
/app                  # App Router pages and layouts
/components
  /layout             # Header, Footer
  /sections           # CMS section components + renderer
  /ui                 # Reusable UI primitives
  /providers          # Client-side providers (GSAP)
/data                 # Mock CMS data layer
/hooks                # React hooks (GSAP)
/lib
  /odoo               # Odoo API client (stub)
  /gsap               # GSAP configuration helpers
/types                # TypeScript interfaces
/styles               # Global styles and design tokens
/public               # Static assets
```

## Phase 1 Status

This scaffold provides the foundation only:

- Global layout with Header and Footer
- Section renderer system (hero, features, cta, testimonials)
- Odoo client layer (stub — integration pending)
- GSAP helper layer (no animations yet)
- Mock CMS data layer
- SaaS-style Tailwind design system

## Environment Variables

See `.env.example` for required configuration.

## Scripts

| Command       | Description              |
|---------------|--------------------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build       |
| `npm run start` | Start production server |
| `npm run lint`  | Run ESLint             |
