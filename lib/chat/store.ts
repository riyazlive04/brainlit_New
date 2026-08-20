import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { sendBranchMessage, type WhatsAppResult } from "@/lib/whatsapp";
import type { ChatState } from "@/lib/chat/flow";

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
 */

export type CaptureOutcome = {
  whatsapp: WhatsAppResult;
  /** False when Supabase is not configured. The send is still attempted. */
  stored: boolean;
};

export async function captureAndNotify(
  state: ChatState,
  utm: { source?: string; medium?: string; campaign?: string },
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
        readiness: state.readiness,
        child_age: state.childAge,
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
