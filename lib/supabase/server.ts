import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { requireEnv } from "@/lib/env";

/**
 * Server-side Supabase client scoped to the current request's session.
 * Use this for reading published content and, in Phase 2, for the admin panel.
 *
 * Still bound by row level security — it holds the anon key plus whatever
 * session the user actually has.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnv("supabaseUrl"),
    requireEnv("supabaseAnonKey"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Session refresh is handled in middleware instead; ignoring this
            // is the documented pattern, not a silent failure.
          }
        },
      },
    },
  );
}
