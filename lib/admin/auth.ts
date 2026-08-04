import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminProfile = {
  id: string;
  email: string;
  fullName: string | null;
  role: "super_admin" | "admin";
};

/**
 * Confirms the caller is a signed-in admin, or sends them away.
 *
 * Called at the top of every admin page and every server action — not once in
 * a layout. Layouts do not re-run for every navigation, and a server action is
 * a public HTTP endpoint that can be invoked directly regardless of what the
 * page around it rendered. "The layout checked it" is not a guarantee about
 * the action.
 *
 * This is the second of three independent gates. Middleware redirects
 * unauthenticated requests, this verifies the role, and RLS refuses at the
 * database no matter what either of them concluded. Any one of them failing
 * leaves the other two standing.
 */
export async function requireAdmin(): Promise<AdminProfile> {
  const supabase = await createClient();

  // getUser() verifies with the auth server; getSession() would only decode
  // whatever cookie was presented.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  // Authenticated, but with no role.
  //
  // This used to redirect to the homepage. Silent, and indistinguishable from a
  // bug: you click /admin, land on the marketing site, and nothing anywhere
  // says why. It cost real debugging time the first time it happened.
  //
  // /admin/no-access explains it and offers a way out. It does not call this
  // function, which would send it to itself forever.
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    console.warn(
      `[admin] ${user.email ?? user.id} is signed in but has no profile row — run supabase/create-admin.sql`,
    );
    redirect("/admin/no-access");
  }

  return {
    id: profile.id,
    email: user.email ?? "",
    fullName: profile.full_name,
    role: profile.role,
  };
}
