-- =============================================================================
-- Testimonial photographs — a parent's face beside their words
--
-- A quote with a face attached is a materially stronger trust signal than the
-- same quote as text: it says a real person said this and was willing to be
-- seen saying it. It is also, for exactly that reason, personal data.
--
-- So this column joins `child_first_name` and `video_path` under the SAME
-- consent rule, rather than getting a weaker one of its own. A photograph of a
-- parent is no less identifying than a video of them; it is the same exposure
-- with fewer frames.
-- =============================================================================

alter table public.testimonials
  add column if not exists photo_path text;

comment on column public.testimonials.photo_path is
  'Object path inside the testimonial-photos bucket. Requires consent_ref to publish.';

-- -----------------------------------------------------------------------------
-- Consent now covers a named child, a video, OR a photograph.
--
-- Rewritten rather than added to: a second constraint would let a row satisfy
-- one and violate the other, and the error would name whichever happened to be
-- evaluated first. One rule, one message.
-- -----------------------------------------------------------------------------
alter table public.testimonials
  drop constraint if exists testimonials_consent_required;

alter table public.testimonials
  add constraint testimonials_consent_required
  check (
    not is_published
    or (
      child_first_name is null
      and video_path is null
      and photo_path is null
    )
    or consent_ref is not null
  );

-- -----------------------------------------------------------------------------
-- Storage bucket
--
-- Same shape as course-images in 0006 and testimonial-videos in 0004: public
-- read because these are marketing assets meant to be seen, with size and MIME
-- enforced AT THE BUCKET rather than only in the form. A limit the browser
-- applies is not a limit — the storage API is reachable directly with the same
-- session.
--
-- 4 MB, half what a programme photograph gets. This renders at about 56px
-- across beside a quote; anything approaching the ceiling has not been exported
-- for the web, and every visitor pays for it.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'testimonial-photos',
  'testimonial-photos',
  true,
  4194304, -- 4 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "testimonial photos are public" on storage.objects;
create policy "testimonial photos are public" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'testimonial-photos');

drop policy if exists "admins upload testimonial photos" on storage.objects;
create policy "admins upload testimonial photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'testimonial-photos' and public.is_admin());

drop policy if exists "admins update testimonial photos" on storage.objects;
create policy "admins update testimonial photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'testimonial-photos' and public.is_admin());

drop policy if exists "admins delete testimonial photos" on storage.objects;
create policy "admins delete testimonial photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'testimonial-photos' and public.is_admin());
