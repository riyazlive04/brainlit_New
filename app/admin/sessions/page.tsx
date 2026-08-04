import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteSession, saveSession } from "../content-actions";
import {
  AdminCheckbox,
  AdminDelete,
  AdminField,
  AdminSubmit,
} from "@/components/admin/AdminForm";
import { formatSessionDate, formatSessionTime } from "@/lib/webinar";
import {
  AdminCard,
  AdminEmpty,
  AdminNotice,
  AdminPageHeader,
  AdminRecord,
  AdminSectionHeading,
} from "@/components/admin/AdminUI";


export const metadata: Metadata = { title: "Webinars" };
export const dynamic = "force-dynamic";

/**
 * Renders an ISO instant back into the value a datetime-local input expects,
 * in IST — the mirror of istToIso in content-actions. Without this, editing a
 * session would show its UTC time and re-save it shifted by 5½ hours.
 */
function isoToIstLocal(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export default async function SessionsPage() {
  // Auth and data run CONCURRENTLY, not in sequence.
  //
  // Awaiting requireAdmin() first meant three serial round trips to Supabase at
  // ~250ms each before anything rendered. Firing them together removes one leg
  // of that. It is safe: if requireAdmin() redirects, the query result is simply
  // discarded, and the data is protected by RLS regardless of what this function
  // concluded — the check is not what keeps the rows private.
  const supabase = await createClient();
  const [, { data: sessions }] = await Promise.all([
    requireAdmin(),
    supabase
      .from("webinar_sessions")
      .select("*")
      .order("starts_at", { ascending: false }),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Webinars"
        badge={sessions?.length ? undefined : "none scheduled"}
        description="The soonest active session in the future is the one shown on the public webinar page. If there is none, that page shows no date at all."
      />

      {!sessions?.length && (
        <div className="mt-6">
          <AdminNotice tone="warn">
            Nothing is scheduled, so anyone arriving from an ad sees a
            registration form with no date attached.
          </AdminNotice>
        </div>
      )}

      <AdminCard
        accent
        title="Schedule a session"
        description="Times are Indian Standard Time. The Zoom link is emailed to registrants and never rendered on the site."
        className="mt-6"
      >
        <form action={saveSession} className="grid gap-4 sm:grid-cols-2">
          <AdminField
            label="Title"
            name="title"
            required
            placeholder="Free parent session: thinking before AI"
            className="sm:col-span-2"
          />
          <AdminField
            label="Starts at"
            name="starts_at"
            type="datetime-local"
            required
            hint="Indian Standard Time"
          />
          <AdminField
            label="Duration (minutes)"
            name="duration_minutes"
            type="number"
            defaultValue={60}
            min={10}
          />
          <AdminField
            label="Zoom join link"
            name="zoom_url"
            type="url"
            hint="Sent by email only. Never shown on the site."
            className="sm:col-span-2"
          />
          <AdminField
            label="Capacity"
            name="capacity"
            type="number"
            hint="Optional"
          />
          <div className="flex items-end">
            <AdminCheckbox
              label="Active"
              name="is_active"
              defaultChecked
              hint="Only active sessions are shown"
            />
          </div>
          <div className="sm:col-span-2">
            <AdminSubmit>Schedule</AdminSubmit>
          </div>
        </form>
      </AdminCard>

      <AdminSectionHeading count={sessions?.length ?? 0}>
        Scheduled
      </AdminSectionHeading>

      <div className="space-y-4">
        {sessions?.length ? (
          sessions.map((session) => (
            <form key={session.id} action={saveSession}>
              <input type="hidden" name="id" value={session.id} />
              <AdminRecord
                heading={session.title}
                meta={`${formatSessionDate(session.starts_at)} · ${formatSessionTime(session.starts_at)} IST`}
                published={session.is_active}
                actions={<AdminDelete id={session.id} action={deleteSession} />}
              >
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField
                  label="Title"
                  name="title"
                  defaultValue={session.title}
                  required
                  className="sm:col-span-2"
                />
                <AdminField
                  label="Starts at (IST)"
                  name="starts_at"
                  type="datetime-local"
                  defaultValue={isoToIstLocal(session.starts_at)}
                  required
                />
                <AdminField
                  label="Duration (minutes)"
                  name="duration_minutes"
                  type="number"
                  defaultValue={session.duration_minutes}
                />
                <AdminField
                  label="Zoom join link"
                  name="zoom_url"
                  type="url"
                  defaultValue={session.zoom_url}
                  className="sm:col-span-2"
                />
                <AdminField
                  label="Capacity"
                  name="capacity"
                  type="number"
                  defaultValue={session.capacity}
                />
                <div className="flex items-end">
                  <AdminCheckbox
                    label="Active"
                    name="is_active"
                    defaultChecked={session.is_active}
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
            title="No sessions scheduled"
            description="Add one above and the public webinar page starts showing a real date and time."
          />
        )}
      </div>
    </>
  );
}
