-- =============================================================================
-- Close the duplicate-registration hole for sessions that are not yet scheduled
--
-- 0001 declared `unique (session_id, lead_id)` on webinar_registrations and that
-- looked sufficient. It is not, because in Postgres NULL is never equal to NULL,
-- so a UNIQUE constraint permits unlimited rows where session_id is null.
--
-- Before any session exists, every registration is written with a null session.
-- Found in end-to-end testing: one lead, four registrations from four
-- submissions of the same form — and, once email is configured, four
-- confirmation emails to the same parent.
--
-- The application now checks for this case explicitly, but application checks
-- race under concurrent submissions (a parent double-tapping on a slow
-- connection is exactly that race). This makes it structural.
-- =============================================================================

-- Remove any duplicates already present, keeping the earliest of each group.
delete from public.webinar_registrations a
using public.webinar_registrations b
where a.session_id is null
  and b.session_id is null
  and a.lead_id = b.lead_id
  and a.created_at > b.created_at;

-- A partial unique index — the tool for exactly this, since it can enforce
-- uniqueness over rows a plain UNIQUE constraint treats as always distinct.
create unique index if not exists webinar_registrations_lead_pending_uniq
  on public.webinar_registrations (lead_id)
  where session_id is null;
