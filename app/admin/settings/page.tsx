import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { saveSetting } from "../content-actions";
import { AdminField, AdminSubmit } from "@/components/admin/AdminForm";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUI";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

/**
 * Things the team changes without a deploy.
 *
 * Kept deliberately small. Anything that belongs in an environment variable —
 * API keys, the GTM container id — stays there: a secret in a database row is
 * a secret one SQL injection or one over-permissive policy away from being
 * public, and it also means the value differs between preview and production
 * with nothing to tell you.
 */
const EDITABLE = [
  {
    key: "whatsapp_number",
    label: "WhatsApp number",
    hint: "Digits only with country code, e.g. 919876543210. WhatsApp buttons stay hidden while this is empty.",
    placeholder: "919876543210",
  },
  {
    key: "contact_email",
    label: "Contact email",
    hint: "Shown on the contact page",
    placeholder: "hello@brainlit.in",
  },
] as const;

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: rows } = await supabase.from("site_settings").select("key, value");
  const current = new Map(
    (rows ?? []).map((row) => [
      row.key,
      typeof row.value === "string" ? row.value : String(row.value ?? ""),
    ]),
  );

  return (
    <>
      <AdminPageHeader
        title="Settings"
        badge={admin.role.replace("_", " ")}
        description={"Signed in as " + admin.email + "."}
      />

      <AdminCard
        accent
        title="Editable without a deploy"
        description="Changes take effect on the public site immediately."
        className="mt-6"
      >
        <div className="space-y-5">
          {EDITABLE.map((setting) => (
            <form
              key={setting.key}
              action={saveSetting}
              className="flex flex-wrap items-end gap-4"
            >
              <input type="hidden" name="key" value={setting.key} />
              <AdminField
                label={setting.label}
                name="value"
                hint={setting.hint}
                placeholder={setting.placeholder}
                defaultValue={current.get(setting.key) ?? ""}
                className="min-w-64 flex-1"
              />
              <AdminSubmit />
            </form>
          ))}
        </div>
      </AdminCard>

      <AdminCard
        title="Managed outside the admin panel"
        description="Deliberately not editable here — each one either needs a code review or is a secret that should never live in a database row."
        className="mt-4"
      >
        <ul className="space-y-2 text-sm text-slate">
          <li>
            <strong className="text-ink">Team accounts</strong> — Supabase
            dashboard, then grant the role with{" "}
            <code className="text-xs">supabase/create-admin.sql</code>
          </li>
          <li>
            <strong className="text-ink">API keys, GTM, email</strong> —
            environment variables in Vercel
          </li>
          <li>
            <strong className="text-ink">Legal pages</strong> — in code, so
            changes are reviewed and version-controlled
          </li>
        </ul>
      </AdminCard>
    </>
  );
}
