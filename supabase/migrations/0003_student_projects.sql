-- =============================================================================
-- Student projects
--
-- 0001 covered testimonials but not student work, which the discovery document
-- lists as an essential feature. Adding it here so the admin panel can manage
-- it rather than it living in a code file only a developer can edit.
--
-- Consent is a first-class column, not a note in a spreadsheet. Publishing a
-- child's work is processing a child's personal data, which under the DPDP Act
-- 2023 requires verifiable parental consent — so the schema refuses to publish
-- without a recorded reference.
-- =============================================================================

create table if not exists public.student_projects (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  summary            text not null,
  -- First name and age ONLY. Never a full name, school or photograph.
  student_first_name text not null,
  student_age        smallint check (student_age between 6 and 18),
  -- Where the signed parental consent is filed. Publishing without it is
  -- blocked by the constraint below.
  consent_ref        text,
  is_published       boolean not null default false,
  sort_order         smallint not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- Structural, not procedural. A checkbox in an admin form can be ticked by
  -- mistake; this cannot be published without the consent reference present.
  constraint student_projects_consent_required
    check (not is_published or consent_ref is not null)
);

create index if not exists student_projects_published_idx
  on public.student_projects (sort_order) where is_published;

drop trigger if exists set_updated_at on public.student_projects;
create trigger set_updated_at before update on public.student_projects
  for each row execute function public.set_updated_at();

alter table public.student_projects enable row level security;
alter table public.student_projects force  row level security;

drop policy if exists "published projects are public" on public.student_projects;
create policy "published projects are public" on public.student_projects
  for select to anon, authenticated using (is_published);

drop policy if exists "admins manage projects" on public.student_projects;
create policy "admins manage projects" on public.student_projects
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- The same consent rule applied to testimonials, which 0001 left as an
-- unenforced convention.
-- -----------------------------------------------------------------------------
alter table public.testimonials
  drop constraint if exists testimonials_child_consent_required;

alter table public.testimonials
  add constraint testimonials_child_consent_required
  check (
    not is_published
    or child_first_name is null
    or consent_ref is not null
  );
