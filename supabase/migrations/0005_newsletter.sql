-- =============================================================================
-- 0005 — newsletter subscribers
--
-- The weekly AI-parenting newsletter is a separate consent from a course
-- enquiry, and it has to be stored separately to stay that way.
--
-- Folding these into `leads` was the tempting option and is the wrong one:
--   * `leads` requires a name and phone, which the newsletter deliberately does
--     not ask for — a single email field converts several times better.
--   * Under the DPDP Act 2023 consent must be specific to a purpose. Somebody
--     who asked for a newsletter has not consented to a sales call, and a
--     schema that cannot tell the two apart will eventually be used as if they
--     had.
--   * Unsubscribing must not delete an enrolment enquiry, and vice versa.
--
-- Same posture as every other table here: RLS enabled AND forced, no `anon`
-- access of any kind. Writes go through /api/newsletter with the service role,
-- so the endpoint can rate-limit and drop honeypot submissions — and so the
-- publishable anon key can never be used to scrape the subscriber list.
-- =============================================================================

create table if not exists public.newsletter_subscribers (
  id             uuid primary key default gen_random_uuid(),
  email          text not null,

  -- Where they subscribed from, for attribution. Same closed vocabulary style
  -- as leads.source so the two can be reported on together.
  source         text not null default 'home'
                   check (source in ('home','footer','resources','blog','webinar')),

  utm_source     text,
  utm_medium     text,
  utm_campaign   text,

  -- Consent is recorded as a timestamp rather than a boolean. "Did they agree"
  -- is not the question a regulator asks; "when, and can you show it" is.
  consent_at     timestamptz not null default now(),

  -- Soft unsubscribe. The row is kept so a later re-subscribe is not treated as
  -- a fresh consent, and so we can prove we stopped sending when asked to.
  unsubscribed_at timestamptz,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- One row per address, case-insensitively. Parents type Priya@ and priya@
-- interchangeably; without this they would receive every issue twice.
create unique index if not exists newsletter_subscribers_email_key
  on public.newsletter_subscribers (lower(email));

create index if not exists newsletter_subscribers_active_idx
  on public.newsletter_subscribers (created_at desc)
  where unsubscribed_at is null;

drop trigger if exists set_updated_at on public.newsletter_subscribers;
create trigger set_updated_at before update on public.newsletter_subscribers
  for each row execute function public.set_updated_at();

-- --- row level security ------------------------------------------------------

alter table public.newsletter_subscribers enable row level security;
alter table public.newsletter_subscribers force  row level security;

-- Deliberately NO policy for `anon`, including INSERT. See the header.
drop policy if exists "admins read subscribers" on public.newsletter_subscribers;
create policy "admins read subscribers" on public.newsletter_subscribers
  for select to authenticated using (public.is_admin());

drop policy if exists "admins manage subscribers" on public.newsletter_subscribers;
create policy "admins manage subscribers" on public.newsletter_subscribers
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
