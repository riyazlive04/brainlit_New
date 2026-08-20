import { NextResponse } from "next/server";
import { z } from "zod";

import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { normalizeIndianMobile, isValidIndianMobile } from "@/lib/phone";
import {
  applyAction,
  shouldDeliver,
  type ChatState,
  type ChatAction,
} from "@/lib/chat/flow";
import { captureAndNotify } from "@/lib/chat/store";
import { answerFromContent } from "@/lib/chat/retrieval";
import { CHAT_ANSWERS, CHAT_CLOSING } from "@/content/chatbot";

/**
 * The chatbot's one endpoint. Two jobs behind a single door.
 *
 *   1. A funnel TURN - a button was pressed or a field submitted. Deterministic,
 *      cheap, and the only path that can capture a number or send a message.
 *   2. A QUESTION - free text. Answered by LOOKING UP the closest passage in
 *      the site's own content and returning it verbatim. No model anywhere in
 *      this file; see lib/chat/retrieval.ts for why.
 *
 * The split still matters even without a model in it: typing cannot advance the
 * funnel, and the funnel is what records consent and fires WhatsApp. Whatever
 * somebody types, the worst outcome is being handed the wrong FAQ.
 */

/**
 * The client sends the state back on every turn, so it is UNTRUSTED input and
 * gets parsed like any other. The worst a forged state can do is skip a step of
 * a script the visitor could have walked anyway - except for `delivered`, which
 * is why the send is guarded by more than this flag alone.
 */
const stateSchema = z.object({
  step: z.enum([
    "branch",
    "phone",
    "readiness",
    "age",
    "video",
    "testimonial",
    "done",
  ]),
  branch: z.enum(["exploring", "ai_literacy", "future_readiness"]).nullable(),
  phone: z.string().nullable(),
  readiness: z.enum(["ready", "more_details"]).nullable(),
  childAge: z.number().int().min(6).max(18).nullable(),
  delivered: z.boolean(),
});

const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("branch"),
    branch: z.enum(["exploring", "ai_literacy", "future_readiness"]),
  }),
  z.object({ type: z.literal("phone"), phone: z.string().min(1).max(24) }),
  z.object({
    type: z.literal("readiness"),
    readiness: z.enum(["ready", "more_details"]),
  }),
  z.object({ type: z.literal("age"), childAge: z.coerce.number().int() }),
  z.object({ type: z.literal("watched") }),
]);

const bodySchema = z.object({
  state: stateSchema,
  action: actionSchema.optional(),
  /** Capped hard. Nobody types 2000 characters into a chat bubble in good faith. */
  message: z.string().trim().min(1).max(600).optional(),
  utm: z
    .object({
      source: z.string().max(120).optional(),
      medium: z.string().max(120).optional(),
      campaign: z.string().max(120).optional(),
    })
    .optional(),
});

/**
 * Two limits, because the two jobs cost wildly different amounts.
 *
 * Both are set for CGNAT - Indian mobile carriers put many subscribers behind
 * one public IP, so a limit tuned to one person locks out a neighbourhood.
 */
const TURN_LIMIT = 60;
const ASK_LIMIT = 15;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const { state: incoming, action, message, utm } = parsed.data;
  const ip = clientIp(request.headers);

  /* ───────────────────────────────────────────────── A question ── */

  if (message) {
    const { allowed, retryAfter } = checkRateLimit(`chat:ask:${ip}`, ASK_LIMIT, WINDOW_MS);
    if (!allowed) {
      return NextResponse.json(
        { ok: false, reply: "You have asked a lot at once. Give it a minute." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }

    const reply = await answer(message);
    // The state is returned UNCHANGED. Typing cannot move the funnel.
    return NextResponse.json({ ok: true, state: incoming, reply });
  }

  /* ─────────────────────────────────────────────────── A turn ── */

  const { allowed, retryAfter } = checkRateLimit(`chat:turn:${ip}`, TURN_LIMIT, WINDOW_MS);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  if (!action) {
    return NextResponse.json({ ok: true, state: incoming });
  }

  // The phone number is normalised and validated HERE, before it reaches the
  // state machine, so a value that fails cannot advance the step. The database
  // constraint says the same thing again; neither is redundant, because this
  // one produces a message a parent can act on.
  let next: ChatState;
  if (action.type === "phone") {
    const phone = normalizeIndianMobile(action.phone);
    if (!isValidIndianMobile(phone)) {
      return NextResponse.json({ ok: false, state: incoming, invalid: "phone" });
    }
    next = applyAction(incoming as ChatState, { type: "phone", phone });
  } else if (action.type === "age") {
    if (action.childAge < 6 || action.childAge > 18) {
      return NextResponse.json({ ok: false, state: incoming, invalid: "age" });
    }
    next = applyAction(incoming as ChatState, action as ChatAction);
  } else {
    next = applyAction(incoming as ChatState, action as ChatAction);
  }

  /* ──────────────────────────────────── The one irreversible step ── */

  if (shouldDeliver(next)) {
    // Marked BEFORE the await, not after. Two turns arriving together - a
    // double tap, a retried fetch - would otherwise both pass the guard and
    // message the parent twice.
    next = { ...next, delivered: true };

    const outcome = await captureAndNotify(next, utm ?? {});

    return NextResponse.json({
      ok: true,
      state: next,
      closing:
        outcome.whatsapp.status === "sent" ? CHAT_CLOSING.sent : CHAT_CLOSING.queued,
    });
  }

  return NextResponse.json({ ok: true, state: next });
}

/* ═════════════════════════════════════════════════════ The answer ══ */

/**
 * Never throws, and never returns an empty string. A chat bubble that arrives
 * blank reads as the site being broken; a sentence pointing at WhatsApp does
 * not, and is true.
 *
 * Every string this can return was written by a person - either a FAQ answer
 * from content/home.ts or one of the two fallbacks. Nothing here composes prose.
 */
async function answer(question: string): Promise<string> {
  try {
    const result = await answerFromContent(question);

    switch (result.kind) {
      case "answer":
        return result.text;
      // A real BrainLIT question we have not written down - worth a human.
      case "unanswered":
        return CHAT_ANSWERS.outOfScope;
      // Not about BrainLIT. Steer back instead of spending a person on it.
      case "off_topic":
        return CHAT_ANSWERS.offTopic;
    }
  } catch (error) {
    // Only reachable if the content layer itself fails - a Supabase outage
    // while fetching programmes, say. The index is otherwise pure computation.
    console.error("[chat] retrieval failed:", error);
    return CHAT_ANSWERS.unavailable;
  }
}
