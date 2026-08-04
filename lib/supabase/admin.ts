import "server-only";

import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

/**
 * Service-role Supabase client. BYPASSES ROW LEVEL SECURITY ENTIRELY.
 *
 * The `server-only` import above is load-bearing: it makes the build fail if
 * this module is ever pulled into a client bundle, which would ship a key that
 * grants full read/write on the parent lead database to every visitor.
 *
 * Only legitimate use in Phase 1: writing leads and webinar registrations from
 * `/api` route handlers, where anon has INSERT but no SELECT.
 */
export function createAdminClient() {
  return createClient(
    requireEnv("supabaseUrl"),
    requireEnv("supabaseServiceRoleKey"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
