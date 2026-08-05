/**
 * Environment access.
 *
 * Values are read lazily and validated at the point of use rather than at module
 * load. A build must not fail simply because Supabase credentials are not yet
 * provisioned — but a request that genuinely needs them must fail loudly and
 * with a message that says which variable is missing.
 */

export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  /** Server-only. Never referenced from a client component. */
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
} as const;

/** True when the public Supabase credentials are present. */
export const isSupabaseConfigured =
  Boolean(env.supabaseUrl) && Boolean(env.supabaseAnonKey);

export function requireEnv(name: keyof typeof env): string {
  const value = env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable for "${name}". ` +
        `Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}
