-- Thanh Chi Đồ Chơi — initial schema
-- Money is stored as integer VND.

create extension if not exists pgcrypto;

-- ============ Admins ============
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ============ Catalog ============
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image_path text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  price int not null default 0 check (price >= 0),
  old_price int check (old_price is null or old_price >= 0),
  age_range text check (age_range in ('0-1', '1-3', '3-6', '6-12')),
  category_id uuid references public.categories (id) on delete set null,
  options text[] not null default '{}',
  is_visible boolean not null default false,
  is_out_of_stock boolean not null default false,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create index products_visible_idx on public.products (is_visible, sort_order);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  path text not null,
  sort_order int not null default 0
);
create index product_images_product_idx on public.product_images (product_id, sort_order);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  poster_path text,
  product_id uuid references public.products (id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.settings (
  id int primary key default 1 check (id = 1),
  shop_name text not null default 'Thanh Chi Đồ Chơi',
  hotline text not null default '',
  zalo_phone text not null default '',
  topbar_text text not null default 'Giao hàng toàn quốc · Thanh toán khi nhận hàng · Đổi trả trong 7 ngày',
  promo_title text not null default 'Đồ chơi hot trên TikTok',
  promo_text text not null default 'Xem video thật, đặt hàng nhanh — shop nhắn Zalo xác nhận ngay.',
  zalo_message_template text not null default
    'Chào {ten}, shop Thanh Chi xác nhận đơn {ma}:
{san_pham}
Tiền hàng: {tien_hang}
Phí ship: {phi_ship}
Tổng thanh toán khi nhận hàng: {tong}
Giao đến: {dia_chi}
Anh/chị xác nhận giúp shop để shop gửi hàng nhé. Cảm ơn ạ!',
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1);

-- ============ Orders ============
create type public.order_status as enum
  ('new', 'contacted', 'confirmed', 'shipping', 'completed', 'cancelled', 'returned');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  phone text not null,
  address text not null,
  customer_name text,
  note text,
  subtotal int not null check (subtotal >= 0),
  shipping_fee int check (shipping_fee is null or shipping_fee >= 0),
  total int not null check (total >= 0),
  status public.order_status not null default 'new',
  cancel_reason text,
  tracking_code text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_status_created_idx on public.orders (status, created_at desc);
create index orders_phone_idx on public.orders (phone, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  option text,
  unit_price int not null check (unit_price >= 0),
  qty int not null check (qty between 1 and 99),
  image_path text
);
create index order_items_order_idx on public.order_items (order_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  changed_by uuid references auth.users (id) on delete set null,
  changed_by_email text,
  note text,
  created_at timestamptz not null default now()
);
create index order_history_order_idx on public.order_status_history (order_id, created_at);

-- updated_at triggers
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- ============ Order code ============
-- TC- + 5 chars from an alphabet without look-alikes (no 0/O, 1/I/L).
create or replace function public.gen_order_code()
returns text
language plpgsql
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  candidate text;
  i int;
begin
  loop
    candidate := 'TC-';
    for i in 1..5 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.orders where code = candidate);
  end loop;
  return candidate;
end;
$$;

-- ============ Place order (called by the server with the service role) ============
-- items: [{ "product_id": uuid, "option": text|null, "qty": int }]
-- Prices are always read from the database, never from the client.
create or replace function public.place_order(
  p_phone text,
  p_address text,
  p_name text,
  p_note text,
  p_items jsonb
)
returns table (order_code text, order_total int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_code text;
  v_subtotal int := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty int;
  v_option text;
  v_cover text;
  v_recent int;
begin
  if p_phone !~ '^0[35789][0-9]{8}$' then
    raise exception 'INVALID_PHONE';
  end if;
  if length(trim(coalesce(p_address, ''))) < 5 then
    raise exception 'INVALID_ADDRESS';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'TOO_MANY_ITEMS';
  end if;

  -- rate limit: max 3 orders per phone per hour
  select count(*) into v_recent
  from public.orders
  where phone = p_phone and created_at > now() - interval '1 hour';
  if v_recent >= 3 then
    raise exception 'RATE_LIMITED';
  end if;

  v_code := public.gen_order_code();
  insert into public.orders (code, phone, address, customer_name, note, subtotal, total)
  values (v_code, p_phone, trim(p_address), nullif(trim(coalesce(p_name, '')), ''),
          nullif(trim(coalesce(p_note, '')), ''), 0, 0)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from public.products
    where id = (v_item ->> 'product_id')::uuid;

    if not found or not v_product.is_visible then
      raise exception 'PRODUCT_UNAVAILABLE:%', v_item ->> 'product_id';
    end if;
    if v_product.is_out_of_stock then
      raise exception 'OUT_OF_STOCK:%', v_product.id;
    end if;
    if v_product.price <= 0 then
      raise exception 'PRODUCT_UNAVAILABLE:%', v_product.id;
    end if;

    v_qty := coalesce((v_item ->> 'qty')::int, 0);
    if v_qty < 1 or v_qty > 99 then
      raise exception 'INVALID_QTY';
    end if;

    v_option := nullif(v_item ->> 'option', '');
    if cardinality(v_product.options) > 0 then
      if v_option is null or not (v_option = any (v_product.options)) then
        raise exception 'INVALID_OPTION:%', v_product.id;
      end if;
    else
      v_option := null;
    end if;

    select path into v_cover from public.product_images
    where product_id = v_product.id order by sort_order limit 1;

    insert into public.order_items (order_id, product_id, product_name, option, unit_price, qty, image_path)
    values (v_order_id, v_product.id, v_product.name, v_option, v_product.price, v_qty, v_cover);

    v_subtotal := v_subtotal + v_product.price * v_qty;
  end loop;

  update public.orders set subtotal = v_subtotal, total = v_subtotal where id = v_order_id;

  insert into public.order_status_history (order_id, from_status, to_status, note)
  values (v_order_id, null, 'new', 'Khách đặt hàng trên website');

  return query select v_code, v_subtotal;
end;
$$;

revoke all on function public.place_order(text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.place_order(text, text, text, text, jsonb) to service_role;

-- ============ Change status (admin only, enforces allowed transitions) ============
create or replace function public.change_order_status(
  p_order_id uuid,
  p_to public.order_status,
  p_note text default null,
  p_cancel_reason text default null,
  p_tracking_code text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from public.order_status;
  v_email text;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  select status into v_from from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if not (
    (v_from = 'new'       and p_to in ('contacted', 'cancelled')) or
    (v_from = 'contacted' and p_to in ('confirmed', 'cancelled')) or
    (v_from = 'confirmed' and p_to in ('shipping', 'cancelled')) or
    (v_from = 'shipping'  and p_to in ('completed', 'returned'))
  ) then
    raise exception 'INVALID_TRANSITION:%->%', v_from, p_to;
  end if;

  if p_to = 'cancelled' and coalesce(trim(p_cancel_reason), '') = '' then
    raise exception 'CANCEL_REASON_REQUIRED';
  end if;

  update public.orders set
    status = p_to,
    cancel_reason = case when p_to = 'cancelled' then trim(p_cancel_reason) else cancel_reason end,
    tracking_code = case when p_to = 'shipping' then nullif(trim(coalesce(p_tracking_code, '')), '') else tracking_code end
  where id = p_order_id;

  select email into v_email from public.admins where user_id = auth.uid();

  insert into public.order_status_history (order_id, from_status, to_status, changed_by, changed_by_email, note)
  values (p_order_id, v_from, p_to, auth.uid(), v_email,
          nullif(trim(coalesce(
            case when p_to = 'cancelled' then p_cancel_reason else p_note end, '')), ''));
end;
$$;

revoke all on function public.change_order_status(uuid, public.order_status, text, text, text) from public, anon;
grant execute on function public.change_order_status(uuid, public.order_status, text, text, text) to authenticated;

-- ============ Edit order items (admin, only while new/contacted) ============
-- Recalculates subtotal/total. Shipping fee is updated directly on orders by admins.
create or replace function public.recalc_order_total()
returns trigger
language plpgsql
as $$
begin
  new.total := new.subtotal + coalesce(new.shipping_fee, 0);
  return new;
end;
$$;
create trigger orders_total before insert or update of subtotal, shipping_fee on public.orders
  for each row execute function public.recalc_order_total();

create or replace function public.admin_set_item_qty(p_item_id uuid, p_qty int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_status public.order_status;
  v_count int;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;
  select o.id, o.status into v_order_id, v_status
  from public.order_items i join public.orders o on o.id = i.order_id
  where i.id = p_item_id for update of o;
  if not found then raise exception 'ITEM_NOT_FOUND'; end if;
  if v_status not in ('new', 'contacted') then raise exception 'ORDER_LOCKED'; end if;

  if p_qty <= 0 then
    select count(*) into v_count from public.order_items where order_id = v_order_id;
    if v_count <= 1 then raise exception 'LAST_ITEM'; end if;
    delete from public.order_items where id = p_item_id;
  else
    if p_qty > 99 then raise exception 'INVALID_QTY'; end if;
    update public.order_items set qty = p_qty where id = p_item_id;
  end if;

  update public.orders set subtotal = (
    select coalesce(sum(unit_price * qty), 0) from public.order_items where order_id = v_order_id
  ) where id = v_order_id;
end;
$$;
revoke all on function public.admin_set_item_qty(uuid, int) from public, anon;
grant execute on function public.admin_set_item_qty(uuid, int) to authenticated;

-- Admins may only edit phone/address while new/contacted; shipping fee/notes anytime before final.
create or replace function public.guard_order_update()
returns trigger
language plpgsql
as $$
begin
  if (new.phone is distinct from old.phone or new.address is distinct from old.address
      or new.customer_name is distinct from old.customer_name)
     and old.status not in ('new', 'contacted') then
    raise exception 'ORDER_LOCKED';
  end if;
  if new.shipping_fee is distinct from old.shipping_fee
     and old.status in ('completed', 'cancelled', 'returned') then
    raise exception 'ORDER_LOCKED';
  end if;
  return new;
end;
$$;
create trigger orders_guard before update on public.orders
  for each row execute function public.guard_order_update();

-- ============ Row Level Security ============
alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.videos enable row level security;
alter table public.settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

-- admins: an admin can see the admin list; nobody edits it from the client
create policy admins_read on public.admins for select to authenticated using (public.is_admin());

-- public catalog reads
create policy categories_read on public.categories for select using (true);
create policy products_read on public.products for select using (is_visible or public.is_admin());
create policy product_images_read on public.product_images for select using (
  public.is_admin() or exists (select 1 from public.products p where p.id = product_id and p.is_visible)
);
create policy videos_read on public.videos for select using (true);
create policy settings_read on public.settings for select using (true);

-- admin writes on catalog
create policy categories_admin on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy products_admin on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy product_images_admin on public.product_images for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy videos_admin on public.videos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy settings_admin on public.settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- orders: admins only (inserts happen via place_order with the service role)
create policy orders_admin_read on public.orders for select to authenticated using (public.is_admin());
create policy orders_admin_update on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy order_items_admin_read on public.order_items for select to authenticated using (public.is_admin());
create policy order_history_admin_read on public.order_status_history for select to authenticated using (public.is_admin());

-- Admins may not change status/totals directly — only via the functions above.
revoke update on public.orders from authenticated;
grant update (phone, address, customer_name, shipping_fee, admin_note) on public.orders to authenticated;

-- ============ Storage ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800,
        array['image/jpeg', 'image/png', 'image/webp', 'video/mp4'])
on conflict (id) do nothing;

create policy media_public_read on storage.objects for select
  using (bucket_id = 'media');
create policy media_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
create policy media_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin());
create policy media_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
