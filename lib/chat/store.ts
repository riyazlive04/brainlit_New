import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { sendBranchMessage, type WhatsAppResult } from "@/lib/whatsapp";
import type { ChatState, LeadIntent } from "@/lib/chat/flow";

/**
 * Writing a captured chat lead, and messaging them.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE ROW IS WRITTEN BEFORE THE MESSAGE IS SENT, AND IS KEPT IF THE SEND FAILS.
 *
 * The tempting order is the other way round - send, and store on success - so
 * the table only holds parents who were actually reached. That loses precisely
 * the rows that need a human: a number captured while the provider was down is
 * a parent who pressed a button, gave their number, and heard nothing. The
 * failure is recorded ON the row so somebody can list them and follow up.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT IS WRITTEN GREW, AND THAT IS NOT A FREE CHANGE.
 *
 * v1 stored a number, a branch and sometimes an age. This now also stores the
 * discovery answers - why the parent came, how their child uses AI, what
 * worries them, what they want developed - plus which resources they took and
 * how warm the lead is. See the header of
 * supabase/migrations/0009_chat_leads_discovery.sql: it is a small profile of a
 * child's AI habits attached to a phone number, and it is only defensible
 * because CHAT_PHONE_STEP.note tells the parent, right above the input, that we
 * keep what they told us so the messages are relevant.
 *
 * The insert below is therefore the complete list of what leaves the browser.
 * Nothing is derived, enriched or inferred here on the way past. If a field is
 * not in the flow's ChatState and not named in that migration, it does not get
 * added to this object.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type CaptureOutcome = {
  whatsapp: WhatsAppResult;
  /** False when Supabase is not configured. The send is still attempted. */
  stored: boolean;
};

/**
 * @param intent Passed in rather than computed here.
 *
 * `leadIntent` lives in lib/chat/flow.ts and is a pure view of the state, so
 * calling it here would work. It is a parameter because the caller - the chat
 * route - has already computed it for the turn it is answering, and two
 * independent calls at two moments is exactly how a stored `intent` starts
 * disagreeing with the one the rest of the turn acted on.
 */
export async function captureAndNotify(
  state: ChatState,
  utm: { source?: string; medium?: string; campaign?: string },
  intent: LeadIntent,
): Promise<CaptureOutcome> {
  if (!state.phone || !state.branch) {
    return { whatsapp: { status: "failed", error: "incomplete state" }, stored: false };
  }

  const configured =
    isSupabaseConfigured && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  let id: string | null = null;

  if (configured) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("chat_leads")
      .insert({
        phone: state.phone,
        branch: state.branch,
        child_age: state.childAge,

        // The discovery answers. Option ids, straight through - the route has
        // already checked them against content/chatbot.ts, and re-deriving or
        // "cleaning" them here would only make the row disagree with what the
        // parent was actually shown.
        reason: state.reason,
        ai_use: state.aiUse,
        concern: state.concern,
        goal: state.goal,

        // Empty array, not null, when nothing was viewed. `seen` is read as a
        // set and null would force every reader to handle two spellings of
        // "took no resources".
        seen: state.seen,

        intent,

        // Always true in practice - shouldDeliver() gates this whole path on
        // it - but written from the state rather than hardcoded, so if that
        // gate is ever loosened the row still records what actually happened
        // instead of asserting consent that was not given.
        opted_in: state.optedIn,

        // `readiness` is NOT written. The step it came from was cut with the
        // rest of the v1 funnel and the field no longer exists on ChatState;
        // the column survives in the schema for historical rows only. See the
        // legacy note in 0009_chat_leads_discovery.sql.

        utm_source: utm.source ?? null,
        utm_medium: utm.medium ?? null,
        utm_campaign: utm.campaign ?? null,
      })
      .select("id")
      .single();

    // Checked, unlike the pattern elsewhere in this codebase. An insert that is
    // awaited and never inspected reports success on a rejected row, which is
    // how a whole feature can look like it works and store nothing.
    if (error) {
      console.error("[chat] could not store lead:", error.message);
    } else {
      id = data?.id ?? null;
    }
  } else {
    console.error("[chat] Supabase not configured — chat lead was LOST");
  }

  const whatsapp = await sendBranchMessage({
    phone: state.phone,
    branch: state.branch,
    childAge: state.childAge,
  });

  if (id) {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("chat_leads")
      .update({
        whatsapp_status: whatsapp.status,
        whatsapp_error: whatsapp.status === "failed" ? whatsapp.error : null,
        whatsapp_id: whatsapp.status === "sent" ? whatsapp.providerId : null,
        whatsapp_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("[chat] could not record send outcome:", error.message);
    }
  }

  if (whatsapp.status !== "sent") {
    // Loud on the server even though the parent sees a calm message. This is
    // the line somebody greps for when they ask why nobody got messaged.
    console.error(
      `[chat] WhatsApp not delivered (${whatsapp.status})` +
        (whatsapp.status === "failed" ? `: ${whatsapp.error}` : ""),
    );
  }

  return { whatsapp, stored: Boolean(id) };
}
