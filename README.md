# Aptus — monorepo

Marketing site split for independent hosting:

| Package | Folder | Deploy to | Role |
|---------|--------|-----------|------|
| **Frontend** | `frontend/` | Vercel, Netlify | Next.js UI — pages, components, styles |
| **Backend** | `backend/` | Vercel, Railway, Render | Odoo CMS API, cache webhooks, content JSON |

Shared TypeScript types live in `shared/types/`.

## Quick start

```bash
npm install
cp backend/.env.example backend/.env.local    # Odoo credentials
cp frontend/.env.example frontend/.env.local  # APTUS_API_URL=http://localhost:3001
npm run dev                                   # backend :3001 + frontend :3000
```

**Open http://localhost:3000** for the website. Port 3001 is the API only (not the marketing site).

## Deploy

### Frontend (Vercel / Netlify)

- **Root directory:** `frontend`
- **Env:** `APTUS_API_URL` → your deployed backend URL
- **Env:** `NEXT_PUBLIC_SITE_URL`, `ODOO_IMAGE_HOST` (optional)

Vercel: import repo, set Root Directory to `frontend`.

Netlify: `netlify.toml` is in `frontend/` — set base directory to `frontend` in site settings.

### Backend (Vercel / Railway / Render)

- **Root directory:** `backend`
- **Env:** all `ODOO_*` vars from `backend/.env.example`
- **Required:** `ODOO_REVALIDATE_TOKEN` (see `docs/odoo-environments.md`)

Point Odoo `nextjs.base_url` at this backend URL (not the frontend).

## API endpoints (backend)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/cms/site-config` | Site chrome (nav, footer) |
| GET | `/api/cms/home` | Homepage |
| GET | `/api/cms/pages/{slug}` | Page by slug |
| GET | `/api/cms/slugs` | All page slugs |
| GET | `/api/cms/case-studies` | Case studies JSON |
| POST | `/api/revalidate` | Odoo cache bust webhook |

## Content vs navigation

| Concern | Source |
|---------|--------|
| Page body | Odoo via backend API |
| Navigation | `backend/data/site-nav.ts` (code-owned) |
| Layout chrome | `backend/data/mock-cms.ts` |

See [docs/odoo-environments.md](docs/odoo-environments.md) for staging/prod env matrix.

## Legacy

`aptus-web/aptus-web/` — separate portal app (auth, orders). Not part of this split.
