import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { formatSessionDate, formatSessionTime } from "@/lib/webinar";
import { initials, relativeTime, statusStyle } from "@/lib/admin/format";

/** Never cached: an admin looking at lead counts must see the real number. */
export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const supabase = await createClient();

  // The auth check joins the same Promise.all as the counts. Awaiting it first
  // added a serial ~250ms round trip before any query even started.
  // ALL SIX round trips fire together — the auth check, three counts, the next
  // session and the recent leads. Sequentially that was six waits of ~250ms
  // stacked up; concurrently the page costs roughly one.
  const [
    admin,
    { count: totalLeads },
    { count: newLeads },
    { count: enrolled },
    { data: nextSession },
    { data: recent },
  ] = await Promise.all([
    requireAdmin(),
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "enrolled"),
    supabase
      .from("webinar_sessions")
      .select("id, title, starts_at")
      .eq("is_active", true)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("leads")
      .select("id, name, email, child_age, source, status, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const stats = [
    {
      label: "Total leads",
      value: totalLeads ?? 0,
      note: "all time",
      href: "/admin/leads",
      accent: "bg-brand-gradient",
    },
    {
      label: "Waiting to be contacted",
      value: newLeads ?? 0,
      note: (newLeads ?? 0) > 0 ? "needs a call" : "all followed up",
      href: "/admin/leads?status=new",
      accent: (newLeads ?? 0) > 0 ? "bg-spark-deep" : "bg-mist",
    },
    {
      label: "Enrolled",
      value: enrolled ?? 0,
      note: "converted",
      href: "/admin/leads?status=enrolled",
      accent: "bg-violet",
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[length:var(--text-h2)] text-ink">
            {admin.fullName ? `Hello, ${admin.fullName}` : "Overview"}
          </h1>
          <p className="mt-1 text-sm text-slate">
            Everything that needs your attention, in one place.
          </p>
        </div>
        <span className="rounded-full bg-mist px-3 py-1 text-xs font-medium tracking-wide text-slate uppercase">
          {admin.role.replace("_", " ")}
        </span>
      </div>

      <ul className="mt-7 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <li key={stat.label}>
            <Link
              href={stat.href}
              // The accent bar carries the meaning at a glance, so the numbers
              // do not all read as equally important.
              className="group block overflow-hidden rounded-2xl border border-mist bg-white transition-[border-color,box-shadow] hover:border-violet/40 hover:shadow-[0_1px_0_0_rgba(11,16,32,0.04)]"
            >
              <span className={`block h-1 w-full ${stat.accent}`} />
              <span className="block p-5">
                <span className="block text-sm text-slate">{stat.label}</span>
                <span className="mt-1.5 flex items-baseline gap-2">
                  <span className="font-display text-4xl leading-none font-bold text-ink">
                    {stat.value}
                  </span>
                  <span className="text-xs text-slate">{stat.note}</span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Styled as an alert when it is one. No upcoming session means the
          landing page paid traffic arrives on is showing no date — that is a
          broken funnel, not a neutral status line. */}
      <div
        className={`mt-4 rounded-2xl border p-5 ${
          nextSession
            ? "border-mist bg-white"
            : "border-spark-deep/40 bg-spark/15"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <span
              aria-hidden="true"
              className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${
                nextSession ? "bg-mist text-slate" : "bg-spark text-ink"
              }`}
            >
              {nextSession ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M8 3v4M16 3v4M3 11h18" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M12 8v5M12 17h.01" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              )}
            </span>

            <div>
              <h2 className="font-display font-semibold text-ink">
                {nextSession ? "Next webinar" : "No upcoming webinar"}
              </h2>
              <p className="mt-1 text-[0.925rem] leading-relaxed text-slate">
                {nextSession ? (
                  <>
                    <span className="font-medium text-ink">
                      {nextSession.title}
                    </span>{" "}
                    — {formatSessionDate(nextSession.starts_at)} at{" "}
                    {formatSessionTime(nextSession.starts_at)} IST
                  </>
                ) : (
                  "The webinar page is showing no date to visitors. Anyone arriving from an ad sees a form with nothing to register for."
                )}
              </p>
            </div>
          </div>

          <Link
            href="/admin/sessions"
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              nextSession
                ? "border border-mist text-slate hover:border-violet/40 hover:text-ink"
                : "bg-ink text-white hover:bg-ink-soft"
            }`}
          >
            {nextSession ? "Manage" : "Schedule one"}
          </Link>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-mist bg-white">
        <div className="flex items-center justify-between border-b border-mist px-5 py-4">
          <h2 className="font-display font-semibold text-ink">Latest leads</h2>
          <Link
            href="/admin/leads"
            className="text-sm font-medium text-violet hover:underline"
          >
            See all
          </Link>
        </div>

        {recent && recent.length > 0 ? (
          <ul className="divide-y divide-mist">
            {recent.map((lead) => (
              <li key={lead.id}>
                <Link
                  href="/admin/leads"
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-mist/40"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-gradient text-xs font-semibold text-white"
                  >
                    {initials(lead.name)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">
                      {lead.name}
                    </span>
                    <span className="block truncate text-sm text-slate">
                      {lead.email}
                      {lead.child_age ? ` · age ${lead.child_age}` : ""} ·{" "}
                      {lead.source}
                    </span>
                  </span>

                  <span
                    className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize sm:inline ${statusStyle(lead.status)}`}
                  >
                    {lead.status}
                  </span>

                  <span className="hidden shrink-0 text-xs text-slate md:inline">
                    {relativeTime(lead.created_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 py-10 text-center">
            <p className="text-[0.975rem] text-slate">
              No leads yet. They appear here the moment someone registers.
            </p>
            <Link
              href="/webinar"
              className="mt-2 inline-block text-sm font-medium text-violet hover:underline"
            >
              View the registration page
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
