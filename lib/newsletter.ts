import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { LeadStoreUnavailableError } from "@/lib/leads";
import type { NewsletterInput } from "@/lib/schemas";

/**
 * Newsletter subscriptions.
 *
 * Writes go through the service role from the server. `anon` has no policy on
 * `newsletter_subscribers` at all — if the browser could write directly, the
 * publishable key could also be used to enumerate the list.
 */

export type SubscribeResult = {
  /** True when the address was already on the list — not an error. */
  alreadySubscribed: boolean;
};

export async function subscribeToNewsletter(
  input: NewsletterInput,
): Promise<SubscribeResult> {
  if (!isSupabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new LeadStoreUnavailableError();
  }

  const supabase = createAdminClient();
  const email = input.email.trim();

  // Case-insensitive, matching the unique index. Without this a re-subscribe
  // from "Priya@…" would hit the constraint and surface as a 500.
  const { data: existing, error: lookupError } = await supabase
    .from("newsletter_subscribers")
    .select("id, unsubscribed_at")
    .ilike("email", email)
    .maybeSingle();

  if (lookupError) throw lookupError;

  if (existing) {
    // Someone who left and came back is re-subscribing, not signing up fresh.
    // Clearing the timestamp restores delivery; consent_at is deliberately left
    // at the original date, because that is when consent was actually given.
    if (existing.unsubscribed_at) {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({ unsubscribed_at: null })
        .eq("id", existing.id);
      if (error) throw error;
      return { alreadySubscribed: false };
    }

    return { alreadySubscribed: true };
  }

  const { error } = await supabase.from("newsletter_subscribers").insert({
    email,
    source: input.source,
    utm_source: input.utm_source ?? null,
    utm_medium: input.utm_medium ?? null,
    utm_campaign: input.utm_campaign ?? null,
  });

  if (error) throw error;
  return { alreadySubscribed: false };
}
