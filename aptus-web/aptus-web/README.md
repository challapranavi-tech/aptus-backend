# Aptus Infotech — Next.js Home Page

React + Next.js replica of the [Aptus Infotech](https://aptusinfotech.com/) home page, built from the saved HTML reference in the parent folder.

## Stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**

## Getting started

1. Install [Node.js](https://nodejs.org/) (LTS, includes npm).
2. Open a terminal in this folder (`aptus-web`).
3. Run:

```bash
npm install
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  app/              # Layout, home page, global styles
  components/
    home/           # Hero, ELV, Software, Services, Key Enablers, Testimonial
    layout/         # Header & Footer
    ui/             # Shared UI (headings, buttons)
  lib/constants.ts  # Copy, nav links, site metadata
public/images/      # Assets copied from the downloaded site
```

## Sections replicated

- Top contact bar + social links
- Logo and navigation (desktop dropdown + mobile menu)
- 25 Years banner
- ELV & Security feature block
- Software Services feature block
- Services flip-style cards (ELV, Training, BIM)
- Key Enablers numbered list
- Client testimonial
- Footer with map, company links, and contact info

## Images

Images were copied from `Aptus Infotech _ Trusted IT & Engineering Software Partner_files/` into `public/images/`. Some backgrounds still load from `aptusinfotech.com` (configured in `next.config.ts`).

## Build for production

```bash
npm run build
npm start
```

## GitHub / deployment — what is and is not in the repo

| Path | In Git? | Notes |
|------|---------|--------|
| `.env.example` | Yes | Template — copy to `.env.local` and add secrets |
| `.env`, `.env.local` | **No** | Contains API keys — never push |
| `.data/` (live files) | **No** | Passwords, tokens, audit logs |
| `.data/README.md`, `portal-accounts.example.json` | Yes | Empty structure / docs only |
| `node_modules/` | **No** | Run `npm install` after clone |
| `.next/` | **No** | Run `npm run build` or `npm run dev` |

### First-time setup after clone

```bash
git clone https://github.com/AnaghaRS/aptus-react.git
cd aptus-react
cp .env.example .env.local   # Windows: copy .env.example .env.local
# Edit .env.local — set ODOO_API_KEY, JWT keys, PII_ENCRYPTION_KEY
npm install
npm run dev
```

Optional Odoo sync (live mode):

```bash
npm run migrate:auth
npm run sync:odoo
```
