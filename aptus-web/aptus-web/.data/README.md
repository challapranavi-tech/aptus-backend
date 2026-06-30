# Local data store (not committed to Git)

This folder is created at runtime. **Do not commit** — it may contain password hashes, refresh tokens, and audit logs.

After `npm run dev` or first login, files appear here:

| File | Purpose |
|------|---------|
| `portal-accounts.json` | Portal user accounts (scrypt password hashes) |
| `refresh-tokens.json` | Active refresh token sessions |
| `portal-orders.json` | Order status overlay for dashboard |
| `payments.json` | Stripe payment intent audit |
| `audit-log.jsonl` | Security and order audit trail |
| `jwt-dev-keys.json` | Dev-only RS256 keys (auto-generated) |

**Setup on a new machine:**

1. Copy `.env.example` → `.env.local` and fill in secrets.
2. Run `npm install` then `npm run dev`.
3. Register or run `npm run migrate:auth` / `npm run sync:odoo` as needed.

See `portal-accounts.example.json` for the empty account file shape.
