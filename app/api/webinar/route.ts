import { NextResponse } from "next/server";
import { webinarRegistrationSchema } from "@/lib/schemas";
import { checkRateLimit, clientIp, refundRateLimit } from "@/lib/rateLimit";
import {
  registerForWebinar,
  LeadStoreUnavailableError,
} from "@/lib/leads";
import { sendWebinarConfirmation } from "@/lib/email";
import { getNextWebinarSession } from "@/lib/webinar";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Submissions per ten minutes per IP.
 *
 * Set for CGNAT, not for one person. Indian mobile carriers put large numbers
 * of subscribers behind a single shared public IP, and school, office and
 * café networks do the same. A limit tuned to "one parent submits once" would
 * lock out every other parent on the same carrier gateway — and it would fail
 * silently from their point of view, as an unexplained error on the one page
 * that has to convert.
 *
 * A genuine attacker is not meaningfully slowed by 20 versus 5; the honeypot,
 * schema validation and idempotent writes are what actually protect this
 * endpoint. This exists to stop hammering, not to police individuals.
 */
const LIMIT = 20;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const rateLimitKey = `webinar:${ip}`;
  const { allowed, retryAfter } = checkRateLimit(
    rateLimitKey,
    LIMIT,
    WINDOW_MS,
  );

  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Malformed request." },
      { status: 400 },
    );
  }

  const parsed = webinarRegistrationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please check the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const input = parsed.data;

  // Honeypot. Report success rather than rejecting: telling a bot which
  // signal caught it is free information for whoever wrote it, and a silent
  // discard costs a real user nothing because a real user never fills this in.
  if (input.company) {
    return NextResponse.json({ ok: true, alreadyRegistered: false });
  }

  try {
    const session = input.sessionId
      ? { id: input.sessionId }
      : await getNextWebinarSession();

    const { leadId, alreadyRegistered } = await registerForWebinar(
      input,
      session?.id ?? null,
    );

    if (!alreadyRegistered) {
      // The join link is read here with the service role, because `anon` has no
      // column grant for it. It reaches the parent by email only, never through
      // the page.
      let joinUrl: string | null = null;
      let title: string | null = null;
      let startsAt: string | null = null;

      if (session?.id) {
        const { data } = await createAdminClient()
          .from("webinar_sessions")
          .select("title, starts_at, zoom_url")
          .eq("id", session.id)
          .maybeSingle();

        joinUrl = data?.zoom_url ?? null;
        title = data?.title ?? null;
        startsAt = data?.starts_at ?? null;
      }

      // Awaited but never allowed to fail the request: the lead is already
      // saved, and losing a captured parent because an email provider had a bad
      // minute would be a far worse outcome than a missing confirmation.
      const result = await sendWebinarConfirmation({
        to: input.email,
        parentName: input.name,
        sessionTitle: title,
        startsAt,
        joinUrl,
      });

      if (!result.sent) {
        console.warn(
          `[webinar] lead ${leadId} saved but confirmation not sent: ${result.error}`,
        );
      }
    }

    return NextResponse.json({ ok: true, alreadyRegistered });
  } catch (error) {
    // Failed for our reasons, so the attempt is given back. Locking a parent
    // out for ten minutes because of our misconfiguration would turn one
    // failure into a lost lead.
    refundRateLimit(rateLimitKey);

    if (error instanceof LeadStoreUnavailableError) {
      console.error("[webinar] Supabase is not configured — lead was LOST");
      return NextResponse.json(
        {
          ok: false,
          error:
            "Registration is temporarily unavailable. Please message us on WhatsApp and we will book your seat.",
        },
        { status: 503 },
      );
    }

    // Log the detail, return none of it. Database errors can carry column and
    // constraint names.
    console.error("[webinar] registration failed:", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
