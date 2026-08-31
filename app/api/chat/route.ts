import { NextResponse } from "next/server";
import { z } from "zod";

import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import {
  normalizeIndianMobile,
  isValidIndianMobile,
  INDIAN_MOBILE_RE,
} from "@/lib/phone";
import {
  applyAction,
  shouldDeliver,
  leadIntent,
  isFuturePriority,
  type ChatState,
  type ChatStep,
  type SeenId,
} from "@/lib/chat/flow";
import { captureAndNotify } from "@/lib/chat/store";
import { answerFromContent } from "@/lib/chat/retrieval";
import {
  CHAT_ANSWERS,
  CHAT_BRANCHES,
  CHAT_CLOSING,
  CHAT_EXPLORING_AI_USE,
  CHAT_EXPLORING_REASON,
  CHAT_EXPLORING_UNDERSTAND,
  CHAT_FUTURE_FOLLOWUP,
  CHAT_FUTURE_PRIORITY,
  CHAT_LITERACY_AI_USE,
  CHAT_LITERACY_CONCERN,
  CHAT_LITERACY_DEVELOP,
  CHAT_LITERACY_INTEREST,
  CHAT_RESOURCES,
  CHAT_TESTIMONIAL,
  CHAT_WHATSAPP_OFFER,
  CHAT_WORKSHOP,
} from "@/content/chatbot";

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
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT CHANGED IN v2, FROM THIS FILE'S POINT OF VIEW.
 *
 * The old flow was branch -> phone -> a step or two -> send, so the schema here
 * had five steps and four actions in it and could be read at a glance. The new
 * flow runs three discovery paths into a resource hub, which is a lot more
 * surface: twenty-three steps, seventeen actions, and the better part of a
 * hundred option ids that arrive as untrusted strings.
 *
 * The response to that growth is NOT to loosen the schema to `z.string()` and
 * trust the state machine to ignore what it does not recognise. `applyAction`
 * is total and would indeed ignore it - but the ids are also written to the
 * database and read back by whoever works the leads, and a column quietly
 * accumulating `homewrok` and `<script>` is a mess nobody notices until they
 * try to count anything. So every option id below is validated against the
 * ACTUAL list in content/chatbot.ts, derived at module load rather than typed
 * out a second time here. Renaming an option in that file cannot leave a stale
 * copy behind in this one, because there is no copy.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ══════════════════════════════════════════ Enums from the content ══ */

type Option = { readonly id: string };

/**
 * The option ids of a content block, as the non-empty tuple `z.enum` wants.
 *
 * The alternative - writing the ids out again inside each `z.enum([...])` - was
 * what the first draft of this file did, and it is exactly the sort of
 * duplication that survives a rename. content/chatbot.ts is edited by whoever
 * owns the words, not by whoever owns the schema; a label change there must not
 * be able to turn a validated id into an unvalidated string here.
 *
 * The cast is the one unavoidable part: `.map` cannot tell TypeScript that a
 * non-empty array stays non-empty. The element TYPE is still the real union of
 * ids, so an id that does not exist is a compile error at the point of use.
 */
function ids<T extends readonly Option[]>(
  options: T,
): [T[number]["id"], ...T[number]["id"][]] {
  return options.map((option) => option.id) as [
    T[number]["id"],
    ...T[number]["id"][],
  ];
}

/** Same, for ids gathered from more than one list. Deduplicated. */
function mergeIds(...lists: readonly (readonly string[])[]): [string, ...string[]] {
  return [...new Set(lists.flat())] as [string, ...string[]];
}

/**
 * `ai_use` is asked on TWO branches with two different option sets - the
 * literacy version adds "everything" - and both send the same action. The union
 * of the two is what the door has to accept, because the door does not know
 * which step the client thinks it is on. `applyAction` does know, and routes on
 * it; this only has to reject ids that exist nowhere.
 */
const AI_USE_IDS = mergeIds(
  ids(CHAT_EXPLORING_AI_USE.options),
  ids(CHAT_LITERACY_AI_USE.options),
);

/**
 * Every follow-up answer across every priority, flattened.
 *
 * Validating against only the follow-up for the priority in the state would be
 * tighter, and was rejected: it would mean reading the state to build the
 * schema, and the state is the thing being validated. The pairing is enforced
 * where it belongs - `applyAction` will not accept a `followup` unless the step
 * is `future_followup`, which is only reachable through a priority.
 */
const FOLLOWUP_IDS = mergeIds(
  ...Object.values(CHAT_FUTURE_FOLLOWUP).map((question) =>
    question.options.map((option) => option.id),
  ),
);

/**
 * The two lists below are keyed off the flow's own types on purpose.
 *
 * A plain `as const satisfies readonly ChatStep[]` catches a step that does not
 * exist but says nothing about one that is MISSING - and a step missing from
 * this enum is a 400 on a legitimate turn, which is the worse failure and the
 * harder one to spot. Building the tuple from the keys of an exhaustive
 * `Record` makes a new step in lib/chat/flow.ts a compile error here.
 */
const STEP_KEYS: Record<ChatStep, true> = {
  branch: true,

  exploring_reason: true,
  exploring_ai_use: true,
  exploring_understand: true,

  literacy_interest: true,
  literacy_ai_use: true,
  literacy_concern: true,
  literacy_develop: true,

  future_priority: true,
  future_followup: true,
  future_age: true,

  resources: true,

  testimonial: true,
  testimonial_reaction: true,
  workshop: true,
  workshop_photos: true,
  workshop_videos: true,
  social: true,
  community: true,
  human: true,

  whatsapp_offer: true,
  phone: true,
  done: true,
};
const STEP_IDS = Object.keys(STEP_KEYS) as [ChatStep, ...ChatStep[]];

/**
 * `SeenId` has no option list in content/chatbot.ts to derive from - it is not
 * a question anyone is asked, it is a record of what was consumed, and two of
 * its members (`instagram`, `youtube`) are halves of a single hub option. Same
 * exhaustive-Record trick, same reason.
 */
const SEEN_KEYS: Record<SeenId, true> = {
  testimonial: true,
  workshop_photos: true,
  workshop_videos: true,
  instagram: true,
  youtube: true,
  community: true,
  explore: true,
};
const SEEN_IDS = Object.keys(SEEN_KEYS) as [SeenId, ...SeenId[]];

/* ═══════════════════════════════════════════════════════ The state ══ */

/**
 * A discovery answer as it sits in the state: an option id, already validated
 * on the turn that set it.
 *
 * NOT re-checked against the option lists here, and that is deliberate. The
 * state type in lib/chat/flow.ts holds these as plain strings precisely because
 * the same field is filled from different questions on different branches -
 * `concern` takes `exploring_understand` ids on one path and `literacy_concern`
 * ids on another - so a per-field enum would have to know which branch it was
 * on to be correct, and would reject valid states whenever it guessed wrong.
 * The cap is there so a forged state cannot arrive carrying a novel.
 */
const discoveryAnswer = z.string().max(64).nullable();

/**
 * The client sends the state back on every turn, so it is UNTRUSTED input and
 * gets parsed like any other. The worst a forged state can do is skip a step of
 * a script the visitor could have walked anyway - except for `delivered`, which
 * is why the send is guarded by more than this flag alone.
 */
const stateSchema = z.object({
  step: z.enum(STEP_IDS),
  branch: z.enum(ids(CHAT_BRANCHES)).nullable(),

  /* Discovery. Nullable until answered; never re-asked once set. */
  reason: discoveryAnswer,
  aiUse: discoveryAnswer,
  concern: discoveryAnswer,
  goal: discoveryAnswer,
  childAge: z.number().int().min(6).max(18).nullable(),

  /**
   * Append-only, and read as a set by the hub, so the order does not matter and
   * duplicates are harmless. The cap is not about the seven legal values - it
   * is about a forged array of ten thousand of them being parsed, stored, and
   * written to a jsonb column on every turn.
   */
  seen: z.array(z.enum(SEEN_IDS)).max(16),

  /**
   * VALIDATED, not merely typed, and this is the one field where that matters.
   *
   * `shouldDeliver` fires on a state, and a forged state carrying step "done",
   * `optedIn`, and an arbitrary number would send an unsolicited WhatsApp
   * message to whatever was in this field. The phone ACTION is normalised and
   * checked below, so every number this route itself writes is ten digits; a
   * value that is not ten digits therefore did not come from here, and there is
   * nothing to lose by refusing it.
   */
  phone: z.string().regex(INDIAN_MOBILE_RE).nullable(),

  /** Set by pressing "Continue on WhatsApp". Gates the send; see shouldDeliver. */
  optedIn: z.boolean(),
  /** Set once the send has been ATTEMPTED, whatever the outcome. */
  delivered: z.boolean(),
});

/* ══════════════════════════════════════════════════════ The actions ══ */

/**
 * One member per variant of `ChatAction`, and the payloads are enums rather
 * than strings wherever content/chatbot.ts has a list to check against.
 *
 * There is no `restart`. The state machine has no such transition - a fresh
 * conversation is the client dropping its state and starting from
 * `INITIAL_STATE`, which needs no round trip and cannot half-fail.
 */
const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("branch"),
    branch: z.enum(ids(CHAT_BRANCHES)),
  }),

  /* ── Just exploring ── */
  z.object({
    type: z.literal("reason"),
    reason: z.enum(ids(CHAT_EXPLORING_REASON.options)),
  }),
  z.object({
    type: z.literal("understand"),
    understand: z.enum(ids(CHAT_EXPLORING_UNDERSTAND.options)),
  }),

  /* ── AI literacy ── */
  z.object({
    type: z.literal("interest"),
    interest: z.enum(ids(CHAT_LITERACY_INTEREST.options)),
  }),
  z.object({
    type: z.literal("concern"),
    concern: z.enum(ids(CHAT_LITERACY_CONCERN.options)),
  }),
  z.object({
    type: z.literal("develop"),
    develop: z.enum(ids(CHAT_LITERACY_DEVELOP.options)),
  }),

  /* ── Shared by both of the above ── */
  z.object({ type: z.literal("ai_use"), aiUse: z.enum(AI_USE_IDS) }),

  /* ── Future readiness ── */
  z.object({
    type: z.literal("priority"),
    /**
     * `isFuturePriority` is the runtime echo of a rule the typechecker already
     * enforces - CHAT_FUTURE_FOLLOWUP is declared `satisfies
     * Record<ChatFuturePriorityId, ...>`, so the two lists cannot drift. It is
     * kept because the cost of the drift is specific and silent: a priority
     * with no follow-up written for it parks a parent on a step that renders a
     * question with no options under it.
     */
    priority: z.enum(ids(CHAT_FUTURE_PRIORITY.options)).refine(isFuturePriority),
  }),
  z.object({ type: z.literal("followup"), followup: z.enum(FOLLOWUP_IDS) }),
  /** Coerced because a number field posts a string. Bounds checked in the handler. */
  z.object({ type: z.literal("age"), childAge: z.coerce.number().int() }),

  /* ── The hub, and the resources ── */
  z.object({
    type: z.literal("resource"),
    resource: z.enum(ids(CHAT_RESOURCES.options)),
  }),
  /**
   * The photos-or-videos chooser that sits on the `workshop` step.
   *
   * `which` is not the same thing as a `SeenId`, even though the two look
   * alike here: this is "show me that half", `seen` is "I have looked at it".
   * Collapsing them would have made the chooser unrepresentable, which is how
   * the workshop step came to be a dead end in the first place.
   *
   * Whether the video half exists at all is `isReachable`'s call in
   * lib/chat/flow.ts - an unconfigured YouTube id keeps the state put rather
   * than parking somebody on an empty player. That is a content question, not
   * a validation one, so it is not duplicated here.
   */
  z.object({
    type: z.literal("workshop"),
    which: z.enum(ids(CHAT_WORKSHOP.options)),
  }),
  z.object({ type: z.literal("seen"), what: z.enum(SEEN_IDS) }),
  /**
   * The way out of a resource, back to the hub. No payload - the step the
   * visitor is on is already in the state, so naming a destination would only
   * be a second, forgeable opinion about where they are.
   *
   * IT CANNOT SKIP A QUESTION. An untargeted "go back" on a public endpoint is
   * worth being uneasy about, so: `applyAction` ignores this unless the current
   * step is one of the eight resource steps, and returns the state untouched
   * everywhere else. Sent from mid-discovery it does nothing at all.
   *
   * It exists because two steps had no exit. `human` says its piece and offers
   * a WhatsApp link, and there is no `SeenId` for having read a paragraph, so a
   * parent who pressed "Talk to a BrainLIT person" could only start over.
   * `social` was worse - pressing Instagram marked it seen and returned to the
   * hub, stranding the YouTube link beside it. Marking a social link now keeps
   * you on the step so both can be taken, and this is what ends it.
   */
  z.object({ type: z.literal("back") }),
  z.object({
    type: z.literal("reaction"),
    reaction: z.enum(ids(CHAT_TESTIMONIAL.options)),
  }),

  /* ── The offer, and the number ── */
  z.object({
    type: z.literal("whatsapp"),
    answer: z.enum(ids(CHAT_WHATSAPP_OFFER.options)),
  }),
  z.object({ type: z.literal("phone"), phone: z.string().min(1).max(24) }),
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
 * The typed questions that mean "I want to buy this", per section 13.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE REGEX, ONE PLACE. The temptation is to score intent across several
 * signals - question length, how many resources were opened, time in the widget
 * - and the temptation was refused: this only decides whether to OFFER a human,
 * and a false positive costs one extra button while a false negative loses the
 * parent who was ready to enrol. A short, readable, arguable list beats a score
 * nobody can predict the behaviour of.
 *
 * It does not touch the state and cannot move the flow. The route returns
 * `hot: true` alongside the answer and the client decides what to show; the
 * lead's own intent is computed from what was PRESSED, in `leadIntent`, because
 * asking about fees is not consent to be contacted about them.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const HOT_INTENT_RE =
  /\b(fees?|pric(?:e|ing)|cost|enroll?|admission|regist(?:er|ration)|join now|call me|phone me|talk to someone|speak to)\b/i;

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

  const { action, message, utm } = parsed.data;
  // Annotated rather than cast: if stateSchema and ChatState ever fall out of
  // step, this line is where the build breaks, and it breaks at compile time
  // rather than on somebody's phone.
  const incoming: ChatState = parsed.data.state;
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

    /**
     * The state is returned UNCHANGED. Typing cannot move the funnel.
     *
     * Free text is now open at EVERY step - `canAsk` returns true - which makes
     * this guarantee load-bearing rather than incidental. A parent three
     * questions into discovery can ask about fees and come back to exactly the
     * question they left, and nothing they type can skip the WhatsApp opt-in.
     */
    return NextResponse.json({
      ok: true,
      state: incoming,
      reply,
      ...(HOT_INTENT_RE.test(message) ? { hot: true } : {}),
    });
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
    next = applyAction(incoming, { type: "phone", phone });
  } else if (action.type === "age") {
    // The bounds live in the schema too, on the STATE. Checked again here so
    // the parent gets CHAT_AGE_STEP.invalid rather than a bare 400 - the same
    // reason the phone check is not left to the database.
    if (action.childAge < 6 || action.childAge > 18) {
      return NextResponse.json({ ok: false, state: incoming, invalid: "age" });
    }
    next = applyAction(incoming, action);
  } else {
    next = applyAction(incoming, action);
  }

  /* ──────────────────────────────────── The one irreversible step ── */

  if (shouldDeliver(next)) {
    // Marked BEFORE the await, not after. Two turns arriving together - a
    // double tap, a retried fetch - would otherwise both pass the guard and
    // message the parent twice.
    next = { ...next, delivered: true };

    // The intent is computed from the FINAL state, after `delivered` is set, so
    // the row records what the parent actually did rather than what they had
    // done a step earlier. Anyone reaching here pressed "Continue on WhatsApp",
    // so in practice it is "hot"; it is passed rather than assumed because that
    // is a fact about the flow today, not a property of this function.
    const outcome = await captureAndNotify(next, utm ?? {}, leadIntent(next));

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
