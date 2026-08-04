import { createBrowserClient } from "@supabase/ssr";
import { env, requireEnv } from "@/lib/env";

/**
 * Browser Supabase client. Uses the anon key, which is public by design —
 * every table it can reach is protected by row level security.
 *
 * Note: public form submissions do NOT go through this client. They post to
 * `/api/*` route handlers so the server can rate-limit, strip honeypot fields
 * and attribute UTM parameters that a client could otherwise forge.
 */
export function createClient() {
  return createBrowserClient(
    requireEnv("supabaseUrl"),
    requireEnv("supabaseAnonKey"),
  );
}

export { env };
