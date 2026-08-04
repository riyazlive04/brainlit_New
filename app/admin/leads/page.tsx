import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { LeadStatusSelect } from "@/components/admin/LeadStatusSelect";
import { toInternational } from "@/lib/phone";
import { initials, relativeTime } from "@/lib/admin/format";
import { AdminEmpty, AdminPageHeader } from "@/components/admin/AdminUI";

export const metadata: Metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

const STATUSES = [
  "all",
  "new",
  "contacted",
  "registered",
  "enrolled",
  "lost",
] as const;

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

export default async function LeadsPage({
  searchParams,
}: PageProps<"/admin/leads">) {
  const params = await searchParams;
  const raw = params?.status;
  const status = typeof raw === "string" ? raw : "all";

  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select(
      "id, name, email, phone, child_name, child_age, message, source, status, utm_source, utm_campaign, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status !== "all" && STATUSES.includes(status as (typeof STATUSES)[number])) {
    query = query.eq("status", status);
  }

  // Auth and data concurrently — see the note in the sessions page. RLS is what
  // keeps these rows private, not the ordering of these two awaits.
  const [, { data: leads, error }] = await Promise.all([requireAdmin(), query]);

  return (
    <>
      <AdminPageHeader
        title="Leads"
        badge={
          leads?.length === 200
            ? "most recent 200"
            : (leads?.length ?? 0) + " shown"
        }
        description="Every enquiry and registration, newest first. Tap a phone number to open WhatsApp — the fastest way this team actually reaches a parent."
      />

      <nav aria-label="Filter by status" className="mt-6 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <a
            key={s}
            href={s === "all" ? "/admin/leads" : `/admin/leads?status=${s}`}
            aria-current={status === s ? "page" : undefined}
            className={
              status === s
                ? "rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-white capitalize"
                : "rounded-full border border-mist bg-white px-4 py-1.5 text-sm text-slate capitalize transition-colors hover:border-violet/40 hover:text-ink"
            }
          >
            {s}
          </a>
        ))}
      </nav>

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load leads. {error.message}
        </p>
      )}

      {leads && leads.length === 0 ? (
        <div className="mt-6">
          <AdminEmpty
            title={status === "all" ? "No leads yet" : "Nothing at this stage"}
            description={
              status === "all"
                ? "They appear here the moment someone registers or sends an enquiry."
                : "Try another filter, or clear it to see everything."
            }
          />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-mist bg-white">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead>
              <tr className="border-b border-mist bg-mist/25 text-xs tracking-wide text-slate uppercase">
                <th className="px-5 py-3 font-medium">Parent</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Child</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {leads?.map((lead) => (
                <tr key={lead.id} className="align-top transition-colors hover:bg-mist/25">
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-brand-gradient text-[0.7rem] font-semibold text-white"
                      >
                        {initials(lead.name)}
                      </span>
                      <div>
                        <span className="font-medium text-ink">{lead.name}</span>
                        {lead.message && (
                          <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate">
                            {lead.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <a
                      href={`mailto:${lead.email}`}
                      className="block text-violet hover:underline"
                    >
                      {lead.email}
                    </a>
                    {/* Straight into WhatsApp — the fastest way this team
                        actually reaches a parent. */}
                    <a
                      href={`https://wa.me/${toInternational(lead.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block text-slate hover:text-violet"
                    >
                      +91 {lead.phone}
                    </a>
                  </td>
                  <td className="px-5 py-4 text-slate">
                    {lead.child_name ?? "—"}
                    {lead.child_age ? ` (${lead.child_age})` : ""}
                  </td>
                  <td className="px-5 py-4 text-slate">
                    {lead.source}
                    {lead.utm_source && (
                      <p className="mt-0.5 text-xs">
                        {lead.utm_source}
                        {lead.utm_campaign ? ` / ${lead.utm_campaign}` : ""}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="block text-ink">
                      {relativeTime(lead.created_at)}
                    </span>
                    <span className="block text-xs text-slate">
                      {formatWhen(lead.created_at)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <LeadStatusSelect id={lead.id} status={lead.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
