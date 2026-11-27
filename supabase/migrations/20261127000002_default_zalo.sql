-- Shop Zalo number (owner-provided default). Editable later in Admin → Cài đặt.
alter table public.settings alter column zalo_phone set default '0358673493';
update public.settings set zalo_phone = '0358673493' where id = 1 and zalo_phone = '';

-- Hotline = same number as Zalo.
alter table public.settings alter column hotline set default '0358673493';
update public.settings set hotline = '0358673493' where id = 1 and hotline = '';
