import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteTestimonial, saveTestimonial } from "../content-actions";
import {
  AdminCheckbox,
  AdminDelete,
  AdminField,
  AdminSubmit,
  AdminTextarea,
} from "@/components/admin/AdminForm";
import {
  AdminCard,
  AdminEmpty,
  AdminNotice,
  AdminPageHeader,
  AdminRecord,
  AdminSectionHeading,
} from "@/components/admin/AdminUI";
import { VideoUpload } from "@/components/admin/VideoUpload";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ConsentRequirement } from "@/components/admin/ConsentRequirement";


export const metadata: Metadata = { title: "Testimonials" };
export const dynamic = "force-dynamic";

export default async function TestimonialsPage({
  searchParams,
}: PageProps<"/admin/testimonials">) {
  // Auth and data run CONCURRENTLY, not in sequence.
  //
  // Awaiting requireAdmin() first meant three serial round trips to Supabase at
  // ~250ms each before anything rendered. Firing them together removes one leg
  // of that. It is safe: if requireAdmin() redirects, the query result is simply
  // discarded, and the data is protected by RLS regardless of what this function
  // concluded — the check is not what keeps the rows private.
  const supabase = await createClient();
  const [, { data: testimonials }, params] = await Promise.all([
    requireAdmin(),
    supabase.from("testimonials").select("*").order("sort_order", { ascending: true }),
    // Awaited alongside the rest rather than before it — it is a promise in
    // this version of Next, and blocking the queries on it would undo the
    // concurrency the comment above is about.
    searchParams,
  ]);
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <>
      <AdminPageHeader
        title="Testimonials"
        description="Parents buy on trust from other parents, so this is one of the highest-value sections on the site - and the one where invented content would do the most damage."
      />

      {/* WHY THE FORM REFUSED, said out loud.
          ─────────────────────────────────────────────────────────────────
          `saveTestimonial` used to `return` on both of its guards, which
          saved nothing and reported nothing: the page re-rendered, the form
          looked submitted, and no row existed. The first real use of this
          screen lost a testimonial to it — and then time hunting the
          homepage for something that had never been written.

          The guards redirect here with a reason now. This banner is the
          other half of that fix; without it the redirect is just a slightly
          different silence. */}
      {error && (
        <div className="mt-6">
          <AdminNotice tone="warn">
            {error === "consent" ? (
              <>
                <strong>
                  Saved, but kept as a draft - it needs a consent reference to
                  publish.
                </strong>{" "}
                Every other change you made has been saved. Publishing was the
                one thing held back, because this testimonial names a child or
                carries a video or a photo, and all three are personal data
                under the DPDP Act.
                Fill in <strong>Consent reference</strong> - a note saying where
                the parent&apos;s permission is recorded, such as
                &ldquo;WhatsApp, 11 Aug 2026&rdquo; - then tick Published and
                save again.
              </>
            ) : (
              <>
                <strong>Not saved - something required was blank.</strong> A
                testimonial needs at least the parent&apos;s name and the quote
                itself.
              </>
            )}
          </AdminNotice>
        </div>
      )}

      <div className="mt-6">
        <AdminNotice tone="warn">
          <strong>Only publish what a parent actually said</strong>, with their
          permission. Naming a child requires a consent reference - the database
          refuses to publish without one, because publishing a child&apos;s name
          is processing their personal data under the DPDP Act.
        </AdminNotice>
      </div>

      <AdminCard accent title="Add a testimonial" className="mt-6">
        <form action={saveTestimonial} className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Parent's name" name="parent_name" required />
          <AdminField label="City" name="city" placeholder="Chennai" />
          <AdminTextarea
            label="What they said"
            name="quote"
            rows={3}
            required
            className="sm:col-span-2"
          />
          <AdminField
            label="Child's first name"
            name="child_first_name"
            hint="Optional. Requires a consent reference to publish."
          />
          <AdminField
            label="Consent reference"
            name="consent_ref"
            hint="Required to publish a named child, a video or a photo. Where the permission is recorded - e.g. 'WhatsApp, 11 Aug 2026'"
          />
          <AdminField label="Rating (1-5)" name="rating" type="number" min={1} max={5} />
          <AdminField label="Sort order" name="sort_order" type="number" defaultValue={0} />
          <div className="sm:col-span-2">
            <ImageUpload
              name="photo_path"
              bucket="testimonial-photos"
              label="Parent photo"
              hint="JPEG, PNG, WebP or AVIF, up to 4 MB. A head-and-shoulders shot works best - it is shown as a small circle. This is a person's face, so publishing it needs the same consent reference a video does."
              aspect="aspect-square"
            />
          </div>
          <div className="sm:col-span-2">
            <VideoUpload name="video_path" />
          </div>
          <div className="sm:col-span-2 flex items-center justify-between gap-4">
            <AdminCheckbox label="Published" name="is_published" />
            <AdminSubmit>Add testimonial</AdminSubmit>
          </div>
          {/* Renders nothing; makes the browser refuse to submit a publish
              that needs a consent reference and has not got one, pointing at
              the field instead of at a banner three screens up. */}
          <ConsentRequirement />
        </form>
      </AdminCard>

      <AdminSectionHeading count={testimonials?.length ?? 0}>
        All testimonials
      </AdminSectionHeading>

      <div className="space-y-4">
        {testimonials?.length ? (
          testimonials.map((item) => (
            <form key={item.id} action={saveTestimonial}>
              <input type="hidden" name="id" value={item.id} />
              <AdminRecord
                heading={item.parent_name}
                meta={
                  [item.city, item.child_first_name]
                    .filter(Boolean)
                    .join(" · ") || undefined
                }
                published={item.is_published}
                actions={<AdminDelete action={deleteTestimonial} />}
              >
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label="Parent's name" name="parent_name" defaultValue={item.parent_name} required />
                <AdminField label="City" name="city" defaultValue={item.city} />
                <AdminTextarea label="What they said" name="quote" rows={3} defaultValue={item.quote} required className="sm:col-span-2" />
                <AdminField label="Child's first name" name="child_first_name" defaultValue={item.child_first_name} />
                {/* The hint belongs on the EDIT form too. This is the copy of
                    the field somebody is looking at when a save comes back as
                    a draft, and it was the one with no explanation on it. */}
                <AdminField
                  label="Consent reference"
                  name="consent_ref"
                  defaultValue={item.consent_ref}
                  hint={
                    item.child_first_name || item.video_path || item.photo_path
                      ? "Required to publish this one - it names a child, or has a video or photo."
                      : "Where the permission is recorded, if any."
                  }
                />
                <AdminField label="Rating (1-5)" name="rating" type="number" defaultValue={item.rating} min={1} max={5} />
                <AdminField label="Sort order" name="sort_order" type="number" defaultValue={item.sort_order} />
                <div className="sm:col-span-2">
                  <ImageUpload
                    name="photo_path"
                    defaultPath={item.photo_path}
                    bucket="testimonial-photos"
                    label="Parent photo"
                    hint="JPEG, PNG, WebP or AVIF, up to 4 MB. A head-and-shoulders shot works best - it is shown as a small circle. This is a person's face, so publishing it needs the same consent reference a video does."
                    aspect="aspect-square"
                  />
                </div>
                <div className="sm:col-span-2">
                  <VideoUpload name="video_path" defaultPath={item.video_path} />
                </div>
                <div className="sm:col-span-2 flex items-center justify-between gap-4">
                  <AdminCheckbox label="Published" name="is_published" defaultChecked={item.is_published} />
                  <AdminSubmit>Save changes</AdminSubmit>
                </div>
                <ConsentRequirement />
              </div>
              </AdminRecord>
            </form>
          ))
        ) : (
          <AdminEmpty
            title="No testimonials yet"
            description="The section stays hidden on the public site until one is live. An empty section costs a conversion; a fabricated one costs your credibility."
          />
        )}
      </div>
    </>
  );
}
