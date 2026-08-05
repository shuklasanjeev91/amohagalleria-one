-- Admin CRM + soft commerce: customers, enquiries, cart, admin delete helpers

-- ---------------------------------------------------------------------------
-- Customers (visited / leads)
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_key text generated always as (lower(email)) stored,
  full_name text,
  phone text,
  source text,
  notes text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customers_email_key_unique
  on public.customers (email_key);

create index if not exists customers_last_seen_idx
  on public.customers (last_seen_at desc);

-- ---------------------------------------------------------------------------
-- Enquiries
-- ---------------------------------------------------------------------------
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  name text,
  phone text,
  message text,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'closed')),
  artwork_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists enquiries_status_idx on public.enquiries (status);
create index if not exists enquiries_created_idx on public.enquiries (created_at desc);

-- ---------------------------------------------------------------------------
-- Enquiry cart items
-- ---------------------------------------------------------------------------
create table if not exists public.enquiry_cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  session_key text,
  artwork_id uuid not null references public.artworks (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint enquiry_cart_owner check (
    user_id is not null or (session_key is not null and length(trim(session_key)) > 0)
  )
);

create unique index if not exists enquiry_cart_user_artwork_unique
  on public.enquiry_cart_items (user_id, artwork_id)
  where user_id is not null;

create unique index if not exists enquiry_cart_session_artwork_unique
  on public.enquiry_cart_items (session_key, artwork_id)
  where session_key is not null;

create index if not exists enquiry_cart_user_idx on public.enquiry_cart_items (user_id);
create index if not exists enquiry_cart_session_idx on public.enquiry_cart_items (session_key);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.customers enable row level security;
alter table public.enquiries enable row level security;
alter table public.enquiry_cart_items enable row level security;

drop policy if exists "customers_admin_all" on public.customers;
create policy "customers_admin_all"
  on public.customers for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "enquiries_admin_all" on public.enquiries;
create policy "enquiries_admin_all"
  on public.enquiries for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "enquiries_insert_public" on public.enquiries;
create policy "enquiries_insert_public"
  on public.enquiries for insert
  to anon, authenticated
  with check (true);

drop policy if exists "enquiries_select_own" on public.enquiries;
create policy "enquiries_select_own"
  on public.enquiries for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "cart_select_own" on public.enquiry_cart_items;
create policy "cart_select_own"
  on public.enquiry_cart_items for select
  to anon, authenticated
  using (
    public.is_admin()
    or (user_id is not null and user_id = auth.uid())
    or session_key is not null
  );

drop policy if exists "cart_insert_own" on public.enquiry_cart_items;
create policy "cart_insert_own"
  on public.enquiry_cart_items for insert
  to anon, authenticated
  with check (
    (user_id is not null and user_id = auth.uid())
    or (user_id is null and session_key is not null)
  );

drop policy if exists "cart_delete_own" on public.enquiry_cart_items;
create policy "cart_delete_own"
  on public.enquiry_cart_items for delete
  to anon, authenticated
  using (
    public.is_admin()
    or (user_id is not null and user_id = auth.uid())
    or session_key is not null
  );

grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update on public.enquiries to anon, authenticated;
grant select, insert, delete on public.enquiry_cart_items to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Submit enquiry
-- ---------------------------------------------------------------------------
create or replace function public.submit_enquiry(
  p_email text,
  p_name text default null,
  p_phone text default null,
  p_message text default null,
  p_artwork_ids uuid[] default '{}',
  p_session_key text default null,
  p_source text default 'enquiry'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_enquiry_id uuid;
  v_email text := lower(trim(p_email));
  v_user uuid := auth.uid();
  v_ids uuid[] := coalesce(p_artwork_ids, '{}');
begin
  if v_email is null or v_email = '' or position('@' in v_email) = 0 then
    raise exception 'valid email required';
  end if;

  select id into v_customer_id from public.customers where email_key = v_email;
  if v_customer_id is null then
    insert into public.customers (email, full_name, phone, source, last_seen_at, updated_at)
    values (
      v_email,
      nullif(trim(coalesce(p_name, '')), ''),
      nullif(trim(coalesce(p_phone, '')), ''),
      coalesce(nullif(trim(p_source), ''), 'enquiry'),
      now(),
      now()
    )
    returning id into v_customer_id;
  else
    update public.customers
    set
      full_name = coalesce(nullif(trim(coalesce(p_name, '')), ''), full_name),
      phone = coalesce(nullif(trim(coalesce(p_phone, '')), ''), phone),
      last_seen_at = now(),
      updated_at = now()
    where id = v_customer_id;
  end if;

  insert into public.enquiries (
    customer_id, user_id, email, name, phone, message, status, artwork_ids
  )
  values (
    v_customer_id,
    v_user,
    v_email,
    nullif(trim(coalesce(p_name, '')), ''),
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(trim(coalesce(p_message, '')), ''),
    'new',
    v_ids
  )
  returning id into v_enquiry_id;

  if v_user is not null then
    delete from public.enquiry_cart_items where user_id = v_user;
  elsif p_session_key is not null and length(trim(p_session_key)) > 0 then
    delete from public.enquiry_cart_items where session_key = trim(p_session_key);
  end if;

  return v_enquiry_id;
end;
$$;

revoke all on function public.submit_enquiry(text, text, text, text, uuid[], text, text) from public;
grant execute on function public.submit_enquiry(text, text, text, text, uuid[], text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin delete artwork
-- ---------------------------------------------------------------------------
create or replace function public.admin_delete_artwork(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  delete from public.artwork_images where artwork_id = target;
  delete from public.enquiry_cart_items where artwork_id = target;
  delete from public.artworks where id = target;
end;
$$;

revoke all on function public.admin_delete_artwork(uuid) from public;
grant execute on function public.admin_delete_artwork(uuid) to authenticated;

create or replace function public.delete_own_artwork(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_owner uuid;
begin
  select a.user_id, w.status
    into v_owner, v_status
  from public.artworks w
  join public.artists a on a.id = w.artist_id
  where w.id = target;

  if v_owner is null and v_status is null then
    raise exception 'artwork not found';
  end if;

  if public.is_admin() then
    perform public.admin_delete_artwork(target);
    return;
  end if;

  if v_owner is distinct from auth.uid() then
    raise exception 'not authorized';
  end if;

  if v_status not in ('draft', 'pending', 'rejected') then
    raise exception 'only draft, pending, or rejected works can be deleted by artists';
  end if;

  delete from public.artwork_images where artwork_id = target;
  delete from public.enquiry_cart_items where artwork_id = target;
  delete from public.artworks where id = target;
end;
$$;

revoke all on function public.delete_own_artwork(uuid) from public;
grant execute on function public.delete_own_artwork(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Admin upsert / delete artist
-- ---------------------------------------------------------------------------
create or replace function public.admin_upsert_artist(
  p_id uuid default null,
  p_user_id uuid default null,
  p_artist_name text default null,
  p_profile_details text default null,
  p_address text default null,
  p_instagram text default null,
  p_website text default null,
  p_profile_photo text default null,
  p_is_approved boolean default null,
  p_slug text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_name text := nullif(trim(coalesce(p_artist_name, '')), '');
  v_slug text;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  if v_name is null then
    raise exception 'artist_name required';
  end if;

  v_slug := coalesce(
    nullif(trim(coalesce(p_slug, '')), ''),
    lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g'))
  );
  v_slug := trim(both '-' from v_slug);

  if p_id is not null then
    update public.artists
    set
      user_id = coalesce(p_user_id, user_id),
      artist_name = v_name,
      profile_details = coalesce(p_profile_details, profile_details),
      address = coalesce(p_address, address),
      instagram = coalesce(p_instagram, instagram),
      website = coalesce(p_website, website),
      profile_photo = coalesce(p_profile_photo, profile_photo),
      is_approved = coalesce(p_is_approved, is_approved),
      slug = coalesce(nullif(v_slug, ''), slug),
      updated_at = now()
    where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'artist not found';
    end if;
    return v_id;
  end if;

  insert into public.artists (
    user_id, artist_name, profile_details, address, instagram, website,
    profile_photo, is_approved, slug
  )
  values (
    p_user_id,
    v_name,
    coalesce(p_profile_details, ''),
    p_address,
    p_instagram,
    p_website,
    p_profile_photo,
    coalesce(p_is_approved, false),
    v_slug || '-' || substr(gen_random_uuid()::text, 1, 6)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.admin_upsert_artist(uuid, uuid, text, text, text, text, text, text, boolean, text) from public;
grant execute on function public.admin_upsert_artist(uuid, uuid, text, text, text, text, text, text, boolean, text) to authenticated;

create or replace function public.admin_delete_artist(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  w record;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  for w in select id from public.artworks where artist_id = target loop
    perform public.admin_delete_artwork(w.id);
  end loop;

  delete from public.artists where id = target;
end;
$$;

revoke all on function public.admin_delete_artist(uuid) from public;
grant execute on function public.admin_delete_artist(uuid) to authenticated;

create or replace function public.admin_update_customer(
  target uuid,
  p_full_name text default null,
  p_phone text default null,
  p_notes text default null,
  p_source text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  update public.customers
  set
    full_name = coalesce(p_full_name, full_name),
    phone = coalesce(p_phone, phone),
    notes = coalesce(p_notes, notes),
    source = coalesce(p_source, source),
    updated_at = now()
  where id = target;
end;
$$;

revoke all on function public.admin_update_customer(uuid, text, text, text, text) from public;
grant execute on function public.admin_update_customer(uuid, text, text, text, text) to authenticated;

create or replace function public.admin_update_enquiry_status(target uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  if new_status not in ('new', 'in_progress', 'closed') then
    raise exception 'invalid status';
  end if;
  update public.enquiries
  set status = new_status, updated_at = now()
  where id = target;
end;
$$;

revoke all on function public.admin_update_enquiry_status(uuid, text) from public;
grant execute on function public.admin_update_enquiry_status(uuid, text) to authenticated;

do $$ begin
  drop policy if exists "artists_admin_all" on public.artists;
  create policy "artists_admin_all"
    on public.artists for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());
exception when undefined_table then null;
end $$;

do $$ begin
  drop policy if exists "artworks_admin_all" on public.artworks;
  create policy "artworks_admin_all"
    on public.artworks for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());
exception when undefined_table then null;
end $$;
