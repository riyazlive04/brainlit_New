import {
  CHAT_MEDIA,
  CHAT_RESOURCES,
  CHAT_FUTURE_FOLLOWUP,
  type ChatBranchId,
  type ChatFuturePriorityId,
} from "@/content/chatbot";

/**
 * The conversation, as a state machine.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS IS NOT THE MODEL'S JOB.
 *
 * The obvious build is to describe the conversation in a system prompt and let
 * a model conduct it. That is the wrong tool for this half. This flow captures
 * a phone number and fires a WhatsApp message: it must do the same thing every
 * time, be replayable from a stored state, and be auditable when a parent asks
 * why they were messaged. A model asked to run a script will occasionally skip
 * a step, ask twice, or invent a fourth option - all tolerable in a chat, none
 * tolerable in a consent-bearing capture.
 *
 * "ADAPT DYNAMICALLY" IS A TREE, NOT AN IMPROVISATION. The brief asks for a
 * conversation that does not put every visitor through the same questionnaire,
 * and that is what the routing below does: what a parent is asked next is a
 * fixed consequence of what they just pressed. It is legible, it is testable,
 * and it can be argued with. None of those survive a prompt.
 *
 * So the script is deterministic, and free text is answered by LOOKING UP the
 * closest passage in the site's own content. See lib/chat/retrieval.ts.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE SHAPE: THREE FUNNELS BECAME THREE PATHS INTO ONE HUB.
 *
 * v1 was three straight lines: branch, phone, a step or two, send. Every line
 * ended at the same place and none of them could be re-entered, so a parent who
 * wanted the video AND the workshop photographs had no way to say so.
 *
 * Now each branch runs its own discovery and then lands on `resources` - a hub
 * that offers what has NOT been seen yet and is returned to after each one. The
 * WhatsApp offer is one option among those rather than the terminus, which is
 * what lets "Maybe later" be a real answer instead of an exit.
 *
 * The state is a plain serialisable object with no functions on it. It travels
 * to the browser and back on every turn, so the server holds no session: there
 * is nothing to expire, nothing to evict, and a person who reloads mid-flow is
 * exactly where they were.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type ChatStep =
  /** Before anything: greeting plus the three branches. */
  | "branch"

  /* ── Just exploring ── */
  | "exploring_reason"
  | "exploring_ai_use"
  | "exploring_understand"

  /* ── AI literacy ── */
  | "literacy_interest"
  | "literacy_ai_use"
  | "literacy_concern"
  | "literacy_develop"

  /* ── Future readiness ── */
  | "future_priority"
  | "future_followup"
  | "future_age"

  /** The hub. Every branch arrives here; every resource returns here. */
  | "resources"

  /* ── The resources ── */
  | "testimonial"
  | "testimonial_reaction"
  | "workshop"
  | "workshop_photos"
  | "workshop_videos"
  | "social"
  | "community"
  | "human"

  /* ── The offer, and the number ── */
  | "whatsapp_offer"
  | "phone"

  /** Terminal. The send has been attempted; free text is open. */
  | "done";

/** What the hub can send somebody to. */
export type ResourceId = (typeof CHAT_RESOURCES.options)[number]["id"];

/** Things a visitor can have consumed. Drives the hub's filtering. */
export type SeenId =
  | "testimonial"
  | "workshop_photos"
  | "workshop_videos"
  | "instagram"
  | "youtube"
  | "community"
  | "explore";

/** Never rendered. See `leadIntent`. */
export type LeadIntent = "cold" | "warm" | "hot";

export type ChatState = {
  step: ChatStep;
  branch: ChatBranchId | null;

  /**
   * The discovery answers, as option ids.
   *
   * PLAIN STRINGS rather than a union per question. Three branches ask
   * overlapping questions - "how does your child use AI" exists twice with
   * slightly different option sets - and modelling each as its own union means
   * the state type has to know which branch it is on to know which field is
   * legal. The ids are validated at the door in app/api/chat/route.ts, which is
   * where untrusted input belongs.
   */
  reason: string | null;
  aiUse: string | null;
  concern: string | null;
  goal: string | null;
  childAge: number | null;

  /** Append-only, and never re-offered by the hub. */
  seen: SeenId[];

  phone: string | null;
  /** True once "Continue on WhatsApp" has been pressed. Gates the send. */
  optedIn: boolean;
  /** Set once the send has been ATTEMPTED, whatever the outcome. */
  delivered: boolean;
};

export const INITIAL_STATE: ChatState = {
  step: "branch",
  branch: null,
  reason: null,
  aiUse: null,
  concern: null,
  goal: null,
  childAge: null,
  seen: [],
  phone: null,
  optedIn: false,
  delivered: false,
};

/* ═════════════════════════════════════════════════ Where each branch starts ══ */

const BRANCH_ENTRY: Record<ChatBranchId, ChatStep> = {
  exploring: "exploring_reason",
  ai_literacy: "literacy_interest",
  future_readiness: "future_priority",
};

/* ═══════════════════════════════════════════════════════════ The hub ══ */

/**
 * What to offer next, given what has already been taken.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * This function IS section 18 of the brief. The instruction there is to answer
 * "what should this visitor see next", not "how many BrainLIT assets can I
 * show", and the difference is entirely in what gets filtered out.
 *
 * `whatsapp` and `human` are never filtered: one is the point of the exercise
 * and the other is the way out, and both must stay reachable from every turn.
 * `workshop` disappears once BOTH its halves have been seen, not one.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function resourceOptions(state: ChatState): ResourceId[] {
  const seen = new Set(state.seen);

  return CHAT_RESOURCES.options
    .map((option) => option.id)
    .filter((id) => {
      switch (id) {
        case "testimonial":
          return !seen.has("testimonial");
        case "workshop": {
          // Both halves taken - and when no YouTube id is configured the video
          // half can never BE taken, so the photographs alone have to be able
          // to exhaust it. Without that second clause the hub offers a workshop
          // chooser forever, with one dead option on it.
          const videos =
            seen.has("workshop_videos") || !isReachable("workshop_videos");
          return !(seen.has("workshop_photos") && videos);
        }
        case "explore":
          return !seen.has("explore");
        case "social":
          return !(seen.has("instagram") && seen.has("youtube"));
        case "community":
          return !seen.has("community");
        // Always available, on purpose.
        case "whatsapp":
          return !state.optedIn;
        case "human":
          return true;
      }
    });
}

/** True when the hub has nothing left to offer but the two permanent options. */
export function hubExhausted(state: ChatState): boolean {
  return resourceOptions(state).every((id) => id === "whatsapp" || id === "human");
}

/* ══════════════════════════════════════════════════════ Lead intent ══ */

/**
 * Cold, warm or hot - for the CRM, never for the screen.
 *
 * Deliberately computed from state rather than stored as a field somebody has
 * to remember to update. It is a view of what happened, so it cannot drift out
 * of step with what happened.
 *
 * `hot` is reserved for an ACTION, not an opinion: asking to be messaged, or
 * asking for a person. Answering three discovery questions enthusiastically is
 * warm; it is not a request for contact and must not be filed as one.
 */
export function leadIntent(state: ChatState): LeadIntent {
  if (state.optedIn || state.step === "human") return "hot";

  const answered = [state.reason, state.aiUse, state.concern, state.goal].filter(
    Boolean,
  ).length;

  if (answered >= 2 || state.seen.length > 0) return "warm";
  return "cold";
}

/* ═══════════════════════════════════════════════════════ Reachability ══ */

/** True when a step has everything it needs to be worth showing. */
function isReachable(step: ChatStep): boolean {
  // An empty id would render a player with no video in it. Skip rather than
  // show a broken frame.
  if (step === "workshop_videos") return CHAT_MEDIA.youtubeId.trim().length > 0;
  return true;
}

/* ═══════════════════════════════════════════════════════ Transitions ══ */

export type ChatAction =
  | { type: "branch"; branch: ChatBranchId }
  | { type: "reason"; reason: string }
  | { type: "ai_use"; aiUse: string }
  | { type: "understand"; understand: string }
  | { type: "interest"; interest: string }
  | { type: "concern"; concern: string }
  | { type: "develop"; develop: string }
  | { type: "priority"; priority: string }
  | { type: "followup"; followup: string }
  | { type: "age"; childAge: number }
  | { type: "resource"; resource: ResourceId }
  /**
   * The photos-or-videos choice inside the workshop step.
   *
   * A SEPARATE ACTION rather than a second `resource`, because the hub and this
   * chooser are different questions: `resource` picks which of seven things to
   * do next, this picks which half of one of them. Folding them together would
   * have meant `ResourceId` carrying two ids the hub must never offer.
   *
   * Its absence was a dead end - `workshop` had no exit but `seen`, which
   * returned to the hub without ever showing a photograph.
   */
  | { type: "workshop"; which: "photos" | "videos" }
  | { type: "seen"; what: SeenId }
  /**
   * Back to the hub from any resource, without having taken it.
   *
   * ─────────────────────────────────────────────────────────────────────────────
   * TWO STEPS HAD NO EXIT AT ALL WITHOUT THIS.
   *
   * `human` says its piece and offers a WhatsApp link, and there is no `seen`
   * id for having read a paragraph - so a parent who pressed "Talk to a
   * BrainLIT person" could not get back to the hub by any route but restarting.
   *
   * `social` was worse than a dead end: pressing Instagram marked it seen and
   * returned to the hub, stranding the YouTube link beside it. Marking a social
   * link now KEEPS you on the step, so both can be taken - and this is what
   * ends it.
   * ─────────────────────────────────────────────────────────────────────────────
   */
  | { type: "back" }
  | { type: "reaction"; reaction: string }
  | { type: "whatsapp"; answer: "yes" | "later" }
  | { type: "phone"; phone: string };

/** Adds to `seen` without duplicating - the hub reads it as a set. */
function withSeen(state: ChatState, what: SeenId): ChatState {
  if (state.seen.includes(what)) return state;
  return { ...state, seen: [...state.seen, what] };
}

/** Where the hub sends somebody for each option. */
const RESOURCE_STEP: Record<ResourceId, ChatStep> = {
  testimonial: "testimonial",
  workshop: "workshop",
  // "What is BrainLIT?" is a paragraph, not a step to sit on: it is said and
  // the hub comes straight back. Handled in `applyAction`, not here.
  explore: "resources",
  social: "social",
  community: "community",
  whatsapp: "whatsapp_offer",
  human: "human",
};

/**
 * Applies one action. Pure, and total: an action that does not belong to the
 * current step returns the state UNCHANGED rather than throwing.
 *
 * That last part is not defensiveness for its own sake. This runs on a public
 * endpoint where the state arrives from the client, so "an action arrived for a
 * step we are not on" is an ordinary thing to receive - a double-tapped button,
 * a stale tab - and the correct response is to ignore it, not to 500.
 */
export function applyAction(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    /* ── Opening ── */

    case "branch":
      if (state.step !== "branch") return state;
      return {
        ...state,
        branch: action.branch,
        step: BRANCH_ENTRY[action.branch],
      };

    /* ── Just exploring ── */

    case "reason": {
      if (state.step !== "exploring_reason") return state;
      const next = { ...state, reason: action.reason };
      // Only the parent whose child is ALREADY using AI has anything specific
      // to be asked about. "I'm just curious" gets the explainer and the hub;
      // interrogating somebody who said they are only looking is how they leave.
      return {
        ...next,
        step: action.reason === "already_using" ? "exploring_ai_use" : "resources",
      };
    }

    case "ai_use": {
      // Shared by both branches that ask it - the step tells them apart.
      if (state.step === "exploring_ai_use") {
        return { ...state, aiUse: action.aiUse, step: "exploring_understand" };
      }
      if (state.step === "literacy_ai_use") {
        return { ...state, aiUse: action.aiUse, step: "literacy_concern" };
      }
      return state;
    }

    case "understand": {
      if (state.step !== "exploring_understand") return state;
      return { ...state, concern: action.understand, step: "resources" };
    }

    /* ── AI literacy ── */

    case "interest": {
      if (state.step !== "literacy_interest") return state;
      const next = { ...state, reason: action.interest };
      switch (action.interest) {
        case "already_uses":
          return { ...next, step: "literacy_ai_use" };
        case "learn_properly":
          return { ...next, step: "literacy_develop" };
        // Responsible use, dependency, questioning AI: the insight already
        // answers all three, so another question would be asked for our benefit
        // rather than theirs.
        default:
          return { ...next, step: "resources" };
      }
    }

    case "concern": {
      if (state.step !== "literacy_concern") return state;
      return { ...state, concern: action.concern, step: "resources" };
    }

    case "develop": {
      if (state.step !== "literacy_develop") return state;
      return { ...state, goal: action.develop, step: "resources" };
    }

    /* ── Future readiness ── */

    case "priority": {
      if (state.step !== "future_priority") return state;
      // Every priority has a follow-up in the table, so this cannot dead-end.
      const known = action.priority in CHAT_FUTURE_FOLLOWUP;
      return {
        ...state,
        reason: action.priority,
        step: known ? "future_followup" : "future_age",
      };
    }

    case "followup": {
      if (state.step !== "future_followup") return state;
      return { ...state, goal: action.followup, step: "future_age" };
    }

    case "age": {
      if (state.step !== "future_age") return state;
      return { ...state, childAge: action.childAge, step: "resources" };
    }

    /* ── The hub ── */

    case "resource": {
      if (state.step !== "resources") return state;

      // "What is BrainLIT?" is said and done with in one turn - there is no
      // step to sit on, so it is marked seen and the hub is re-offered.
      if (action.resource === "explore") {
        return withSeen(state, "explore");
      }

      const target = RESOURCE_STEP[action.resource];
      if (!isReachable(target)) return state;
      return { ...state, step: target };
    }

    /* ── Inside a resource ── */

    case "workshop": {
      if (state.step !== "workshop") return state;
      const target: ChatStep =
        action.which === "photos" ? "workshop_photos" : "workshop_videos";
      // No YouTube id configured means no video step. Stay put rather than
      // parking somebody on an empty player - the chooser is still on screen
      // and the photographs are still an answer.
      if (!isReachable(target)) return state;
      return { ...state, step: target };
    }

    case "seen": {
      const next = withSeen(state, action.what);

      // The parent video is the one thing worth a follow-up question. Asking
      // "what did you think" of an Instagram link would be absurd.
      if (state.step === "testimonial" && action.what === "testimonial") {
        return { ...next, step: "testimonial_reaction" };
      }

      // The social step offers TWO links and must survive the first one being
      // pressed. Leaving on `seen` stranded whichever was not clicked, and the
      // hub then had to re-offer the whole step to give it back. `back` is how
      // this one ends.
      if (state.step === "social") return next;

      return { ...next, step: "resources" };
    }

    case "back": {
      // Only from a resource. Anywhere else this is a stale tab or a double
      // tap, and the discovery questions must not be skippable by sending it.
      const RESOURCE_STEPS: ChatStep[] = [
        "testimonial",
        "testimonial_reaction",
        "workshop",
        "workshop_photos",
        "workshop_videos",
        "social",
        "community",
        "human",
      ];
      if (!RESOURCE_STEPS.includes(state.step)) return state;
      return { ...state, step: "resources" };
    }

    case "reaction": {
      if (state.step !== "testimonial_reaction") return state;
      // Recorded as a goal because that is what it tells us - what the parent
      // took from it. Not used to change the path; used in the CRM.
      return { ...state, goal: state.goal ?? action.reaction, step: "resources" };
    }

    /* ── The offer ── */

    case "whatsapp": {
      if (state.step !== "whatsapp_offer") return state;
      if (action.answer === "later") return { ...state, step: "resources" };
      return { ...state, optedIn: true, step: "phone" };
    }

    case "phone": {
      if (state.step !== "phone") return state;
      return { ...state, phone: action.phone, step: "done" };
    }

    default:
      return state;
  }
}

/**
 * True when the message should be sent.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * `optedIn` IS PART OF THIS, and it is the change that matters most in v2.
 *
 * v1 sent the moment a scripted funnel ran out of steps - reaching the end WAS
 * the consent. Here the end is a hub somebody can sit in indefinitely, so the
 * send is gated on an explicit press of "Continue on WhatsApp" followed by a
 * number. A parent who walks every resource and never presses it is never
 * messaged, which is the correct outcome and was not previously expressible.
 *
 * `delivered` is what stops a reloaded tab, a double-submit, or a replayed
 * state from messaging the same parent twice. It is set by the route once the
 * send has been ATTEMPTED - not once it has succeeded - because a retry loop
 * driven by the client is a way to get a number flooded.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function shouldDeliver(state: ChatState): boolean {
  return (
    state.step === "done" &&
    !state.delivered &&
    state.optedIn &&
    Boolean(state.phone)
  );
}

/**
 * Every step at which free text should be accepted.
 *
 * ALL OF THEM, and that is deliberate. v1 allowed typing only at the very start
 * and the very end, so a parent three questions in who wanted to ask about fees
 * had to finish the script first. Section 17 of the brief says to continue
 * naturally when somebody asks questions, and a box that is greyed out for most
 * of the conversation cannot do that.
 *
 * Typing still cannot MOVE the flow - see the route - so opening it costs
 * nothing structurally. The worst outcome is being handed the wrong FAQ.
 */
export function canAsk(_state: ChatState): boolean {
  return true;
}

/**
 * The priority ids that have a follow-up written for them.
 *
 * Exported for the route's validation: an id arriving from a client that is not
 * in this table must not be allowed to park somebody on a step with no question
 * on it.
 */
export function isFuturePriority(id: string): id is ChatFuturePriorityId {
  return id in CHAT_FUTURE_FOLLOWUP;
}
