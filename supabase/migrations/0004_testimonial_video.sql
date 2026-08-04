-- =============================================================================
-- Video testimonials — uploaded files, held in Supabase Storage
--
-- A parent speaking to camera converts far better than the same words as text.
-- It is also the highest-risk content on the site for consent: a video carries
-- a person's face and voice, and frequently their child's too, which is a
-- child's personal data under the DPDP Act 2023.
--
-- READ THE COST NOTE AT THE BOTTOM BEFORE PUBLISHING MANY OF THESE.
-- =============================================================================

alter table public.testimonials
  add column if not exists video_path text;

comment on column public.testimonials.video_path is
  'Object path inside the testimonial-videos bucket. Requires consent_ref to publish.';

-- -----------------------------------------------------------------------------
-- Storage bucket
--
-- Public read: these are marketing assets meant to be seen, and a signed URL
-- per view would break CDN caching and make every play slower.
--
-- Uploads are capped and restricted by MIME type at the BUCKET level, not just
-- in the admin form. A limit enforced only in the browser is not a limit — the
-- storage API is reachable directly with the same session.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'testimonial-videos',
  'testimonial-videos',
  true,
  104857600, -- 100 MB
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone may read a published video.
drop policy if exists "testimonial videos are public" on storage.objects;
create policy "testimonial videos are public" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'testimonial-videos');

-- Only admins may add, replace or remove them.
drop policy if exists "admins upload testimonial videos" on storage.objects;
create policy "admins upload testimonial videos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'testimonial-videos' and public.is_admin());

drop policy if exists "admins update testimonial videos" on storage.objects;
create policy "admins update testimonial videos" on storage.objects
  for update to authenticated
  using (bucket_id = 'testimonial-videos' and public.is_admin());

drop policy if exists "admins delete testimonial videos" on storage.objects;
create policy "admins delete testimonial videos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'testimonial-videos' and public.is_admin());

-- -----------------------------------------------------------------------------
-- Consent is required to publish EITHER a named child or a video.
--
-- 0003 required it only for a named child. A video is at least as sensitive: it
-- carries a parent's face and voice, and often their child's. Publishing one
-- without recorded permission is the same failure with more of the person
-- exposed.
-- -----------------------------------------------------------------------------
alter table public.testimonials
  drop constraint if exists testimonials_child_consent_required;

alter table public.testimonials
  drop constraint if exists testimonials_consent_required;

alter table public.testimonials
  add constraint testimonials_consent_required
  check (
    not is_published
    or (child_first_name is null and video_path is null)
    or consent_ref is not null
  );

-- =============================================================================
-- COST AND BANDWIDTH — please read
--
-- Supabase Storage does NOT transcode. A two-minute clip straight off a phone
-- is commonly 60-150MB at 1080p or 4K, and that exact file is what every
-- visitor downloads. On the free tier (1GB storage, 2GB egress per month) a
-- single 60MB video is exhausted after roughly 30 plays.
--
-- Against the traffic in the discovery document — 5,000 to 10,000 visitors a
-- month, growing to 50,000 — uploaded video will be the largest running cost
-- on this project and the slowest thing on the page for a parent on mobile
-- data.
--
-- Two things make it workable:
--   1. Compress before uploading. 720p, ~2 Mbps, H.264 puts a two-minute clip
--      near 20-30MB. HandBrake's "Fast 720p30" preset does this in one click.
--   2. The player uses preload="none", so nothing downloads until a visitor
--      presses play. Most never will, and they pay nothing for the video.
--
-- If this becomes expensive, the alternative is unlisted YouTube: no storage
-- cost, no egress cost, adaptive quality on slow connections. The trade is a
-- third-party embed, which is why it was not the default.
-- =============================================================================
