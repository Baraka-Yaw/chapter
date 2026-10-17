# Chapter O Wear

Online shop for Chapter O Wear. Customers browse, add to a bag, and checkout saves the order and sends it, ready-written, to the shop's WhatsApp — no payment gateway; payment (MoMo, cash, bank) is agreed in the chat. Eddy runs the shop from the admin portal at `/admin`.

Layout follows wearghana.com (hero, collection tiles, shop grid with sorting, colour/size product page, side bag, size guide), with Chapter O's poster look: cream, soft gold, black, Cinzel + Jost.

## Screenshots

| Light | Dark |
|---|---|
| ![Home page, light theme](docs/screenshots/home-light.jpg) | ![Home page, dark theme](docs/screenshots/home-dark.jpg) |

| Product page | Bag | Phone |
|---|---|---|
| ![Product page with colour and size options](docs/screenshots/product.jpg) | ![Glass bag drawer](docs/screenshots/bag.jpg) | ![Home page on a phone](docs/screenshots/mobile.jpg) |

## Features

- Wear Ghana–style layout: hero banner, category tiles, shop grid with sorting, product page with colour and size options, side bag
- WhatsApp checkout: the order, delivery fee and customer details open in WhatsApp, ready to send — no payment gateway
- Product status: in stock, pre-order or coming soon (with a "Notify me on WhatsApp" button)
- Liquid glass UI: floating frosted header, glass bag, menus, buttons and badges, with a pointer highlight
- Light, dark and system themes from one header icon, remembered per visitor, no flash on load
- **Admin portal** (`/admin`, password sign-in):
  - Dashboard: orders this week, money awaiting payment, paid this month, best sellers, "Notify me" taps
  - Orders: every checkout is saved before WhatsApp opens; filter by status and move orders through New → Confirmed → Paid → Made → Delivered (or Cancelled); one tap to chat with the customer
  - Products: add, edit, hide and delete; colours with their own price, sale price, sold-out switch and photo; status (in stock / pre-order / coming soon); featured on the home page
  - Settings: WhatsApp number, notice bar, Instagram/TikTok, delivery areas and fees, payment options

## Stack

Next.js 16 (App Router, Cache Components), Tailwind 4, Postgres via Drizzle (`lib/db/`), product photos in Vercel Blob. The shop reads products and settings through cached functions (`lib/catalog.ts`, `lib/settings.ts`) that the admin refreshes on every save. Checkout re-prices the bag on the server (`lib/order-actions.ts`), so totals can't be tampered with. Prices are stored in pesewas.

## Running it locally

```bash
pnpm install
cp .env.example .env.local      # then fill in ADMIN_PASSWORD and ADMIN_SESSION_SECRET
createdb chapter_o
pnpm db:migrate
pnpm db:seed                    # placeholder products and default settings
pnpm dev --port 3100
```

Admin: http://localhost:3100/admin. Photo uploads need `BLOB_READ_WRITE_TOKEN` (copy it from the Vercel Blob store); everything else works without it.

Schema changes: edit `lib/db/schema.ts`, run `pnpm db:generate`, commit the new file in `drizzle/`.

## Deploying on Vercel

1. **Storage → Create → Neon (Postgres)** and connect it to the project. This sets `DATABASE_URL`.
2. **Storage → Create → Blob** and connect it. This sets `BLOB_READ_WRITE_TOKEN`.
3. **Settings → Environment Variables**: add `ADMIN_PASSWORD` (long, give it to Eddy privately) and `ADMIN_SESSION_SECRET` (`openssl rand -base64 32`).
4. Redeploy. The `vercel-build` script runs `pnpm db:migrate` before `next build`, so tables are created automatically.
5. Once, load the placeholder catalogue into the new database: `vercel env pull .env.production.local`, then `DATABASE_URL=… pnpm db:seed` (or add products by hand in `/admin`).

## Swapping placeholders

| What | Where |
|---|---|
| Products, prices, colours, photos, status | `/admin/products` |
| WhatsApp number, socials, notice bar, delivery fees, payment options | `/admin/settings` |
| Categories (Shirts, Sets, Tees) | `lib/products.ts` |
| Logo | `components/logo.tsx` (`LogoMark`) |
| Brand colours | `app/globals.css` (`:root`) |
| Our story, size chart | `app/our-story/page.tsx`, `app/size-guide/page.tsx` |

Note: edits to `app/globals.css` don't hot-reload with the Tailwind Turbopack loader — restart `pnpm dev` to see them.
