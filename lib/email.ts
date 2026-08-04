import "server-only";

import { Resend } from "resend";
import { SITE } from "@/lib/site";

/**
 * Transactional email.
 *
 * Every function here degrades to a no-op when Resend is not configured, and
 * never throws into the request path. A confirmation email failing must not
 * fail the registration: the lead is already saved, and losing a captured
 * parent because an email provider had a bad minute would be a far worse
 * outcome than a missing confirmation.
 *
 * Requires SPF and DKIM on brainlit.in before anything will actually deliver —
 * without them these land in spam, which is worse than not sending.
 */

const apiKey = process.env.RESEND_API_KEY ?? "";
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "";

export const emailConfigured = Boolean(apiKey && fromEmail);

const resend = apiKey ? new Resend(apiKey) : null;

type WebinarConfirmationArgs = {
  to: string;
  parentName: string;
  sessionTitle?: string | null;
  startsAt?: string | null;
  joinUrl?: string | null;
};

function formatSessionTime(startsAt: string): string {
  // Rendered in IST because that is where the audience is; a UTC timestamp in a
  // parent's inbox is a support ticket waiting to happen.
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(startsAt));
}

export async function sendWebinarConfirmation({
  to,
  parentName,
  sessionTitle,
  startsAt,
  joinUrl,
}: WebinarConfirmationArgs): Promise<{ sent: boolean; error?: string }> {
  if (!resend || !emailConfigured) {
    return { sent: false, error: "email not configured" };
  }

  const when = startsAt ? formatSessionTime(startsAt) : null;

  const lines = [
    `Hi ${parentName},`,
    "",
    `You're registered for the free ${SITE.name} session for parents.`,
    when ? `\nWhen: ${when} (IST)` : "",
    sessionTitle ? `Session: ${sessionTitle}` : "",
    joinUrl ? `\nJoin here: ${joinUrl}` : "\nWe'll email your join link before the session.",
    "",
    "This session is for parents, not children. Come with your questions —",
    "we would rather answer those than deliver a pitch.",
    "",
    `— The ${SITE.name} team`,
  ].filter(Boolean);

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject: `You're registered — free ${SITE.name} session for parents`,
      text: lines.join("\n"),
    });

    if (error) return { sent: false, error: error.message };
    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "unknown email error",
    };
  }
}
