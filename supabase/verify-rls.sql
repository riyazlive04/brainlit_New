-- =============================================================================
-- RLS verification
--
-- Run this in the Supabase SQL editor AFTER applying 0001_init.sql, and again
-- after any migration that touches policies or grants.
--
-- Every check RAISES on failure rather than returning a row, so a problem is
-- impossible to scroll past. Read the whole output.
--
-- Why this file exists: "RLS is enabled" is not the same as "RLS protects
-- anything". A table can have RLS enabled and no policies (locked), policies
-- and no FORCE (owner bypasses), or a permissive policy nobody reviewed. The
-- only way to know is to assert it.
-- =============================================================================

do $$
declare
  t            text;
  rls_on       boolean;
  rls_forced   boolean;
  policy_count integer;
  bad          integer;
begin
  raise notice '--- 1. RLS enabled AND forced on every public table ---';

  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    select c.relrowsecurity, c.relforcerowsecurity
      into rls_on, rls_forced
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = t;

    if not rls_on then
      raise exception 'FAIL: RLS is not enabled on public.%', t;
    end if;

    -- Enabled-but-not-forced leaves the table owner exempt. The policies then
    -- look protective while doing nothing for owner-role connections.
    if not rls_forced then
      raise exception 'FAIL: RLS is not FORCED on public.% (owner bypasses)', t;
    end if;

    raise notice '  ok  %', t;
  end loop;

  raise notice '';
  raise notice '--- 2. anon must have NO policy on lead data ---';

  for t in select unnest(array['leads', 'webinar_registrations'])
  loop
    select count(*) into policy_count
      from pg_policies
     where schemaname = 'public'
       and tablename = t
       and ('anon' = any(roles) or 'public' = any(roles));

    if policy_count > 0 then
      raise exception
        'FAIL: public.% has % policy/policies granting anon access. Parent lead data must only be reachable server-side.',
        t, policy_count;
    end if;

    raise notice '  ok  % — no anon policy', t;
  end loop;

  raise notice '';
  raise notice '--- 3. zoom_url must not be readable by anon ---';

  -- RLS filters rows, not columns, so this is enforced by a column grant.
  -- An exposed join link lets unvetted adults into a live session with
  -- children without registering.
  select count(*) into bad
    from information_schema.column_privileges
   where table_schema = 'public'
     and table_name = 'webinar_sessions'
     and column_name = 'zoom_url'
     and grantee in ('anon', 'PUBLIC')
     and privilege_type = 'SELECT';

  if bad > 0 then
    raise exception 'FAIL: anon can SELECT webinar_sessions.zoom_url';
  end if;
  raise notice '  ok  zoom_url withheld from anon';

  raise notice '';
  raise notice '--- 4. published content is readable, unpublished is not ---';

  for t in select unnest(array['courses', 'testimonials', 'faqs'])
  loop
    select count(*) into policy_count
      from pg_policies
     where schemaname = 'public' and tablename = t
       and cmd = 'SELECT'
       and ('anon' = any(roles))
       and qual ilike '%is_published%';

    if policy_count = 0 then
      raise exception
        'FAIL: public.% has no anon SELECT policy gated on is_published', t;
    end if;
    raise notice '  ok  % — anon sees published rows only', t;
  end loop;

  raise notice '';
  raise notice '--- 5. is_admin() must pin its search_path ---';

  -- A SECURITY DEFINER function with a mutable search_path is a privilege
  -- escalation hole: a caller can shadow the tables it reads.
  perform 1
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'is_admin'
      and p.prosecdef
      and array_to_string(coalesce(p.proconfig, '{}'), ',') ilike '%search_path%';

  if not found then
    raise exception
      'FAIL: public.is_admin() is missing SECURITY DEFINER with a pinned search_path';
  end if;
  raise notice '  ok  is_admin() is definer with pinned search_path';

  raise notice '';
  raise notice '=== ALL RLS CHECKS PASSED ===';
end $$;

-- -----------------------------------------------------------------------------
-- Manual check that cannot be automated from inside the database.
--
-- From a terminal, with the ANON key (never the service role key):
--
--   curl "https://<project>.supabase.co/rest/v1/leads?select=*" \
--     -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>"
--
-- Expected: an empty array or a permission error. If it returns ANY lead rows,
-- stop and fix it before the site takes traffic — that key is public and sits
-- in the browser bundle.
-- -----------------------------------------------------------------------------
