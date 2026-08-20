import {
  CHAT_MEDIA,
  type ChatBranchId,
  type ChatReadinessId,
} from "@/content/chatbot";

/**
 * The funnel, as a state machine.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS IS NOT THE MODEL'S JOB.
 *
 * The obvious build is to describe the funnel in a system prompt and let Claude
 * conduct it. That is the wrong tool for this half. This flow captures a phone
 * number, an age, and fires a WhatsApp message: it must do the same thing every
 * time, be replayable from a stored state, and be auditable when a parent asks
 * why they were messaged. A model asked to run a script will occasionally skip
 * a step, ask twice, or invent a fourth option - all tolerable in a chat, none
 * tolerable in a consent-bearing capture.
 *
 * So the script is deterministic and Claude is used ONLY for the thing a script
 * cannot do: answering whatever someone types instead of pressing a button.
 * See lib/chat/corpus.ts.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The state is a plain serialisable object with no functions on it. It travels
 * to the browser and back on every turn, so the server holds no session: there
 * is nothing to expire, nothing to evict, and a person who reloads mid-funnel
 * is exactly where they were.
 */

export type ChatStep =
  /** Before anything: greeting plus the three branches. */
  | "branch"
  /** Every branch asks for this, immediately after the branch's own line. */
  | "phone"
  /** AI literacy only, and it gates nothing - both answers go to `age`. */
  | "readiness"
  /** AI literacy only. */
  | "age"
  /** Future readiness only, and skipped when no YouTube id is configured. */
  | "video"
  /** Just exploring only. The testimonial, then straight on. */
  | "testimonial"
  /** Terminal. The WhatsApp send has been attempted; free text is open. */
  | "done";

export type ChatState = {
  step: ChatStep;
  branch: ChatBranchId | null;
  phone: string | null;
  readiness: ChatReadinessId | null;
  childAge: number | null;
  /** Set once the send has been ATTEMPTED, whatever the outcome. */
  delivered: boolean;
};

export const INITIAL_STATE: ChatState = {
  step: "branch",
  branch: null,
  phone: null,
  readiness: null,
  childAge: null,
  delivered: false,
};

/**
 * What each branch does after the phone number is in hand.
 *
 * A table rather than a switch, so the three paths are readable side by side
 * and adding a fourth is one row. `after` is consulted in order, and the first
 * step whose guard passes is taken.
 */
const AFTER_PHONE: Record<ChatBranchId, readonly ChatStep[]> = {
  // Show them what a parent noticed, then send.
  exploring: ["testimonial"],
  // Readiness, then the child's age, then send. Both readiness answers lead to
  // the same place - it is captured because it is worth knowing, not because it
  // changes the path.
  ai_literacy: ["readiness", "age"],
  // The film, then send. Skipped whole if no id is configured.
  future_readiness: ["video"],
};

/** True when a step has everything it needs to be worth showing. */
function isReachable(step: ChatStep): boolean {
  // An empty id would render a player with no video in it. Skip rather than
  // show a broken frame, and the branch still completes.
  if (step === "video") return CHAT_MEDIA.youtubeId.trim().length > 0;
  return true;
}

/**
 * The next step after `from`, given the branch.
 *
 * Returns "done" once the branch's list is exhausted, which is the signal to
 * attempt the WhatsApp send.
 */
export function nextStep(state: ChatState, from: ChatStep): ChatStep {
  if (!state.branch) return "branch";

  const path = AFTER_PHONE[state.branch];

  // `phone` is common to all three, so it hands over to the head of the list.
  const remaining =
    from === "phone" ? path : path.slice(path.indexOf(from) + 1);

  for (const step of remaining) {
    if (isReachable(step)) return step;
  }

  return "done";
}

/* ═══════════════════════════════════════════════════════ Transitions ══ */

export type ChatAction =
  | { type: "branch"; branch: ChatBranchId }
  | { type: "phone"; phone: string }
  | { type: "readiness"; readiness: ChatReadinessId }
  | { type: "age"; childAge: number }
  | { type: "watched" };

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
    case "branch":
      if (state.step !== "branch") return state;
      return { ...state, branch: action.branch, step: "phone" };

    case "phone": {
      if (state.step !== "phone") return state;
      const next = { ...state, phone: action.phone };
      return { ...next, step: nextStep(next, "phone") };
    }

    case "readiness": {
      if (state.step !== "readiness") return state;
      const next = { ...state, readiness: action.readiness };
      return { ...next, step: nextStep(next, "readiness") };
    }

    case "age": {
      if (state.step !== "age") return state;
      const next = { ...state, childAge: action.childAge };
      return { ...next, step: nextStep(next, "age") };
    }

    case "watched": {
      // BOTH media steps, not just the video. `watched` means "the thing on
      // screen has been seen"; which thing that is depends on the branch, and
      // naming only `video` here left the exploring branch stuck on its
      // testimonial with no action that could advance it.
      if (state.step !== "video" && state.step !== "testimonial") return state;
      return { ...state, step: nextStep(state, state.step) };
    }

    default:
      return state;
  }
}

/**
 * True when the funnel has just completed and the message has not been sent.
 *
 * `delivered` is what stops a reloaded tab, a double-submit, or a replayed
 * state from messaging the same parent twice. It is set by the route once the
 * send has been ATTEMPTED - not once it has succeeded - because a retry loop
 * driven by the client is a way to get a number flooded.
 */
export function shouldDeliver(state: ChatState): boolean {
  return state.step === "done" && !state.delivered && Boolean(state.phone);
}
