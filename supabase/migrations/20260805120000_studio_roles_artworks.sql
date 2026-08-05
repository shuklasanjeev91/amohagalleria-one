-- Studio integration for existing amohagalleria_db schema
-- Uses: user_profiles, user_roles, artists, artworks, artwork_images, medium, collections

alter table public.profiles
  add column if not exists role text not null default 'collector',
  add column if not exists slug text,
  add column if not exists avatar_url text,
  add column if not exists bio text,
  add column if not exists short_bio text,
  add column if not exists location text,
  add column if not exists discipline text,
  add column if not exists is_public boolean not null default false;

do $$ begin
  alter table public.profiles drop constraint if exists profiles_role_check;
  alter table public.profiles
    add constraint profiles_role_check
    check (role in ('collector', 'artist', 'admin'));
exception when others then null;
end $$;

create unique index if not exists profiles_slug_unique
  on public.profiles (slug)
  where slug is not null;

alter table public.artworks add column if not exists status text;

update public.artworks
set status = case when coalesce(is_available, true) then 'published' else 'draft' end
where status is null;

do $$ begin
  alter table public.artworks
    add constraint artworks_status_check
    check (status in ('draft', 'pending', 'published', 'rejected'));
exception when duplicate_object then null;
end $$;

alter table public.artworks alter column status set default 'draft';
alter table public.artworks alter column status set not null;

create index if not exists artworks_status_idx on public.artworks (status);

alter table public.artworks add column if not exists slug text;
create unique index if not exists artworks_slug_unique on public.artworks (slug) where slug is not null;

alter table public.artists add column if not exists slug text;
create unique index if not exists artists_slug_unique on public.artists (slug) where slug is not null;

create or replace function public.auth_role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', ''),
    (
      select case
        when exists (
          select 1 from public.user_roles ur
          where ur.user_id = auth.uid() and ur.role = 'admin'
        ) then 'admin'
        when exists (
          select 1 from public.user_roles ur
          where ur.user_id = auth.uid() and ur.role = 'artist'
        ) then 'artist'
        else 'collector'
      end
    ),
    (select role from public.profiles where id = auth.uid()),
    'collector'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.auth_role() = 'admin';
$$;

create or replace function public.is_artist_or_admin()
returns boolean
language sql
stable
as $$
  select public.auth_role() in ('artist', 'admin');
$$;

create or replace function public.admin_set_role(target uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  base_slug text;
  artist_name text;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  if new_role not in ('collector', 'artist', 'admin') then
    raise exception 'invalid role';
  end if;

  update auth.users
  set raw_app_meta_data =
    coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', new_role)
  where id = target;

  insert into public.profiles (id, email, full_name, role, is_public, updated_at)
  select
    u.id,
    u.email,
    coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
    new_role,
    new_role in ('artist', 'admin'),
    now()
  from auth.users u
  where u.id = target
  on conflict (id) do update
    set role = excluded.role,
        is_public = case when excluded.role in ('artist', 'admin') then true else public.profiles.is_public end,
        updated_at = now();

  update public.user_profiles
  set role = case when new_role = 'collector' then 'user' else new_role end,
      updated_at = now()
  where id = target;

  delete from public.user_roles
  where user_id = target and role in ('artist', 'admin');

  if new_role = 'artist' then
    insert into public.user_roles (user_id, role)
    values (target, 'artist');

    select coalesce(full_name, email) into artist_name from public.profiles where id = target;
    base_slug := lower(regexp_replace(coalesce(artist_name, 'artist'), '[^a-z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug) || '-' || substr(target::text, 1, 6);

    if exists (select 1 from public.artists where user_id = target) then
      update public.artists
      set is_approved = true,
          slug = coalesce(slug, base_slug),
          updated_at = now()
      where user_id = target;
    else
      insert into public.artists (user_id, artist_name, is_approved, slug, profile_details)
      values (target, coalesce(artist_name, 'Artist'), true, base_slug, '');
    end if;
  elsif new_role = 'admin' then
    insert into public.user_roles (user_id, role)
    values (target, 'admin');
  else
    update public.artists
    set is_approved = false, updated_at = now()
    where user_id = target;
  end if;
end;
$$;

revoke all on function public.admin_set_role(uuid, text) from public;
grant execute on function public.admin_set_role(uuid, text) to authenticated;

create or replace function public.admin_set_artwork_status(target uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  if new_status not in ('draft', 'pending', 'published', 'rejected') then
    raise exception 'invalid status';
  end if;
  update public.artworks
  set
    status = new_status,
    is_available = (new_status = 'published')
  where id = target;
end;
$$;

revoke all on function public.admin_set_artwork_status(uuid, text) from public;
grant execute on function public.admin_set_artwork_status(uuid, text) to authenticated;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('artworks', 'artworks', true)
on conflict (id) do update set public = true;

drop policy if exists "studio_avatars_public_read" on storage.objects;
create policy "studio_avatars_public_read"
  on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists "studio_avatars_owner_write" on storage.objects;
create policy "studio_avatars_owner_write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "studio_artworks_owner_write" on storage.objects;
create policy "studio_artworks_owner_write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'artworks'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

alter table public.profiles enable row level security;
drop policy if exists "profiles_select_public_or_own" on public.profiles;
create policy "profiles_select_public_or_own"
  on public.profiles for select
  using (is_public = true or auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

grant select on public.profiles to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;

update public.artists a
set slug = lower(regexp_replace(coalesce(a.artist_name, 'artist'), '[^a-zA-Z0-9]+', '-', 'g'))
  || '-' || substr(a.id::text, 1, 6)
where a.slug is null;

update public.artworks w
set slug = lower(regexp_replace(coalesce(w.title, 'work'), '[^a-zA-Z0-9]+', '-', 'g'))
  || '-' || substr(w.id::text, 1, 6)
where w.slug is null;
