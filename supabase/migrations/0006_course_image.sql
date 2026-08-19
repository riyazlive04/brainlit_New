-- =============================================================================
-- Programme images — one photograph per course, held in Supabase Storage
--
-- A programme card with nothing but a title, three facts and a price is a price
-- list. The photograph is what makes it a thing a parent can picture their
-- child inside, and it is the single largest visual difference between this
-- page and a spreadsheet.
--
-- NOTE ON WHAT MAY BE IN THE PICTURE. The consent rules that govern
-- student_projects and testimonials govern this too: if a child is
-- identifiable, verifiable parental consent has to exist first (DPDP Act 2023).
-- There is no consent_ref column here because a programme is not a person and
-- the safe photograph — a worktable, a screen, a whiteboard, hands — needs no
-- consent at all. That is a reason to choose those shots, not a loophole.
-- =============================================================================

alter table public.courses
  add column if not exists image_path text;

comment on column public.courses.image_path is
  'Object path inside the course-images bucket. Null renders no image.';

-- `hero_copy` has existed since 0001 and has never been writable: the admin
-- form omitted it, so every course has carried a null one. It is the long
-- description that the detail page has room for and the card summary does not.
comment on column public.courses.hero_copy is
  'Long description for the programme detail page. `summary` is the one-liner.';

-- -----------------------------------------------------------------------------
-- Storage bucket
--
-- Same shape as testimonial-videos in 0004, and the same reasoning: public read
-- because these are marketing assets meant to be seen and a signed URL per view
-- would defeat CDN caching, with size and MIME enforced AT THE BUCKET rather
-- than only in the form. A limit the browser applies is not a limit — the
-- storage API is reachable directly with the same session.
--
-- 8 MB, against the videos' 100. A programme photograph that needs more than
-- that has not been exported for the web, and every visitor pays for it.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-images',
  'course-images',
  true,
  8388608, -- 8 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone may read a programme image.
drop policy if exists "course images are public" on storage.objects;
create policy "course images are public" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'course-images');

-- Only admins may add, replace or remove them.
drop policy if exists "admins upload course images" on storage.objects;
create policy "admins upload course images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'course-images' and public.is_admin());

drop policy if exists "admins update course images" on storage.objects;
create policy "admins update course images" on storage.objects
  for update to authenticated
  using (bucket_id = 'course-images' and public.is_admin());

drop policy if exists "admins delete course images" on storage.objects;
create policy "admins delete course images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'course-images' and public.is_admin());
