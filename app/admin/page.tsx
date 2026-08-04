import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { formatSessionDate, formatSessionTime } from "@/lib/webinar";

/** Never cached: an admin looking at lead counts must see the real number. */
export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const [{ count: totalLeads }, { count: newLeads }, { count: enrolled }] =
    await Promise.all([
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "new"),
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "enrolled"),
    ]);

  const { data: nextSession } = await supabase
    .from("webinar_sessions")
    .select("id, title, starts_at")
    .eq("is_active", true)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: recent } = await supabase
    .from("leads")
    .select("id, name, email, child_age, source, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    { label: "Total leads", value: totalLeads ?? 0, href: "/admin/leads" },
    { label: "Not yet contacted", value: newLeads ?? 0, href: "/admin/leads" },
    { label: "Enrolled", value: enrolled ?? 0, href: "/admin/leads" },
  ];

  return (
    <>
      <h1 className="font-display text-[length:var(--text-h2)] text-ink">
        {admin.fullName ? `Hello, ${admin.fullName}` : "Overview"}
      </h1>

      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <li key={stat.label}>
            <Link
              href={stat.href}
              className="block rounded-2xl border border-mist bg-white p-6 transition-colors hover:border-violet/40"
            >
              <p className="text-sm text-slate">{stat.label}</p>
              <p className="mt-2 font-display text-3xl font-bold text-ink">
                {stat.value}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {/* The single most consequential thing on this screen. With no upcoming
          session the public landing page shows no date at all, and that is not
          visible from anywhere else in the admin. */}
      <div className="mt-6 rounded-2xl border border-mist bg-white p-6">
        <h2 className="font-display font-semibold text-ink">Next webinar</h2>
        {nextSession ? (
          <p className="mt-2 text-[0.975rem] text-slate">
            <span className="font-medium text-ink">{nextSession.title}</span> —{" "}
            {formatSessionDate(nextSession.starts_at)} at{" "}
            {formatSessionTime(nextSession.starts_at)} IST
          </p>
        ) : (
          <p className="mt-2 text-[0.975rem] text-slate">
            No upcoming session scheduled.{" "}
            <span className="text-ink">
              The webinar page is showing no date to visitors.
            </span>{" "}
            <Link href="/admin/sessions" className="text-violet underline">
              Schedule one
            </Link>
            .
          </p>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-mist bg-white">
        <div className="flex items-center justify-between border-b border-mist px-6 py-4">
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
              <li
                key={lead.id}
                className="flex flex-wrap items-baseline justify-between gap-2 px-6 py-3.5"
              >
                <span className="font-medium text-ink">{lead.name}</span>
                <span className="text-sm text-slate">
                  {lead.email}
                  {lead.child_age ? ` · age ${lead.child_age}` : ""} ·{" "}
                  {lead.source}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 py-6 text-[0.975rem] text-slate">
            No leads yet. They appear here the moment someone registers.
          </p>
        )}
      </div>
    </>
  );
}
