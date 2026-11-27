# Thanh Chi Đồ Chơi — Design

Status: **Approved** (2026-11-27)

## 1. Understanding summary

- **What:** A real online toy shop for "Thanh Chi Đồ Chơi" — a customer **shop site** and an **admin site**.
- **Why:** Customers coming from TikTok (@thanhchiidochoi) can order directly; the owner confirms each order on Zalo and tracks it to delivery.
- **Who:** Vietnamese parents, mostly on mobile, coming from TikTok. Admin = owner + 1–2 staff.
- **Customer flow:** browse → choose option (color/style) → add to cart → checkout with **phone + address** (name & note optional) → success page with order code. No account, no online payment — COD.
- **Admin flow:** see new orders → "Nhắn Zalo" → confirm + add shipping fee → move through statuses to done. Also manage products, categories, videos, settings.
- **Stack:** One Next.js app (shop at `/`, admin at `/admin`) on Vercel + Supabase (Postgres, Auth, Storage).

## 2. Order statuses

| Status (code) | Label | Meaning | Allowed next |
|---|---|---|---|
| `new` | Mới | Customer just ordered | contacted, cancelled |
| `contacted` | Đã liên hệ Zalo | Admin messaged, waiting for reply | confirmed, cancelled |
| `confirmed` | Đã xác nhận | Customer agreed, shipping fee set | shipping, cancelled |
| `shipping` | Đang giao | Handed to shipper (optional tracking code) | completed, returned |
| `completed` | Hoàn thành | Delivered, COD collected | — |
| `cancelled` | Đã huỷ | Reason: no reply / customer cancelled / out of stock / spam / other | — |
| `returned` | Hoàn hàng | Customer refused / delivery failed | — |

Every change is written to a status history (who, when, from → to, note).

## 3. Assumptions

1. Phone: valid Vietnamese mobile (10 digits starting with 0). Address: one free-text field.
2. No stock counts; per-product "Hết hàng" switch only.
3. Options share the product price; optional `old_price` shows a discount.
4. Order items store a snapshot of name/option/price at purchase time.
5. Spam protection: honeypot field + max 3 orders per phone per hour.
6. Scale: < 1,000 orders/month; free tiers are enough. Fast on 4G mobile.
7. Admin login only (email + password); only users in the admin list may enter. Customer data visible to admins only.
8. 26 products seeded from the owner's photos with draft names; those without a known price start **hidden**.
9. The 9 TikTok videos are compressed and stored in Supabase Storage.
10. No emoji in the UI — a custom hand-drawn SVG icon set is used everywhere.

## 4. Non-goals

Customer accounts, online payment, customer order-tracking page, automatic Zalo/Telegram/email notifications, coupons, stock counting, multi-language, newsletter.

## 5. Decision log

| Decision | Alternatives | Why |
|---|---|---|
| Admin manages orders **and** products | Orders only | Owner adds toys/prices without a developer |
| Vercel + Supabase | VPS + SQLite; local only | Free, no server upkeep, includes auth + storage |
| Cart, multi-product orders | Buy-now single product | Fewer split orders |
| Simple options list (shared price) | Full variants; none | Covers colors/styles with little admin work |
| Shipping fee confirmed on Zalo, entered by admin | Flat fee + threshold; always free | Matches the owner's current workflow |
| No new-order notification; check admin | Telegram bot; email | Nothing to set up; can add later |
| One Next.js app with `/admin` | Two apps; static HTML + admin | Least setup; orders validated server-side |
| Hand-drawn SVG icons, no emoji | Emoji; icon library | Owner's request; consistent brand look |
| Images in Supabase Storage | Render disk; Cloudinary | Render free disk is wiped on restart; Supabase already in stack, has CDN |
| Local dev with Supabase CLI (Docker) | Cloud project from day 1 | No account needed until deploy |
| *(build)* No fake reviews / "10K+ khách" stats from the draft; replaced by "Đặt hàng thật dễ" steps | Keep sample reviews | Invented testimonials would mislead real customers; add real reviews later |
| *(build)* Self-hosted fonts via @fontsource | next/font/google | Build-time Google Fonts download failed in this environment; self-hosting removes the dependency |
| *(build)* Admin must enter a shipping fee (0 = free) before "Đã xác nhận" | Optional fee | Customer must know the final COD total when confirming |
| *(build)* 8 videos (not 9) | — | Actual count in /products |

## 6. Data model

- **categories**: id, name, slug, image_path, sort_order
- **products**: id, slug, name, description, price, old_price?, age_range (`0-1`,`1-3`,`3-6`,`6-12`), category_id, options text[], is_visible, is_out_of_stock, is_featured, sort_order, created_at, updated_at
- **product_images**: id, product_id, path, sort_order (first = cover)
- **videos**: id, path, poster_path, product_id?, sort_order
- **orders**: id, code (`TC-XXXXX`), phone, address, customer_name?, note?, subtotal, shipping_fee?, total, status, cancel_reason?, tracking_code?, admin_note?, created_at, updated_at
- **order_items**: id, order_id, product_id?, product_name, option?, unit_price, qty, image_path?
- **order_status_history**: id, order_id, from_status?, to_status, changed_by?, note?, created_at
- **admins**: user_id (auth.users), email, created_at
- **settings**: single row — shop_name, hotline, zalo_phone, topbar_text, promo_title, promo_text, zalo_message_template

**Security (RLS):** public can read visible products/images, categories, videos, settings. Orders, items, history: no public access; created only by the server (service role) and read/updated by admins. Storage bucket `media` is public-read, admin-write.

## 7. Shop

- `/` Home — hero, trust strip, categories, best sellers with age filter, promo, TikTok videos, reviews, footer.
- `/san-pham` all products, `/danh-muc/[slug]` category — grid, age filter, price sort, search.
- `/san-pham/[slug]` product detail — gallery, options, qty, add to cart / buy now, related.
- Cart — slide-in drawer, stored in localStorage, "Phí ship shop sẽ báo qua Zalo".
- `/thanh-toan` checkout — phone (Zalo) + address required; name + note optional.
- `/dat-hang-thanh-cong` success — order code, summary, shop Zalo button.

**Checkout server action:** validate → honeypot → rate limit → reload products/prices from DB (reject hidden / out of stock) → insert order + items + history in one transaction (DB function) → return code.

## 8. Admin

- `/admin/dang-nhap` — email/password; must be in `admins`.
- `/admin` — orders: dashboard strip (today, waiting, month revenue), status tabs with counts, search by phone/code, date filter, mobile cards.
- `/admin/don/[code]` — customer info + Zalo / call / copy address, items, shipping fee input, copy confirmation message, valid next-status buttons (cancel reason, tracking code), internal note, history. Edit phone/address/qty while `new` or `contacted`.
- `/admin/san-pham` — list with quick toggles; create/edit form with options chips and multi-image upload (client-side resize).
- `/admin/danh-muc`, `/admin/video`, `/admin/cai-dat`.

## 9. Build plan

1. Setup: Next.js, Tailwind, design tokens, icon set
2. Database: migrations, RLS, seed + media upload
3. Shop pages with real data
4. Cart + checkout
5. Admin login + orders
6. Admin products / categories / videos / settings
7. Polish: mobile, performance, SEO, end-to-end test
8. Deploy: owner creates Supabase + Vercel accounts; connect domain

## 10. Testing

- Unit: status transitions, totals, phone validation, order code.
- E2E (Playwright): cart → checkout → admin sees order → move to Hoàn thành.
- Security: anonymous client cannot read orders.

## 11. Risks

- Video size vs 1 GB free storage → compress on seed.
- Spam orders → honeypot + rate limit; captcha later if needed.
- Draft product names may be wrong → owner reviews in admin.
