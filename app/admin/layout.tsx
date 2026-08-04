import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { AdminNav } from "@/components/admin/AdminNav";
import { signOut } from "./actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · BrainLIT admin" },
  // Belt and braces alongside the robots.txt disallow. An admin area indexed
  // by Google is an invitation.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Admin shell.
 *
 * Deliberately does NOT call requireAdmin(). Layouts do not re-run on every
 * navigation and never run for server actions, so a check here would create
 * exactly the false confidence that leads to an unguarded page later. Each page
 * and each action guards itself — see lib/admin/auth.ts.
 *
 * The login page nests under this route but renders its own screen; it is
 * excluded from the chrome by rendering children directly when there is no
 * session, which the middleware already sorted out.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-screen flex-col bg-mist/25">
      <header className="border-b border-mist bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-4">
            <Wordmark href="/admin" markClassName="h-7" />
            <span className="hidden text-xs tracking-wide text-slate uppercase sm:inline">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-slate transition-colors hover:text-violet"
            >
              View site
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-mist px-4 py-1.5 text-sm font-medium text-slate transition-colors hover:border-violet/40 hover:text-ink"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        <AdminNav />
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}
