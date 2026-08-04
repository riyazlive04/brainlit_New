import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteCourse, saveCourse } from "../content-actions";
import {
  AdminCheckbox,
  AdminDelete,
  AdminField,
  AdminSubmit,
  AdminTextarea,
} from "@/components/admin/AdminForm";

export const metadata: Metadata = { title: "Programmes" };
export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <>
      <h1 className="font-display text-[length:var(--text-h2)] text-ink">
        Programmes
      </h1>
      <p className="mt-2 max-w-2xl text-[0.975rem] text-slate">
        Only published programmes appear on the public site. Until at least one
        is published, the Programmes page shows a &ldquo;being
        finalised&rdquo; message and routes visitors to the free session.
      </p>

      <section className="mt-8 rounded-2xl border border-mist bg-white p-6">
        <h2 className="font-display font-semibold text-ink">Add a programme</h2>
        <form action={saveCourse} className="mt-5 grid gap-4 sm:grid-cols-2">
          <AdminField
            label="Title"
            name="title"
            required
            placeholder="AI Thinking Foundations"
          />
          <AdminField
            label="URL slug"
            name="slug"
            hint="Leave blank to generate from the title"
            placeholder="ai-thinking-foundations"
          />
          <AdminTextarea
            label="Summary"
            name="summary"
            rows={2}
            className="sm:col-span-2"
          />
          <AdminField label="Age from" name="age_min" type="number" defaultValue={10} />
          <AdminField label="Age to" name="age_max" type="number" defaultValue={14} />
          <AdminField
            label="Duration (weeks)"
            name="duration_weeks"
            type="number"
          />
          <AdminField
            label="Price (₹)"
            name="price_inr"
            type="number"
            hint="Leave blank for 'price on enquiry'"
          />
          <AdminField label="Sort order" name="sort_order" type="number" defaultValue={0} />
          <div className="flex items-end">
            <AdminCheckbox
              label="Published"
              name="is_published"
              hint="Visible on the public site"
            />
          </div>
          <div className="sm:col-span-2">
            <AdminSubmit>Add programme</AdminSubmit>
          </div>
        </form>
      </section>

      <h2 className="mt-10 font-display font-semibold text-ink">
        All programmes ({courses?.length ?? 0})
      </h2>

      <div className="mt-4 space-y-4">
        {courses?.length ? (
          courses.map((course) => (
            <form
              key={course.id}
              action={saveCourse}
              className="rounded-2xl border border-mist bg-white p-6"
            >
              <input type="hidden" name="id" value={course.id} />

              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="font-medium text-ink">
                  {course.title}{" "}
                  <span
                    className={
                      course.is_published
                        ? "ml-2 rounded-full bg-mist px-2 py-0.5 text-xs text-ink"
                        : "ml-2 rounded-full bg-mist/60 px-2 py-0.5 text-xs text-slate"
                    }
                  >
                    {course.is_published ? "Published" : "Draft"}
                  </span>
                </p>
                <AdminDelete id={course.id} action={deleteCourse} />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <AdminField label="Title" name="title" defaultValue={course.title} required />
                <AdminField label="URL slug" name="slug" defaultValue={course.slug} />
                <AdminTextarea
                  label="Summary"
                  name="summary"
                  rows={2}
                  defaultValue={course.summary}
                  className="sm:col-span-2"
                />
                <AdminField label="Age from" name="age_min" type="number" defaultValue={course.age_min} />
                <AdminField label="Age to" name="age_max" type="number" defaultValue={course.age_max} />
                <AdminField label="Duration (weeks)" name="duration_weeks" type="number" defaultValue={course.duration_weeks} />
                <AdminField label="Price (₹)" name="price_inr" type="number" defaultValue={course.price_inr} />
                <AdminField label="Sort order" name="sort_order" type="number" defaultValue={course.sort_order} />
                <div className="flex items-end">
                  <AdminCheckbox
                    label="Published"
                    name="is_published"
                    defaultChecked={course.is_published}
                  />
                </div>
              </div>

              <div className="mt-5">
                <AdminSubmit>Save changes</AdminSubmit>
              </div>
            </form>
          ))
        ) : (
          <p className="rounded-2xl border border-mist bg-white px-6 py-8 text-[0.975rem] text-slate">
            No programmes yet.
          </p>
        )}
      </div>
    </>
  );
}
