"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";

export type ActionState = { error?: string } | null;

/**
 * Sign in.
 *
 * Returns a single generic message for every failure — wrong password, unknown
 * address, disabled account. Distinguishing them turns the form into an oracle
 * for which email addresses have accounts on this project.
 */
export async function signIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Those details did not work. Please try again." };
  }

  // Only allow redirecting within this site. An open redirect on a login form
  // is a phishing primitive: a link that logs someone in and lands them on an
  // attacker's page still wearing our domain in the address bar a moment ago.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/admin";

  redirect(safeNext);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/** Moves a lead through the funnel from the inbox. */
export async function updateLeadStatus(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  const allowed = ["new", "contacted", "registered", "enrolled", "lost"];
  if (!id || !allowed.includes(status)) return;

  const supabase = await createClient();
  // Writes go through the admin's OWN session, not the service role, so RLS
  // is the thing granting this — not a key that bypasses it.
  await supabase.from("leads").update({ status }).eq("id", id);

  revalidatePath("/admin/leads");
}
