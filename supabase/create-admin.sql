-- =============================================================================
-- Grant admin access to a person
--
-- Run this AFTER creating the user in the Supabase dashboard
-- (Authentication -> Users -> Add user, with a password).
--
-- Deliberately a manual, deliberate step. The obvious convenience — a trigger
-- that writes a profile row on every auth signup — would make anyone who can
-- reach the signup endpoint an administrator of the parent lead database. There
-- is no version of that which is safe, so admin access is granted by hand.
--
-- Replace the email below, then run the whole block.
-- =============================================================================

insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  'super_admin'                      -- or 'admin' for a non-owner
from auth.users u
where u.email = 'haja@brainlit.in'   -- <<< CHANGE THIS
on conflict (id) do update
  set role = excluded.role;

-- Confirm it worked. Should return exactly one row.
select p.id, u.email, p.full_name, p.role
from public.profiles p
join auth.users u on u.id = p.id
order by p.created_at desc;

-- -----------------------------------------------------------------------------
-- Turn OFF public signups while you are in the dashboard:
--   Authentication -> Providers -> Email -> disable "Enable sign ups"
--
-- Nothing on this site needs a public signup. Leaving it on means strangers can
-- create auth users against your project — they would not be admins, but it is
-- an open door with no purpose.
-- -----------------------------------------------------------------------------
