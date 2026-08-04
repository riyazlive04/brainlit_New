import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Wordmark } from "@/components/brand/Wordmark";
import { signOut } from "../actions";

export const metadata: Metadata = {
  title: "No access",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * Shown when someone is signed in but has no admin role.
 *
 * This replaced a silent redirect to the homepage. That was defensible as
 * security — it tells a stranger nothing about what exists here — but it was
 * indistinguishable from a bug: you click /admin, land on the marketing site,
 * and there is nothing anywhere to say why.
 *
 * The compromise: say only that THIS account lacks access, which the person is
 * already entitled to know because they are signed in as it. Nothing is
 * revealed about who does have access.
 *
 * Deliberately NOT calling requireAdmin() — it would redirect here, from here,
 * forever.
 */
export default async function NoAccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center">
      <div className="rounded-2xl border border-mist bg-white p-8">
        <Wordmark href={null} markClassName="h-8" />

        <h1 className="mt-7 font-display text-[length:var(--text-h3)] text-ink">
          This account has no admin access
        </h1>

        <p className="mt-3 text-[0.975rem] leading-relaxed text-slate">
          You are signed in
          {user?.email ? (
            <>
              {" as "}
              <span className="font-medium text-ink">{user.email}</span>
            </>
          ) : null}
          , but this account has not been granted a role.
        </p>

        <div className="mt-6 rounded-xl border border-mist bg-mist/30 p-4">
          <p className="text-sm leading-relaxed text-slate">
            Creating the login and granting the role are two separate steps, on
            purpose — an account is never an administrator just because it
            exists. Whoever set this up needs to run{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-xs">
              supabase/create-admin.sql
            </code>{" "}
            with this email address.
          </p>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <form action={signOut}>
            <button
              type="submit"
              className="min-h-10 rounded-full bg-brand-gradient px-6 py-2 text-sm font-semibold text-white transition-[filter] hover:brightness-110"
            >
              Sign out
            </button>
          </form>
          <Link
            href="/"
            className="text-sm text-slate transition-colors hover:text-violet"
          >
            Back to the site
          </Link>
        </div>
      </div>
    </div>
  );
}
