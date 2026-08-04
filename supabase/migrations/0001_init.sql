-- =============================================================================
-- BrainLIT — Phase 1 schema
-- Marketing site + webinar funnel.
--
-- Security posture:
--   * RLS is enabled AND FORCED on every table. "Enabled but not forced" leaves
--     the table owner exempt, which makes the policies look protective while
--     doing nothing for owner-role connections.
--   * `anon` gets NO access to leads or registrations — not even INSERT. All
--     writes flow through /api route handlers using the service role, so the
--     server can rate-limit, drop honeypot submissions and attribute UTM
--     parameters that a browser could otherwise forge.
--   * `anon` may read published content only.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Shared helpers
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles — admin accounts (Phase 2 CMS logs in against these)
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text,
  role        text not null default 'admin'
                check (role in ('super_admin', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- SECURITY DEFINER so the policy can read `profiles` without recursively
-- triggering the very policy being evaluated. `search_path` is pinned because
-- a definer function with a mutable search_path is a privilege-escalation hole.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('super_admin', 'admin')
  );
$$;

-- -----------------------------------------------------------------------------
-- leads — every form submission on the site. The most sensitive table here.
-- -----------------------------------------------------------------------------

create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  phone         text not null,

  -- DPDP Act 2023: parent is the data subject. From the child we hold only a
  -- first name and an age. Do not add child contact fields without a
  -- verifiable parental consent flow.
  child_name    text,
  child_age     smallint check (child_age between 6 and 18),

  message       text,
  source        text not null default 'home'
                  check (source in ('home','webinar','contact','course','footer')),

  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  utm_content   text,

  -- Explicit parent/guardian confirmation, captured at submission time.
  consent_at    timestamptz not null default now(),

  status        text not null default 'new'
                  check (status in ('new','contacted','registered','enrolled','lost')),
  notes         text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx     on public.leads (status);
create index if not exists leads_email_idx      on public.leads (lower(email));
create index if not exists leads_utm_source_idx on public.leads (utm_source)
  where utm_source is not null;

-- -----------------------------------------------------------------------------
-- webinar sessions & registrations
-- -----------------------------------------------------------------------------

create table if not exists public.webinar_sessions (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  starts_at   timestamptz not null,
  duration_minutes smallint not null default 60,
  zoom_url    text,
  capacity    integer,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists webinar_sessions_upcoming_idx
  on public.webinar_sessions (starts_at)
  where is_active;

create table if not exists public.webinar_registrations (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid references public.webinar_sessions on delete set null,
  lead_id         uuid not null references public.leads on delete cascade,
  attended        boolean not null default false,
  reminder_sent_at timestamptz,
  created_at      timestamptz not null default now(),

  -- One registration per lead per session; a double-submit must not create
  -- a duplicate seat or a duplicate reminder email.
  unique (session_id, lead_id)
);

create index if not exists webinar_registrations_session_idx
  on public.webinar_registrations (session_id);

-- -----------------------------------------------------------------------------
-- Published content (Phase 2 CMS writes these; the site reads them)
-- -----------------------------------------------------------------------------

create table if not exists public.courses (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  title          text not null,
  summary        text,
  hero_copy      text,
  age_min        smallint not null default 10,
  age_max        smallint not null default 14,
  duration_weeks smallint,
  price_inr      integer,
  curriculum     jsonb not null default '[]'::jsonb,
  is_published   boolean not null default false,
  sort_order     smallint not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists courses_published_idx
  on public.courses (sort_order) where is_published;

create table if not exists public.testimonials (
  id               uuid primary key default gen_random_uuid(),
  parent_name      text not null,
  child_first_name text,
  city             text,
  quote            text not null,
  rating           smallint check (rating between 1 and 5),
  -- Publishing a child's name or likeness requires recorded parental consent.
  consent_ref      text,
  is_published     boolean not null default false,
  sort_order       smallint not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists testimonials_published_idx
  on public.testimonials (sort_order) where is_published;

create table if not exists public.faqs (
  id           uuid primary key default gen_random_uuid(),
  question     text not null,
  answer       text not null,
  category     text,
  is_published boolean not null default true,
  sort_order   smallint not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists faqs_published_idx
  on public.faqs (sort_order) where is_published;

create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','leads','webinar_sessions','courses',
    'testimonials','faqs','site_settings'
  ]
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at();', t, t);
  end loop;
end $$;

-- =============================================================================
-- Row level security
-- =============================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','leads','webinar_sessions','webinar_registrations',
    'courses','testimonials','faqs','site_settings'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force  row level security;', t);
  end loop;
end $$;

-- --- profiles ----------------------------------------------------------------
drop policy if exists "own profile readable" on public.profiles;
create policy "own profile readable" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "admins manage profiles" on public.profiles;
create policy "admins manage profiles" on public.profiles
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- leads -------------------------------------------------------------------
-- Intentionally NO policy for `anon`. Public submissions are written by the
-- service role from /api/lead. If anon could SELECT here, the entire parent
-- lead list would be scrapable with the publishable anon key.
drop policy if exists "admins read leads" on public.leads;
create policy "admins read leads" on public.leads
  for select to authenticated using (public.is_admin());

drop policy if exists "admins update leads" on public.leads;
create policy "admins update leads" on public.leads
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- webinar registrations ---------------------------------------------------
drop policy if exists "admins read registrations" on public.webinar_registrations;
create policy "admins read registrations" on public.webinar_registrations
  for select to authenticated using (public.is_admin());

drop policy if exists "admins write registrations" on public.webinar_registrations;
create policy "admins write registrations" on public.webinar_registrations
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- webinar sessions --------------------------------------------------------
-- The landing page needs the next session's date and time, so active rows are
-- publicly readable. But `zoom_url` must NOT be public: anyone could read it and
-- walk into the session without registering, which both breaks the funnel and
-- puts unvetted adults in a room with children.
--
-- RLS filters rows, not columns, so the policy alone cannot do this. Column
-- level grants can, and they apply before any policy is evaluated.
drop policy if exists "active sessions are public" on public.webinar_sessions;
create policy "active sessions are public" on public.webinar_sessions
  for select to anon, authenticated using (is_active);

revoke select on public.webinar_sessions from anon;
grant  select (id, title, starts_at, duration_minutes, capacity, is_active)
  on public.webinar_sessions to anon;

drop policy if exists "admins manage sessions" on public.webinar_sessions;
create policy "admins manage sessions" on public.webinar_sessions
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- published content -------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['courses','testimonials','faqs']
  loop
    execute format('drop policy if exists "published content is public" on public.%I;', t);
    execute format(
      'create policy "published content is public" on public.%I
         for select to anon, authenticated using (is_published);', t);

    execute format('drop policy if exists "admins manage content" on public.%I;', t);
    execute format(
      'create policy "admins manage content" on public.%I
         for all to authenticated
         using (public.is_admin()) with check (public.is_admin());', t);
  end loop;
end $$;

-- --- site settings -----------------------------------------------------------
drop policy if exists "settings are public" on public.site_settings;
create policy "settings are public" on public.site_settings
  for select to anon, authenticated using (true);

drop policy if exists "admins manage settings" on public.site_settings;
create policy "admins manage settings" on public.site_settings
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
