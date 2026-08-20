-- =============================================================================
-- Chat leads — what the website's chatbot captures
--
-- A SEPARATE TABLE, not more columns on `leads`.
--
-- `leads` requires a name, an email and a phone, because every form that feeds
-- it asks for all three. The chatbot asks for a phone number and, on one
-- branch, a child's age. Widening `leads` to fit would mean making name and
-- email nullable for every source, which quietly removes a guarantee the admin
-- screens and the export rely on. Two tables that each mean something beat one
-- table that means "some of these fields, sometimes".
--
-- DPDP Act 2023: the parent is the data subject and the phone number is the
-- personal data. From the child there is an AGE and nothing else — no name, no
-- contact, no school. Do not add child identifiers here without a verifiable
-- parental consent flow.
-- =============================================================================

create table if not exists public.chat_leads (
  id           uuid primary key default gen_random_uuid(),

  -- Ten digits, no country code — the canonical form from lib/phone.ts. The
  -- constraint is what keeps it canonical: without it "+91 98765 43210" and
  -- "9876543210" become two parents as far as any query is concerned.
  phone        text not null check (phone ~ '^[6-9][0-9]{9}$'),

  branch       text not null
                 check (branch in ('exploring','ai_literacy','future_readiness')),

  -- AI-literacy branch only; null everywhere else. Captured because it is worth
  -- knowing, not because it changes what the parent is shown.
  readiness    text check (readiness in ('ready','more_details')),

  child_age    smallint check (child_age between 6 and 18),

  -- The outcome of the WhatsApp send, stored rather than logged. A message that
  -- failed is a parent waiting for something that will never arrive, and that
  -- is only recoverable if a person can list them.
  --   pending          — row written, send not yet attempted
  --   sent             — provider accepted it
  --   not_configured   — no Evolution GO credentials in the environment
  --   template_missing — the branch's template in content/chatbot.ts is empty
  --   failed           — provider rejected it or the request died
  whatsapp_status  text not null default 'pending'
                     check (whatsapp_status in
                       ('pending','sent','not_configured','template_missing','failed')),
  whatsapp_error   text,
  whatsapp_id      text,
  whatsapp_at      timestamptz,

  utm_source   text,
  utm_medium   text,
  utm_campaign text,

  -- Pressing a branch and typing a number IS the consent, and it is given at a
  -- known moment. Recording that moment is the point.
  consent_at   timestamptz not null default now(),

  status       text not null default 'new'
                 check (status in ('new','contacted','registered','enrolled','lost')),
  notes        text,

  created_at   timestamptz not null default now()
);

-- The two questions anyone actually asks this table: who came in recently, and
-- who never got their message.
create index if not exists chat_leads_created_idx
  on public.chat_leads (created_at desc);

create index if not exists chat_leads_undelivered_idx
  on public.chat_leads (created_at desc)
  where whatsapp_status <> 'sent';

-- -----------------------------------------------------------------------------
-- Row level security
--
-- Deliberately NO policy for `anon`. Rows are written by the service role from
-- /api/chat, exactly as public form submissions are written to `leads`. If anon
-- could select here, every parent's phone number would be readable with the
-- publishable key that ships in the browser bundle.
-- -----------------------------------------------------------------------------
alter table public.chat_leads enable row level security;

drop policy if exists "admins read chat leads" on public.chat_leads;
create policy "admins read chat leads" on public.chat_leads
  for select to authenticated using (public.is_admin());

drop policy if exists "admins update chat leads" on public.chat_leads;
create policy "admins update chat leads" on public.chat_leads
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

comment on table public.chat_leads is
  'Phone numbers captured by the website chatbot. Parent is the data subject; from the child only an age is held.';
