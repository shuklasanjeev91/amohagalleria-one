-- Auto-register: every new auth.users row gets a collector profile
-- (and legacy user_profiles row when that table exists).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
  default_role text := 'collector';
begin
  display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    split_part(coalesce(new.email, 'collector'), '@', 1)
  );

  if coalesce(new.raw_app_meta_data->>'role', '') in ('collector', 'artist', 'admin') then
    default_role := new.raw_app_meta_data->>'role';
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    is_public,
    updated_at
  )
  values (
    new.id,
    new.email,
    display_name,
    default_role,
    default_role in ('artist', 'admin'),
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        role = coalesce(public.profiles.role, excluded.role),
        updated_at = now();

  -- Legacy CMS table used by admin listing (if present)
  if to_regclass('public.user_profiles') is not null then
    begin
      insert into public.user_profiles (id, email, full_name, role, updated_at)
      values (
        new.id,
        new.email,
        display_name,
        case when default_role = 'collector' then 'user' else default_role end,
        now()
      )
      on conflict (id) do update
        set email = excluded.email,
            full_name = coalesce(excluded.full_name, public.user_profiles.full_name),
            updated_at = now();
    exception
      when undefined_column then
        insert into public.user_profiles (id, email, full_name)
        values (new.id, new.email, display_name)
        on conflict (id) do nothing;
      when others then
        null;
    end;
  end if;

  return new;
end;
$$;

-- BEFORE INSERT: stamp collector on app_metadata so JWT has a role immediately
create or replace function public.handle_new_user_app_meta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_app_meta_data->>'role', '') = '' then
    new.raw_app_meta_data :=
      coalesce(new.raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', 'collector');
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_app_meta on auth.users;
create trigger on_auth_user_created_app_meta
  before insert on auth.users
  for each row execute function public.handle_new_user_app_meta();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any auth users missing a row
insert into public.profiles (id, email, full_name, role, is_public, updated_at)
select
  u.id,
  u.email,
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(u.raw_user_meta_data->>'name'), ''),
    split_part(coalesce(u.email, 'collector'), '@', 1)
  ),
  coalesce(nullif(u.raw_app_meta_data->>'role', ''), 'collector'),
  coalesce(u.raw_app_meta_data->>'role', 'collector') in ('artist', 'admin'),
  now()
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;
