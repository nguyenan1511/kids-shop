# Thanh Chi Đồ Chơi

Online toy shop + admin. Next.js 15 (App Router) · Tailwind 4 · Supabase (Postgres, Auth, Storage).
Design and decisions: [`docs/DESIGN.md`](docs/DESIGN.md) · Deploy: [`docs/DEPLOY.md`](docs/DEPLOY.md)

- **Shop** `/` — browse, cart, checkout with phone + address (COD, no account).
- **Admin** `/admin` — orders (status flow, Zalo buttons, shipping fee, confirmation message), products, categories, videos, settings.

## Run locally

Needs Node 20+, Docker Desktop (for local Supabase) and ffmpeg (for seeding videos).

```bash
npm install
npm run db:start                 # local Supabase in Docker (applies supabase/migrations)
# copy the API URL + keys printed by `npx supabase status -o env` into .env.local (see .env.example)
npm run seed                     # 26 products / 6 categories / 8 videos from ./products
npm run create-admin -- you@example.com 'a-strong-password'
npm run dev                      # http://localhost:3000  ·  admin: /admin
```

Local tools: Supabase Studio http://127.0.0.1:54323 · test mailbox http://127.0.0.1:54324

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests (Vitest) — status rules, totals, phone validation, Zalo message |
| `npm run test:e2e` | End-to-end (Playwright): security checks + order → admin → Hoàn thành |
| `npm run seed` | Seed catalog from `./products` (refuses if products exist; `-- --force` wipes catalog first) |
| `npm run create-admin -- <email> <password>` | Create or promote an admin |
| `npm run db:reset` | Wipe local DB and re-apply migrations (then `npm run seed`) |

## Project map

```
app/(shop)/          shop pages + server actions (refreshCart, placeOrder)
app/admin/           login, panel pages, admin server actions
components/icons/    hand-drawn SVG icon set (no emoji in UI)
components/shop/     header, cart drawer, product card, gallery, checkout…
components/admin/    order detail, product form, image/video uploaders…
lib/                 supabase clients, catalog queries, order rules, validation, formatting
supabase/migrations  schema, RLS, place_order / change_order_status functions, storage bucket
supabase/seed/       catalog data (draft names/prices from the owner's photos)
scripts/             seed, create-admin, screenshot helper
tests/               unit + e2e
products/            original photos/videos from the owner (source for seeding)
```

## How orders are protected

- Customers never talk to the database directly for orders. `placeOrder` (server action) validates input and calls
  `place_order()` with the service-role key; the function **re-reads prices from the database**, checks stock/options,
  rate-limits 3 orders/phone/hour and writes order + items + history in one transaction.
- Orders are readable only by users listed in `admins` (RLS). Status changes go through `change_order_status()`, which
  enforces the allowed flow and records who changed what.
- Public sign-up is disabled; admins are created with `scripts/create-admin.mjs`.
