# Deploy: Supabase (database) + Vercel (website)

Both have free plans that fit this shop. You create the accounts yourself; these steps take about 20 minutes.

## 1. Supabase project

1. Sign up at supabase.com → **New project**. Region: **Southeast Asia (Singapore)**. Save the database password somewhere safe.
2. Project → **Settings → API**: note the **Project URL**, the **anon** key and the **service_role** key.
3. **Authentication → Sign In / Providers → Email**: turn **off** "Allow new users to sign up" (admins are created by script).
4. Push the schema from this folder:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
5. Seed products + upload photos/videos to the cloud project (uses your local ffmpeg/sharp):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co \
   SUPABASE_SERVICE_ROLE_KEY=<service_role key> \
   npm run seed
   ```
6. Create your admin account:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co \
   SUPABASE_SERVICE_ROLE_KEY=<service_role key> \
   npm run create-admin -- you@example.com '<strong password>'
   ```

## 2. Vercel

1. Push this folder to a GitHub repository (private is fine).
2. vercel.com → **Add New → Project** → import the repo. Framework: Next.js (auto).
3. **Environment Variables** (Production + Preview):
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key (**secret** — never put it in client code) |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-domain.vn` (for share previews) |
4. Deploy. Open `/admin`, log in, then in **Cài đặt** fill in hotline + Zalo number.

## 3. Domain (optional)

Vercel → Project → **Settings → Domains** → add `yourshop.vn` and follow the DNS instructions from your domain registrar.

## After launch — checklist

- [ ] Add prices for the 20 hidden products (Admin → Sản phẩm → filter "Chưa có giá"), then turn on **Hiện**.
- [ ] Review the draft product names/descriptions.
- [ ] Replace screenshot-style photos (e.g. piano photo from Shopee, finger-dinosaur phone screenshot) with clean photos.
- [ ] Link each TikTok video to its product (Admin → Video) so the "Mua" button appears.
- [ ] Place one real test order from your phone and walk it through to **Hoàn thành**, then cancel/clean it up.

## Limits to watch (free plans)

- Supabase Storage 1 GB — current media ≈ 20 MB. Compress videos to 720p before uploading (max 50 MB each).
- Supabase free projects **pause after 7 days without activity**; any visit or admin login keeps it active. Upgrade to Pro if the shop grows.
