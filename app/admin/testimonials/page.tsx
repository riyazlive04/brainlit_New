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

export const metadata: Metadata = { title: "Testimonials" };
export const dynamic = "force-dynamic";

export default async function TestimonialsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <>
      <h1 className="font-display text-[length:var(--text-h2)] text-ink">
        Testimonials
      </h1>

      <div className="mt-4 rounded-xl border border-spark-deep/40 bg-spark/15 p-4">
        <p className="text-sm leading-relaxed text-ink">
          <strong>Only publish what a parent has actually said</strong>, with
          their permission. If you name the child, a consent reference is
          required — the database will refuse to publish without one. Naming a
          child publicly is processing a child&apos;s personal data under the
          DPDP Act.
        </p>
      </div>

      <section className="mt-8 rounded-2xl border border-mist bg-white p-6">
        <h2 className="font-display font-semibold text-ink">Add a testimonial</h2>
        <form action={saveTestimonial} className="mt-5 grid gap-4 sm:grid-cols-2">
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
          <div className="sm:col-span-2 flex items-center justify-between gap-4">
            <AdminCheckbox label="Published" name="is_published" />
            <AdminSubmit>Add testimonial</AdminSubmit>
          </div>
        </form>
      </section>

      <h2 className="mt-10 font-display font-semibold text-ink">
        All testimonials ({testimonials?.length ?? 0})
      </h2>

      <div className="mt-4 space-y-4">
        {testimonials?.length ? (
          testimonials.map((item) => (
            <form
              key={item.id}
              action={saveTestimonial}
              className="rounded-2xl border border-mist bg-white p-6"
            >
              <input type="hidden" name="id" value={item.id} />

              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="font-medium text-ink">
                  {item.parent_name}
                  <span
                    className={
                      item.is_published
                        ? "ml-2 rounded-full bg-mist px-2 py-0.5 text-xs text-ink"
                        : "ml-2 rounded-full bg-mist/60 px-2 py-0.5 text-xs text-slate"
                    }
                  >
                    {item.is_published ? "Published" : "Draft"}
                  </span>
                </p>
                <AdminDelete id={item.id} action={deleteTestimonial} />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <AdminField label="Parent's name" name="parent_name" defaultValue={item.parent_name} required />
                <AdminField label="City" name="city" defaultValue={item.city} />
                <AdminTextarea label="What they said" name="quote" rows={3} defaultValue={item.quote} required className="sm:col-span-2" />
                <AdminField label="Child's first name" name="child_first_name" defaultValue={item.child_first_name} />
                <AdminField label="Consent reference" name="consent_ref" defaultValue={item.consent_ref} />
                <AdminField label="Rating (1–5)" name="rating" type="number" defaultValue={item.rating} min={1} max={5} />
                <AdminField label="Sort order" name="sort_order" type="number" defaultValue={item.sort_order} />
                <div className="sm:col-span-2 flex items-center justify-between gap-4">
                  <AdminCheckbox label="Published" name="is_published" defaultChecked={item.is_published} />
                  <AdminSubmit>Save changes</AdminSubmit>
                </div>
              </div>
            </form>
          ))
        ) : (
          <p className="rounded-2xl border border-mist bg-white px-6 py-8 text-[0.975rem] text-slate">
            None yet. The testimonials section is hidden on the public site
            until at least one is published.
          </p>
        )}
      </div>
    </>
  );
}
