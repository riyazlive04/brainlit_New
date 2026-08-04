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


export const metadata: Metadata = { title: "Testimonials" };
export const dynamic = "force-dynamic";

export default async function TestimonialsPage() {
  // Auth and data run CONCURRENTLY, not in sequence.
  //
  // Awaiting requireAdmin() first meant three serial round trips to Supabase at
  // ~250ms each before anything rendered. Firing them together removes one leg
  // of that. It is safe: if requireAdmin() redirects, the query result is simply
  // discarded, and the data is protected by RLS regardless of what this function
  // concluded — the check is not what keeps the rows private.
  const supabase = await createClient();
  const [, { data: testimonials }] = await Promise.all([
    requireAdmin(),
    supabase.from("testimonials").select("*").order("sort_order", { ascending: true }),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Testimonials"
        description="Parents buy on trust from other parents, so this is one of the highest-value sections on the site — and the one where invented content would do the most damage."
      />

      <div className="mt-6">
        <AdminNotice tone="warn">
          <strong>Only publish what a parent actually said</strong>, with their
          permission. Naming a child requires a consent reference — the database
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
            hint="Where the signed permission is filed"
          />
          <AdminField label="Rating (1–5)" name="rating" type="number" min={1} max={5} />
          <AdminField label="Sort order" name="sort_order" type="number" defaultValue={0} />
          <div className="sm:col-span-2">
            <VideoUpload name="video_path" />
          </div>
          <div className="sm:col-span-2 flex items-center justify-between gap-4">
            <AdminCheckbox label="Published" name="is_published" />
            <AdminSubmit>Add testimonial</AdminSubmit>
          </div>
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
                actions={<AdminDelete id={item.id} action={deleteTestimonial} />}
              >
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label="Parent's name" name="parent_name" defaultValue={item.parent_name} required />
                <AdminField label="City" name="city" defaultValue={item.city} />
                <AdminTextarea label="What they said" name="quote" rows={3} defaultValue={item.quote} required className="sm:col-span-2" />
                <AdminField label="Child's first name" name="child_first_name" defaultValue={item.child_first_name} />
                <AdminField label="Consent reference" name="consent_ref" defaultValue={item.consent_ref} />
                <AdminField label="Rating (1–5)" name="rating" type="number" defaultValue={item.rating} min={1} max={5} />
                <AdminField label="Sort order" name="sort_order" type="number" defaultValue={item.sort_order} />
                <div className="sm:col-span-2">
                  <VideoUpload name="video_path" defaultPath={item.video_path} />
                </div>
                <div className="sm:col-span-2 flex items-center justify-between gap-4">
                  <AdminCheckbox label="Published" name="is_published" defaultChecked={item.is_published} />
                  <AdminSubmit>Save changes</AdminSubmit>
                </div>
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
