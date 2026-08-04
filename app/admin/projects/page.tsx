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
import {
  AdminCard,
  AdminEmpty,
  AdminNotice,
  AdminPageHeader,
  AdminRecord,
  AdminSectionHeading,
} from "@/components/admin/AdminUI";


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
      <AdminPageHeader
        title="Student work"
        description="Proof that the teaching works, in the children's own output. Appears on the homepage once at least one project is live."
      />

      <div className="mt-6">
        <AdminNotice tone="warn">
          <strong>A consent reference is required to publish.</strong> The
          database enforces it — publishing a child&apos;s work is processing
          their personal data, and the DPDP Act 2023 requires verifiable
          parental consent. First name and age only: never a full name, school
          or photograph.
        </AdminNotice>
      </div>

      <AdminCard accent title="Add a project" className="mt-6">
        <form action={saveProject} className="grid gap-4 sm:grid-cols-2">
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
      </AdminCard>

      <AdminSectionHeading count={projects?.length ?? 0}>
        All projects
      </AdminSectionHeading>

      <div className="space-y-4">
        {projects?.length ? (
          projects.map((project) => (
            <form key={project.id} action={saveProject}>
              <input type="hidden" name="id" value={project.id} />
              <AdminRecord
                heading={project.title}
                meta={
                  [
                    project.student_first_name,
                    project.student_age ? "age " + project.student_age : null,
                    project.consent_ref ? null : "no consent on file",
                  ]
                    .filter(Boolean)
                    .join(" · ")
                }
                published={project.is_published}
                actions={<AdminDelete id={project.id} action={deleteProject} />}
              >
              <div className="grid gap-4 sm:grid-cols-2">
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
              </AdminRecord>
            </form>
          ))
        ) : (
          <AdminEmpty
            title="No student work yet"
            description="The section stays hidden on the homepage until one project is live."
          />
        )}
      </div>
    </>
  );
}
