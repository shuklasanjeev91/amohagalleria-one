-- Align legacy user_profiles.role with canonical profiles / user_roles / JWT roles.
-- Legacy CMS used role = 'user' for collectors, which confused the admin console.

-- 1) Promote anyone already in user_roles into profiles + app_metadata
update public.profiles p
set
  role = case
    when exists (select 1 from public.user_roles ur where ur.user_id = p.id and ur.role = 'admin') then 'admin'
    when exists (select 1 from public.user_roles ur where ur.user_id = p.id and ur.role = 'artist') then 'artist'
    else p.role
  end,
  is_public = case
    when exists (
      select 1 from public.user_roles ur
      where ur.user_id = p.id and ur.role in ('admin', 'artist')
    ) then true
    else p.is_public
  end,
  updated_at = now()
where exists (
  select 1 from public.user_roles ur
  where ur.user_id = p.id and ur.role in ('admin', 'artist')
);

update auth.users u
set raw_app_meta_data =
  coalesce(u.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object(
    'role',
    case
      when exists (select 1 from public.user_roles ur where ur.user_id = u.id and ur.role = 'admin') then 'admin'
      when exists (select 1 from public.user_roles ur where ur.user_id = u.id and ur.role = 'artist') then 'artist'
      else coalesce(nullif(u.raw_app_meta_data->>'role', ''), 'collector')
    end
  )
where exists (
  select 1 from public.user_roles ur
  where ur.user_id = u.id and ur.role in ('admin', 'artist')
);

-- 2) Mirror canonical profiles.role into legacy user_profiles (user = collector)
update public.user_profiles up
set
  role = case
    when p.role = 'collector' then 'user'
    else p.role
  end,
  updated_at = now()
from public.profiles p
where p.id = up.id
  and up.role is distinct from case when p.role = 'collector' then 'user' else p.role end;

-- 3) Ensure admin listing prefers profiles (policy already allows is_admin())
-- no schema change required
