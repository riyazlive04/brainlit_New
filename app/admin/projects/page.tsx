import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteProject, saveProject } from "../content-actions";
import {
  AdminCheckbox,
  AdminDelete,
  AdminField,
  AdminSubmit,
  AdminTextarea,
} from "@/components/admin/AdminForm";

export const metadata: Metadata = { title: "Student work" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  // Auth and data run CONCURRENTLY, not in sequence.
  //
  // Awaiting requireAdmin() first meant three serial round trips to Supabase at
  // ~250ms each before anything rendered. Firing them together removes one leg
  // of that. It is safe: if requireAdmin() redirects, the query result is simply
  // discarded, and the data is protected by RLS regardless of what this function
  // concluded — the check is not what keeps the rows private.
  const supabase = await createClient();
  const [, { data: projects }] = await Promise.all([
    requireAdmin(),
    supabase.from("student_projects").select("*").order("sort_order", { ascending: true }),
  ]);

  return (
    <>
      <h1 className="font-display text-[length:var(--text-h2)] text-ink">
        Student work
      </h1>

      <div className="mt-4 rounded-xl border border-spark-deep/40 bg-spark/15 p-4">
        <p className="text-sm leading-relaxed text-ink">
          <strong>A consent reference is required to publish.</strong> The
          database enforces it — publishing a child&apos;s work is processing a
          child&apos;s personal data, and the DPDP Act 2023 requires verifiable
          parental consent. Use a first name and age only: never a full name,
          school or photograph.
        </p>
      </div>

      <section className="mt-8 rounded-2xl border border-mist bg-white p-6">
        <h2 className="font-display font-semibold text-ink">Add a project</h2>
        <form action={saveProject} className="mt-5 grid gap-4 sm:grid-cols-2">
          <AdminField
            label="Project title"
            name="title"
            required
            className="sm:col-span-2"
            placeholder="An app that checks whether a news story is real"
          />
          <AdminTextarea
            label="What they made, and why"
            name="summary"
            rows={3}
            className="sm:col-span-2"
          />
          <AdminField
            label="Child's first name"
            name="student_first_name"
            required
            hint="First name only"
          />
          <AdminField label="Age" name="student_age" type="number" min={6} max={18} />
          <AdminField
            label="Consent reference"
            name="consent_ref"
            hint="Required to publish"
            className="sm:col-span-2"
          />
          <AdminField label="Sort order" name="sort_order" type="number" defaultValue={0} />
          <div className="flex items-end">
            <AdminCheckbox label="Published" name="is_published" />
          </div>
          <div className="sm:col-span-2">
            <AdminSubmit>Add project</AdminSubmit>
          </div>
        </form>
      </section>

      <h2 className="mt-10 font-display font-semibold text-ink">
        All projects ({projects?.length ?? 0})
      </h2>

      <div className="mt-4 space-y-4">
        {projects?.length ? (
          projects.map((project) => (
            <form
              key={project.id}
              action={saveProject}
              className="rounded-2xl border border-mist bg-white p-6"
            >
              <input type="hidden" name="id" value={project.id} />

              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="font-medium text-ink">
                  {project.title}
                  <span
                    className={
                      project.is_published
                        ? "ml-2 rounded-full bg-mist px-2 py-0.5 text-xs text-ink"
                        : "ml-2 rounded-full bg-mist/60 px-2 py-0.5 text-xs text-slate"
                    }
                  >
                    {project.is_published ? "Published" : "Draft"}
                  </span>
                </p>
                <AdminDelete id={project.id} action={deleteProject} />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <AdminField label="Project title" name="title" defaultValue={project.title} required className="sm:col-span-2" />
                <AdminTextarea label="What they made, and why" name="summary" rows={3} defaultValue={project.summary} className="sm:col-span-2" />
                <AdminField label="Child's first name" name="student_first_name" defaultValue={project.student_first_name} required />
                <AdminField label="Age" name="student_age" type="number" defaultValue={project.student_age} min={6} max={18} />
                <AdminField label="Consent reference" name="consent_ref" defaultValue={project.consent_ref} className="sm:col-span-2" />
                <AdminField label="Sort order" name="sort_order" type="number" defaultValue={project.sort_order} />
                <div className="flex items-end">
                  <AdminCheckbox label="Published" name="is_published" defaultChecked={project.is_published} />
                </div>
              </div>

              <div className="mt-5">
                <AdminSubmit>Save changes</AdminSubmit>
              </div>
            </form>
          ))
        ) : (
          <p className="rounded-2xl border border-mist bg-white px-6 py-8 text-[0.975rem] text-slate">
            None yet. The student work section stays hidden until one is
            published.
          </p>
        )}
      </div>
    </>
  );
}
