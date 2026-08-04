import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

/**
 * Cookie-free Supabase client for reading PUBLIC content on the server.
 *
 * The cookie-bound client in `server.ts` calls `cookies()`, which opts the
 * calling route into dynamic rendering. That is correct for anything
 * session-dependent and wrong for anything cached.
 *
 * It bit us on /webinar: the page declares `revalidate = 3600`, so Next tried
 * to prerender it, `cookies()` threw a dynamic-usage error during the build,
 * and the surrounding try/catch dutifully swallowed it and returned null. The
 * page rendered — with no session date, permanently, no matter what was in the
 * database. A caught error that produces plausible-looking output is the worst
 * kind.
 *
 * This client reads with the anon key and no session, so ISR works and the
 * next session actually appears. Still fully bound by row level security.
 */
export function createPublicClient() {
  return createClient(requireEnv("supabaseUrl"), requireEnv("supabaseAnonKey"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
