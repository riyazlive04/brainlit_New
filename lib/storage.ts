import { env } from "@/lib/env";

/**
 * Builds a public URL for an object in a public Supabase Storage bucket.
 *
 * Constructed rather than fetched. The SDK's getPublicUrl() does the same
 * string concatenation, but calling it would mean instantiating a Supabase
 * client inside a Server Component purely to format a URL — a needless import
 * on a page that otherwise needs none.
 *
 * Returns null for a missing path so callers can decide what to render, rather
 * than emitting a broken source attribute.
 */
export function publicStorageUrl(
  bucket: string,
  path: string | null | undefined,
): string | null {
  if (!path || !env.supabaseUrl) return null;

  // Paths are generated with crypto.randomUUID(), but encoding each segment
  // keeps this correct if a future upload path ever contains spaces.
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${env.supabaseUrl}/storage/v1/object/public/${bucket}/${encoded}`;
}
