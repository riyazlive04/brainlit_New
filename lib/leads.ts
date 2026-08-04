import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import type { LeadInput } from "@/lib/schemas";

/**
 * Lead persistence.
 *
 * Writes go through the service role from the server, never from the browser.
 * `anon` has no policy on `leads` at all — see supabase/migrations/0001_init.sql.
 * If the browser could write directly it could also forge attribution, and a
 * misconfigured policy would expose the whole parent list.
 */

export type LeadRecord = { id: string; email: string };

export class LeadStoreUnavailableError extends Error {
  constructor() {
    super("Supabase is not configured");
    this.name = "LeadStoreUnavailableError";
  }
}

function assertConfigured() {
  if (!isSupabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new LeadStoreUnavailableError();
  }
}

/**
 * Finds an existing lead by email, most recent first.
 *
 * Email is compared case-insensitively — parents type "Priya@…" and "priya@…"
 * interchangeably, and treating those as two people means two confirmation
 * emails and a duplicate in the follow-up list.
 */
async function findLeadByEmail(email: string): Promise<LeadRecord | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("leads")
    .select("id, email")
    .ilike("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createLead(input: LeadInput): Promise<LeadRecord> {
  assertConfigured();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: input.name,
      email: input.email.trim(),
      phone: input.phone,
      // DPDP Act 2023: the parent is the data subject. Only a child's first
      // name and age are stored — never contact details for a minor.
      child_name: input.childName ?? null,
      child_age: input.childAge ?? null,
      message: input.message ?? null,
      source: input.source,
      utm_source: input.utm_source ?? null,
      utm_medium: input.utm_medium ?? null,
      utm_campaign: input.utm_campaign ?? null,
      utm_content: input.utm_content ?? null,
    })
    .select("id, email")
    .single();

  if (error) throw error;
  return data;
}

export type RegistrationResult = {
  leadId: string;
  /** True when this exact registration already existed */
  alreadyRegistered: boolean;
};

/**
 * Registers a parent for a webinar session, idempotently.
 *
 * A parent who submits twice — impatient double-click, or coming back a week
 * later — must not produce two leads, two seats and two reminder emails. The
 * unique constraint on (session_id, lead_id) is the backstop; this is the
 * graceful path in front of it.
 */
export async function registerForWebinar(
  input: LeadInput,
  sessionId: string | null,
): Promise<RegistrationResult> {
  assertConfigured();
  const supabase = createAdminClient();

  const existing = await findLeadByEmail(input.email.trim());

  if (existing && sessionId) {
    const { data: priorRegistration, error } = await supabase
      .from("webinar_registrations")
      .select("id")
      .eq("lead_id", existing.id)
      .eq("session_id", sessionId)
      .maybeSingle();

    if (error) throw error;

    if (priorRegistration) {
      return { leadId: existing.id, alreadyRegistered: true };
    }
  }

  const lead = existing ?? (await createLead(input));

  const { error: registrationError } = await supabase
    .from("webinar_registrations")
    .insert({ lead_id: lead.id, session_id: sessionId });

  if (registrationError) throw registrationError;

  // Move an existing lead forward in the funnel; a repeat visitor who registers
  // should not still read as "new" in the follow-up list.
  await supabase
    .from("leads")
    .update({ status: "registered" })
    .eq("id", lead.id)
    .eq("status", "new");

  return { leadId: lead.id, alreadyRegistered: false };
}
