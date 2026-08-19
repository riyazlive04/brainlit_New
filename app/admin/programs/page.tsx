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
import {
  AdminCard,
  AdminEmpty,
  AdminPageHeader,
  AdminRecord,
  AdminSectionHeading,
} from "@/components/admin/AdminUI";
import { ImageUpload } from "@/components/admin/ImageUpload";

export const metadata: Metadata = { title: "Programmes" };
export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  // Auth and data run CONCURRENTLY, not in sequence.
  //
  // Awaiting requireAdmin() first meant three serial round trips to Supabase at
  // ~250ms each before anything rendered. Firing them together removes one leg
  // of that. It is safe: if requireAdmin() redirects, the query result is simply
  // discarded, and the data is protected by RLS regardless of what this function
  // concluded — the check is not what keeps the rows private.
  const supabase = await createClient();
  const [, { data: courses }] = await Promise.all([
    requireAdmin(),
    supabase.from("courses").select("*").order("sort_order", { ascending: true }),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Programmes"
        description="Only live programmes appear on the public site. Until one is live, the Programmes page shows a “being finalised” message and routes visitors to the free session."
      />

      <AdminCard
        accent
        title="Add a programme"
        description="Leave the price blank for “price on enquiry”."
        className="mt-6"
      >
        <form action={saveCourse} className="grid gap-4 sm:grid-cols-2">
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
          {/* Two descriptions, and the hints say which is which. They were one
              undifferentiated "Summary" box, and `hero_copy` — in the schema
              since 0001 — had no field at all, so every programme has carried a
              null one and the detail page has had nothing to open with. */}
          <AdminTextarea
            label="Summary"
            name="summary"
            rows={2}
            hint="One or two sentences. This is what the card on /courses shows."
            className="sm:col-span-2"
          />
          <AdminTextarea
            label="Full description"
            name="hero_copy"
            rows={5}
            hint="The longer version, for the programme's own page. What the weeks build, and what a child leaves holding."
            className="sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <ImageUpload
              name="image_path"
              bucket="course-images"
              label="Programme photo"
              hint="JPEG, PNG, WebP or AVIF, up to 8 MB. Landscape works best - it is shown as a 16:9 crop. If a child is identifiable you need recorded parental consent before publishing; a worktable, a screen or a whiteboard needs none."
            />
          </div>
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
      </AdminCard>

      <AdminSectionHeading count={courses?.length ?? 0}>
        All programmes
      </AdminSectionHeading>

      <div className="space-y-4">
        {courses?.length ? (
          courses.map((course) => (
            <form key={course.id} action={saveCourse}>
              <input type="hidden" name="id" value={course.id} />
              <AdminRecord
                heading={course.title}
                meta={`/courses/${course.slug} · ages ${course.age_min}-${course.age_max}`}
                published={course.is_published}
                actions={<AdminDelete action={deleteCourse} />}
              >
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label="Title" name="title" defaultValue={course.title} required />
                <AdminField label="URL slug" name="slug" defaultValue={course.slug} />
                <AdminTextarea
                  label="Summary"
                  name="summary"
                  rows={2}
                  defaultValue={course.summary}
                  hint="One or two sentences. This is what the card on /courses shows."
                  className="sm:col-span-2"
                />
                <AdminTextarea
                  label="Full description"
                  name="hero_copy"
                  rows={5}
                  defaultValue={course.hero_copy}
                  hint="The longer version, for the programme's own page."
                  className="sm:col-span-2"
                />
                <div className="sm:col-span-2">
                  <ImageUpload
                    name="image_path"
                    defaultPath={course.image_path}
                    bucket="course-images"
                    label="Programme photo"
                    hint="JPEG, PNG, WebP or AVIF, up to 8 MB. Landscape works best - it is shown as a 16:9 crop. If a child is identifiable you need recorded parental consent before publishing; a worktable, a screen or a whiteboard needs none."
                  />
                </div>
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
              </AdminRecord>
            </form>
          ))
        ) : (
          <AdminEmpty
            title="No programmes yet"
            description="Add one above. It stays hidden until you mark it live, so you can draft it first."
          />
        )}
      </div>
    </>
  );
}
