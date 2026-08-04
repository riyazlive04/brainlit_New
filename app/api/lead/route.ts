import { NextResponse } from "next/server";
import { leadSchema } from "@/lib/schemas";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { createLead, LeadStoreUnavailableError } from "@/lib/leads";

/** General enquiry endpoint — contact form, course interest, footer capture. */
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const { allowed, retryAfter } = checkRateLimit(
    `lead:${ip}`,
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

  const parsed = leadSchema.safeParse(body);

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

  // Honeypot — silently accept, so the bot learns nothing.
  if (input.company) {
    return NextResponse.json({ ok: true });
  }

  try {
    await createLead(input);
    // Deliberately returns no id. The client has no use for it, and echoing
    // database identifiers back to an unauthenticated caller is free
    // reconnaissance.
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof LeadStoreUnavailableError) {
      console.error("[lead] Supabase is not configured — enquiry was LOST");
      return NextResponse.json(
        {
          ok: false,
          error:
            "We could not save your message. Please message us on WhatsApp instead.",
        },
        { status: 503 },
      );
    }

    console.error("[lead] capture failed:", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
