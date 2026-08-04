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

  // Authenticated but not an admin. Deliberately sent to the public site rather
  // than shown "access denied" — a stranger who somehow has an account learns
  // nothing about what exists here.
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    redirect("/");
  }

  return {
    id: profile.id,
    email: user.email ?? "",
    fullName: profile.full_name,
    role: profile.role,
  };
}
