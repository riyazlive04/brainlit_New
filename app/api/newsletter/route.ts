import { NextResponse } from "next/server";
import { newsletterSchema } from "@/lib/schemas";
import { checkRateLimit, clientIp, refundRateLimit } from "@/lib/rateLimit";
import { LeadStoreUnavailableError } from "@/lib/leads";
import { subscribeToNewsletter } from "@/lib/newsletter";

/**
 * Newsletter subscription.
 *
 * Same limit and window as /api/lead, and for the same reason: Indian mobile
 * carriers put many subscribers behind one shared public IP, so a limit tuned
 * for "one person" locks out strangers on the same CGNAT pool.
 */
const LIMIT = 20;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const rateLimitKey = `newsletter:${ip}`;
  const { allowed, retryAfter } = checkRateLimit(rateLimitKey, LIMIT, WINDOW_MS);

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

  const parsed = newsletterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please enter a valid email address.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const input = parsed.data;

  // Honeypot — silently accept, so the bot learns nothing.
  if (input.company) {
    return NextResponse.json({ ok: true });
  }

  try {
    const { alreadySubscribed } = await subscribeToNewsletter(input);

    // Deliberately the same response either way. Telling an anonymous caller
    // "that address is already subscribed" turns this endpoint into an oracle
    // for checking whether a given parent is on our list.
    void alreadySubscribed;
    return NextResponse.json({ ok: true });
  } catch (error) {
    // Our fault, so give the attempt back rather than locking them out.
    refundRateLimit(rateLimitKey);

    if (error instanceof LeadStoreUnavailableError) {
      console.error("[newsletter] Supabase is not configured — signup was LOST");
      return NextResponse.json(
        {
          ok: false,
          error: "We could not sign you up just now. Please try again later.",
        },
        { status: 503 },
      );
    }

    console.error("[newsletter] signup failed:", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
