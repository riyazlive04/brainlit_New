import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { saveSetting } from "../content-actions";
import { AdminField, AdminSubmit } from "@/components/admin/AdminForm";

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
      <h1 className="font-display text-[length:var(--text-h2)] text-ink">
        Settings
      </h1>
      <p className="mt-2 text-[0.975rem] text-slate">
        Signed in as {admin.email} ({admin.role.replace("_", " ")}).
      </p>

      <div className="mt-8 space-y-4">
        {EDITABLE.map((setting) => (
          <form
            key={setting.key}
            action={saveSetting}
            className="flex flex-wrap items-end gap-4 rounded-2xl border border-mist bg-white p-6"
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

      <div className="mt-10 rounded-2xl border border-mist bg-white p-6">
        <h2 className="font-display font-semibold text-ink">
          Managed outside the admin panel
        </h2>
        <ul className="mt-3 space-y-1.5 text-sm text-slate">
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
      </div>
    </>
  );
}
