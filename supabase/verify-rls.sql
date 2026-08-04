-- =============================================================================
-- RLS verification — returns a readable report
--
-- Run in the Supabase SQL editor after applying 0001_init.sql, and again after
-- any migration that touches policies or grants.
--
-- This RETURNS ROWS rather than raising notices, deliberately. The Supabase SQL
-- editor does not display RAISE NOTICE output, so a notice-based script reports
-- "Success. No rows returned" whether it checked eight tables or none. Absence
-- of an error is not evidence that anything was verified — a loop over an empty
-- set passes vacuously. Every check below is visible and counted.
--
-- Read the `status` column. Everything must say PASS.
--
-- Why this file exists at all: "RLS is enabled" is not "RLS protects anything".
-- A table can have RLS on with no policies, policies without FORCE (the owner
-- then bypasses them), or a permissive policy nobody reviewed.
-- =============================================================================

with

-- 0. Sanity: the expected tables actually exist --------------------------------
-- Guards against every check below passing vacuously because the migration was
-- never applied.
expected(table_name) as (
  values ('leads'), ('webinar_sessions'), ('webinar_registrations'),
         ('courses'), ('testimonials'), ('faqs'), ('site_settings'), ('profiles')
),
check_exists as (
  select
    '0. table exists'                                    as check_name,
    e.table_name                                         as detail,
    case
      when exists (
        select 1 from pg_tables
        where schemaname = 'public' and tablename = e.table_name
      ) then 'PASS'
      else 'FAIL — table missing, migration not applied'
    end                                                  as status
  from expected e
),

-- 1. Every public table must have RLS enabled AND forced -----------------------
rls_state as (
  select
    c.relname             as table_name,
    c.relrowsecurity      as enabled,
    c.relforcerowsecurity as forced
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
),
check_rls as (
  select
    '1. RLS enabled + FORCED'                            as check_name,
    table_name                                           as detail,
    case
      when not enabled then 'FAIL — RLS not enabled'
      when not forced  then 'FAIL — not FORCED, owner bypasses policies'
      else 'PASS'
    end                                                  as status
  from rls_state
),

-- 2. anon must have NO policy on lead data -------------------------------------
lead_tables(table_name) as (values ('leads'), ('webinar_registrations')),
check_leads as (
  select
    '2. no anon access to leads'                         as check_name,
    lt.table_name                                        as detail,
    case
      when count(p.policyname) > 0
        then 'FAIL — ' || count(p.policyname) || ' anon policy/policies found'
      else 'PASS — no anon policy'
    end                                                  as status
  from lead_tables lt
  left join pg_policies p
    on p.schemaname = 'public'
   and p.tablename = lt.table_name
   and ('anon' = any(p.roles) or 'public' = any(p.roles))
  group by lt.table_name
),

-- 3. zoom_url must not be readable by anon ------------------------------------
-- RLS filters rows, not columns, so this is a column grant. An exposed join
-- link lets unvetted adults into a live session with children.
check_zoom as (
  select
    '3. zoom_url hidden from anon'                       as check_name,
    'webinar_sessions.zoom_url'                          as detail,
    case
      when exists (
        select 1 from information_schema.column_privileges
        where table_schema = 'public'
          and table_name = 'webinar_sessions'
          and column_name = 'zoom_url'
          and grantee in ('anon', 'PUBLIC')
          and privilege_type = 'SELECT'
      ) then 'FAIL — anon can read the join link'
      else 'PASS'
    end                                                  as status
),
-- ...and anon MUST still be able to read the safe columns, or /webinar silently
-- loses its session date. Over-locking is a failure too.
check_zoom_safe as (
  select
    '3b. anon can read safe columns'                     as check_name,
    'webinar_sessions.starts_at'                         as detail,
    case
      when exists (
        select 1 from information_schema.column_privileges
        where table_schema = 'public'
          and table_name = 'webinar_sessions'
          and column_name = 'starts_at'
          and grantee = 'anon'
          and privilege_type = 'SELECT'
      ) then 'PASS'
      else 'FAIL — anon cannot read starts_at, /webinar will show no date'
    end                                                  as status
),

-- 4. Published content readable, unpublished not -------------------------------
content_tables(table_name) as (values ('courses'), ('testimonials'), ('faqs')),
check_content as (
  select
    '4. published-only content'                          as check_name,
    ct.table_name                                        as detail,
    case
      when count(p.policyname) = 0
        then 'FAIL — no anon SELECT policy gated on is_published'
      else 'PASS'
    end                                                  as status
  from content_tables ct
  left join pg_policies p
    on p.schemaname = 'public'
   and p.tablename = ct.table_name
   and p.cmd = 'SELECT'
   and 'anon' = any(p.roles)
   and p.qual ilike '%is_published%'
  group by ct.table_name
),

-- 5. is_admin() must be SECURITY DEFINER with a pinned search_path -------------
-- A definer function with a mutable search_path is a privilege-escalation hole:
-- a caller can shadow the tables it reads.
check_is_admin as (
  select
    '5. is_admin() hardened'                             as check_name,
    'public.is_admin()'                                  as detail,
    case
      when not exists (
        select 1 from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'is_admin'
      ) then 'FAIL — function does not exist'
      when not exists (
        select 1 from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname = 'is_admin'
          and p.prosecdef
          and array_to_string(coalesce(p.proconfig, '{}'), ',') ilike '%search_path%'
      ) then 'FAIL — not SECURITY DEFINER, or search_path not pinned'
      else 'PASS'
    end                                                  as status
)

select * from (
  select * from check_exists
  union all select * from check_rls
  union all select * from check_leads
  union all select * from check_zoom
  union all select * from check_zoom_safe
  union all select * from check_content
  union all select * from check_is_admin
) report
order by
  case when status like 'FAIL%' then 0 else 1 end,  -- failures first
  check_name,
  detail;

-- =============================================================================
-- Expected: 24 rows, every `status` starting with PASS, and no FAIL at the top.
--
-- Fewer rows than expected means the migration did not fully apply.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- One check that cannot be made from inside the database — run it in a terminal
-- with the ANON key (never the service role key), once there is at least one
-- row in `leads`. An empty table proves nothing.
--
--   curl "https://<project>.supabase.co/rest/v1/leads?select=*" \
--     -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>"
--
-- Expected: []  — even with rows present. If it returns ANY lead, stop and fix
-- it before the site takes traffic. That key is public and ships in the browser
-- bundle.
-- -----------------------------------------------------------------------------
