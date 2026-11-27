-- Explicit table privileges for the Data API roles.
-- New Supabase projects no longer auto-grant table access to anon/authenticated/service_role,
-- so we grant exactly what the RLS policies are designed around. RLS still decides which rows.

grant usage on schema public to anon, authenticated, service_role;

-- Server-side scripts / place_order (service role bypasses RLS).
grant all on all tables in schema public to service_role;
grant all on all routines in schema public to service_role;

-- Public catalog (RLS: visible products only; admins see all).
grant select on public.categories, public.products, public.product_images, public.videos, public.settings
  to anon, authenticated;

-- Admin catalog editing (RLS: is_admin()).
grant insert, update, delete on public.categories, public.products, public.product_images, public.videos
  to authenticated;
grant update on public.settings to authenticated;

-- Admin order access (RLS: is_admin()). No insert/delete: orders are created only by place_order().
grant select on public.orders, public.order_items, public.order_status_history, public.admins to authenticated;
-- Column-level update on orders stays as granted in the init migration
-- (phone, address, customer_name, shipping_fee, admin_note).
grant update (phone, address, customer_name, shipping_fee, admin_note) on public.orders to authenticated;

-- Helper used inside RLS policies.
grant execute on function public.is_admin() to anon, authenticated;
