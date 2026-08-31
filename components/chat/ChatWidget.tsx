"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CHAT_INTRO,
  CHAT_BRANCHES,
  CHAT_PHONE_STEP,
  CHAT_AGE_STEP,
  CHAT_MEDIA,
  CHAT_CLOSING,
  CHAT_ANSWERS,
  CHAT_EXPLORING_REASON,
  CHAT_EXPLORING_AI_USE,
  CHAT_EXPLORING_UNDERSTAND,
  CHAT_EXPLORING_CURIOUS,
  CHAT_LITERACY_INTEREST,
  CHAT_LITERACY_AI_USE,
  CHAT_LITERACY_CONCERN,
  CHAT_LITERACY_PROPERLY,
  CHAT_LITERACY_DEVELOP,
  CHAT_LITERACY_INSIGHT,
  CHAT_FUTURE_PRIORITY,
  CHAT_FUTURE_FOLLOWUP,
  CHAT_FUTURE_PERSPECTIVE,
  CHAT_RESOURCES,
  CHAT_TESTIMONIAL,
  CHAT_WORKSHOP,
  CHAT_EXPLORE,
  CHAT_SOCIAL,
  CHAT_COMMUNITY,
  CHAT_HUMAN,
  CHAT_WHATSAPP_OFFER,
  type ChatBranchId,
  type ChatFuturePriorityId,
} from "@/content/chatbot";
import { GALLERY_PHOTOS } from "@/content/home";
import {
  INITIAL_STATE,
  canAsk,
  resourceOptions,
  hubExhausted,
  type ChatAction,
  type ChatState,
  type ResourceId,
  type SeenId,
} from "@/lib/chat/flow";
import { normalizeIndianMobile } from "@/lib/phone";
import { publicStorageUrl } from "@/lib/storage";
import { SOCIAL_LINKS, COMMUNITY_INVITE, whatsappHref } from "@/lib/site";
import { Wordmark } from "@/components/brand/Wordmark";
import { YouTubeStep } from "@/components/chat/YouTubeStep";

/**
 * The chat widget.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE SERVER OWNS THE STATE; THIS FILE OWNS THE PIXELS.
 *
 * Every transition is a round trip. That looks wasteful for a script that could
 * obviously run in the browser, and it is the point: the step is what decides
 * whether a WhatsApp message fires, so it is decided somewhere a visitor cannot
 * edit. What comes back is the authority, and this component renders it.
 *
 * The transcript, by contrast, is purely local. It is a rendering of what has
 * happened, not a source of truth, so it is never sent anywhere.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT CHANGED IN v2: THERE IS A HUB IN THE MIDDLE NOW.
 *
 * v1 was three straight lines - branch, phone, a step, done - so this component
 * had four `case`s to narrate and four controls to render. The flow now runs
 * discovery per branch, lands everyone on `resources`, and returns there after
 * every resource. That makes the widget's job bigger in exactly one way: the
 * SAME step can be arrived at many times, so anything that must be said only
 * once has to be tracked here rather than re-derived.
 *
 * See `sung` below. Deriving "have we said the insight yet?" by scanning `log`
 * for the string was the alternative, and it was rejected: it makes the copy in
 * content/chatbot.ts load-bearing for control flow, so an editor fixing a typo
 * would silently make a paragraph repeat.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * A link rendered inside a bubble.
 *
 * `seen` is what pressing it reports to the flow, and it is optional on
 * purpose: Instagram, YouTube and the parent community all stop being offered
 * once they have been opened, but the handoff to a person never does - see
 * `resourceOptions` in lib/chat/flow.ts, where `human` is deliberately
 * unfilterable.
 */
type BubbleLink = {
  key: string;
  label: string;
  href: string;
  seen?: SeenId;
};

type Bubble = {
  id: number;
  from: "bot" | "user";
  text: string;
  /** Rendered instead of text, when the bubble is a step's media. */
  media?: "testimonial" | "youtube" | "photos" | "links";
  /** Only ever set on a "links" bubble. */
  links?: BubbleLink[];
};

let bubbleId = 0;
const bubble = (
  from: Bubble["from"],
  text: string,
  media?: Bubble["media"],
  links?: BubbleLink[],
): Bubble => ({
  id: ++bubbleId,
  from,
  text,
  media,
  links,
});

/**
 * The label for an option id, from whichever list owns it.
 *
 * Falls back to the raw id rather than an empty string. An empty user bubble is
 * indistinguishable from a rendering bug; a bubble reading `already_using` at
 * least says what was pressed, and points at the list that is out of step.
 */
function labelOf(
  options: readonly { id: string; label: string }[],
  id: string,
): string {
  return options.find((o) => o.id === id)?.label ?? id;
}

/**
 * The follow-up question for whatever priority was chosen, or null.
 *
 * The guard is not paranoia. `state.reason` is a plain string on the state - see
 * the note on ChatState in lib/chat/flow.ts for why it is not a union - so an
 * old tab holding a `reason` from a list that has since been edited can arrive
 * here with an id that no longer has a question written for it. Rendering
 * nothing beats crashing the panel a parent is halfway through.
 */
function followupFor(state: ChatState) {
  const id = state.reason;
  if (!id || !(id in CHAT_FUTURE_FOLLOWUP)) return null;
  return CHAT_FUTURE_FOLLOWUP[id as ChatFuturePriorityId];
}

/**
 * The way back to the hub, worded so it does not read as a brush-off.
 *
 * It is offered on the `human` step, immediately under an invitation to message
 * a real person, so "Back" or "Cancel" would both read as retracting the thing
 * the parent just asked for. "Something else" says what it does - the WhatsApp
 * link stays exactly where it is, and this is an addition to it rather than an
 * escape from it.
 */
const BACK_LABEL = "Something else";

/** The keys of the paragraphs that must be said at most once per conversation. */
type SungKey = "literacy_insight" | "future_perspective" | "exploring_curious";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ChatState>(INITIAL_STATE);
  const [log, setLog] = useState<Bubble[]>([]);
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState<"phone" | "age" | null>(null);
  const [draft, setDraft] = useState("");

  const scroller = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  /**
   * WHAT HAS ALREADY BEEN SAID ONCE.
   *
   * Each branch has a payoff paragraph - the insight, the perspective, the
   * explainer - said on the way into the hub. The hub is returned to after
   * every single resource, so without this the parent who looks at three things
   * is lectured three times.
   *
   * A ref rather than state: nothing renders from it, and it is read inside
   * `narrate` immediately after being written, which a `useState` setter cannot
   * promise within the same turn.
   */
  const sung = useRef<Set<SungKey>>(new Set());

  /* The opening lines, written once the panel is first opened rather than on
     mount — a transcript that exists before anyone has looked at it will be
     scrolled to the bottom of an empty box. */
  useEffect(() => {
    if (open && log.length === 0) {
      setLog([bubble("bot", CHAT_INTRO.greeting), bubble("bot", CHAT_INTRO.prompt)]);
    }
  }, [open, log.length]);

  /* Follow the conversation down. `end` rather than `nearest` so a tall media
     bubble does not leave the newest line off-screen. */
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [log, busy]);

  /* Escape closes it. A fixed overlay with no keyboard exit is a trap for
     anyone not using a mouse. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const say = useCallback(
    (from: Bubble["from"], text: string, media?: Bubble["media"], links?: BubbleLink[]) => {
      setLog((prev) => [...prev, bubble(from, text, media, links)]);
    },
    [],
  );

  /** A multi-line paragraph, one bubble per line. Reads as speech, not a wall. */
  const sayAll = useCallback(
    (lines: readonly string[]) => {
      setLog((prev) => [...prev, ...lines.map((line) => bubble("bot", line))]);
    },
    [],
  );

  /**
   * One request shape for every turn.
   *
   * `utm` is read at send time from the URL the visitor actually arrived on, so
   * a lead carries its campaign without a cookie or a tracker.
   */
  const post = useCallback(
    async (payload: Record<string, unknown>) => {
      setBusy(true);
      setInvalid(null);
      try {
        const params = new URLSearchParams(window.location.search);
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state,
            utm: {
              source: params.get("utm_source") ?? undefined,
              medium: params.get("utm_medium") ?? undefined,
              campaign: params.get("utm_campaign") ?? undefined,
            },
            ...payload,
          }),
        });

        const data = await response.json().catch(() => null);
        if (!data) {
          say("bot", CHAT_ANSWERS.unavailable);
          return null;
        }

        if (data.invalid) {
          setInvalid(data.invalid);
          return null;
        }
        if (data.state) setState(data.state as ChatState);
        return data as {
          reply?: string;
          closing?: string;
          state?: ChatState;
          /** Set by the route when a typed question was about fees, enrolling
              or calling - see `leadIntent` in lib/chat/flow.ts. */
          hot?: boolean;
        };
      } catch {
        say("bot", CHAT_ANSWERS.unavailable);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [state, say],
  );

  /* ═══════════════════════════════════════════════════ The links ══ */

  /**
   * The external destinations, resolved from lib/site.ts rather than written
   * here.
   *
   * ONE LIST, and it is the footer's. A handle changes about once a year and it
   * changes in one place; a chatbot pointing at last year's Instagram is the
   * exact failure content/chatbot.ts refuses to make possible by keeping the
   * URLs out of itself.
   *
   * `whatsappHref()` returns null when no business number is configured - a
   * preview deployment, usually - and `COMMUNITY_INVITE` can be null for the
   * same kind of reason. Both are filtered out below rather than rendered as
   * dead anchors.
   */
  /* `useMemo` with no dependencies, and it is not premature. This list is a
     dependency of `narrate`, which is a dependency of `commit`, which reaches
     the YouTube player's `onWatched` - and that prop is in an effect list that
     tears the player down and rebuilds it. Rebuilding the array every render
     would restart the film on every keystroke in the composer. */
  const socialLinks: BubbleLink[] = useMemo(
    () =>
      SOCIAL_LINKS.filter(
        (link) => link.key === "instagram" || link.key === "youtube",
      ).map((link) => ({
        key: link.key,
        label: link.label,
        href: link.href,
        // The keys happen to match the SeenId spellings, but the mapping is
        // written out rather than assumed - SocialKey also contains "facebook"
        // and "whatsapp", which are not things the hub filters on.
        seen: link.key === "instagram" ? ("instagram" as const) : ("youtube" as const),
      })),
    [],
  );

  const humanLink = useCallback((): BubbleLink[] => {
    const href = whatsappHref();
    if (!href) return [];
    // No `seen`: the way out to a person is never filtered from the hub.
    return [{ key: "human", label: CHAT_HUMAN.cta, href }];
  }, []);

  /* ══════════════════════════════════════════════════ Narration ══ */

  /**
   * Whatever the new step is, narrate it.
   *
   * Kept in one place so a step added to the machine cannot arrive on screen
   * with nothing said about it - and now there are twenty of them, which is
   * precisely why the alternative of narrating inside each handler was
   * rejected. A step reachable from three handlers would need its lines in
   * three places, and they would drift.
   */
  const narrate = useCallback(
    (next: ChatState, closing?: string) => {
      /** The one line said on the way into a branch. */
      const lead = () => {
        const branch = CHAT_BRANCHES.find((b) => b.id === next.branch);
        if (branch) say("bot", branch.lead);
      };

      /** Says a paragraph the first time only. See `sung`. */
      const once = (key: SungKey, lines: readonly string[], then?: string) => {
        if (sung.current.has(key)) return;
        sung.current.add(key);
        sayAll(lines);
        if (then) say("bot", then);
      };

      switch (next.step) {
        /* ── Just exploring ── */

        case "exploring_reason":
          lead();
          say("bot", CHAT_EXPLORING_REASON.ask);
          break;
        case "exploring_ai_use":
          say("bot", CHAT_EXPLORING_AI_USE.ask);
          break;
        case "exploring_understand":
          say("bot", CHAT_EXPLORING_UNDERSTAND.ask);
          break;

        /* ── AI literacy ── */

        case "literacy_interest":
          lead();
          say("bot", CHAT_LITERACY_INTEREST.ask);
          break;
        case "literacy_ai_use":
          say("bot", CHAT_LITERACY_AI_USE.ask);
          break;
        case "literacy_concern":
          say("bot", CHAT_LITERACY_CONCERN.ask);
          break;
        case "literacy_develop":
          // The "learning AI is not learning buttons" paragraph earns the
          // question that follows it. Said here rather than in the handler
          // because this step has exactly one way in.
          sayAll(CHAT_LITERACY_PROPERLY.body);
          say("bot", CHAT_LITERACY_DEVELOP.ask);
          break;

        /* ── Future readiness ── */

        case "future_priority":
          lead();
          say("bot", CHAT_FUTURE_PRIORITY.ask);
          break;
        case "future_followup": {
          const followup = followupFor(next);
          // Nothing written for this priority: the flow routes straight to the
          // age step in that case, so this is belt and braces. Saying nothing
          // beats saying "undefined".
          if (followup) say("bot", followup.ask);
          break;
        }
        case "future_age":
          say("bot", CHAT_AGE_STEP.ask);
          break;

        /* ── The hub ── */

        case "resources": {
          /**
           * THE PAYOFF COMES BEFORE THE MENU, AND ONLY EVER ONCE.
           *
           * Each branch has earned a different paragraph by the time it lands
           * here, and which one is decided by the branch rather than by the
           * step, because all three branches share this step. `curious` is the
           * odd one: it is the only exploring answer that arrives with nothing
           * asked after it, so it is the only one owed an explanation.
           */
          if (next.branch === "ai_literacy") {
            once("literacy_insight", CHAT_LITERACY_INSIGHT.body, CHAT_LITERACY_INSIGHT.then);
          } else if (next.branch === "future_readiness") {
            once("future_perspective", CHAT_FUTURE_PERSPECTIVE.body);
          } else if (next.branch === "exploring" && next.reason === "curious") {
            once("exploring_curious", CHAT_EXPLORING_CURIOUS.body);
          }

          say("bot", hubExhausted(next) ? CHAT_RESOURCES.exhausted : CHAT_RESOURCES.ask);
          break;
        }

        /* ── The resources ── */

        case "testimonial":
          say("bot", CHAT_TESTIMONIAL.offer);
          say("bot", CHAT_MEDIA.testimonial.caption, "testimonial");
          break;
        case "testimonial_reaction":
          say("bot", CHAT_TESTIMONIAL.reaction);
          break;
        case "workshop":
          say("bot", CHAT_WORKSHOP.ask);
          break;
        case "workshop_photos":
          say("bot", "", "photos");
          break;
        case "workshop_videos":
          say("bot", "", "youtube");
          break;
        case "social":
          say("bot", CHAT_SOCIAL.body, "links", socialLinks);
          break;
        case "community":
          say(
            "bot",
            CHAT_COMMUNITY.body,
            "links",
            COMMUNITY_INVITE
              ? [
                  {
                    key: "community",
                    label: CHAT_COMMUNITY.cta,
                    href: COMMUNITY_INVITE,
                    seen: "community" as const,
                  },
                ]
              : [],
          );
          break;
        case "human":
          say("bot", CHAT_HUMAN.body, "links", humanLink());
          break;

        /* ── The offer, and the number ── */

        case "whatsapp_offer":
          say("bot", CHAT_WHATSAPP_OFFER.ask);
          break;
        case "phone":
          say("bot", CHAT_PHONE_STEP.ask);
          break;

        case "done":
          if (closing) say("bot", closing);
          say("bot", CHAT_CLOSING.openFloor);
          break;
      }
    },
    [say, sayAll, socialLinks, humanLink],
  );

  /* ═══════════════════════════════════════════════════ Handlers ══ */

  /**
   * The three lines every button press performs, written once.
   *
   * Fifteen copies of `say` / `post` / `narrate` was the alternative - one per
   * member of `ChatAction` - and it was rejected for the ordinary reason: the
   * order of those three calls is the thing that must not vary, and fifteen
   * chances to get it wrong is fifteen chances to get it wrong. The named
   * handlers below still exist one per action type, because THAT is what makes
   * the control table readable; they just do not each re-implement the turn.
   *
   * `label` may be null for a press that should not appear as a user bubble -
   * the "Continue" under a video is a control, not something a parent said.
   */
  const commit = useCallback(
    async (label: string | null, action: ChatAction) => {
      if (label) say("user", label);
      const data = await post({ action });
      if (data?.state) narrate(data.state, data.closing);
      return data;
    },
    [say, post, narrate],
  );

  /* ── Opening ── */

  const chooseBranch = (branch: ChatBranchId) =>
    void commit(labelOf(CHAT_BRANCHES, branch), { type: "branch", branch });

  /* ── Discovery ── */

  const submitReason = (reason: string) =>
    void commit(labelOf(CHAT_EXPLORING_REASON.options, reason), { type: "reason", reason });

  /** Shared by both branches that ask it; the step tells the flow them apart. */
  const submitAiUse = (aiUse: string) =>
    void commit(
      labelOf(
        state.step === "literacy_ai_use"
          ? CHAT_LITERACY_AI_USE.options
          : CHAT_EXPLORING_AI_USE.options,
        aiUse,
      ),
      { type: "ai_use", aiUse },
    );

  const submitUnderstand = (understand: string) =>
    void commit(labelOf(CHAT_EXPLORING_UNDERSTAND.options, understand), {
      type: "understand",
      understand,
    });

  const submitInterest = (interest: string) =>
    void commit(labelOf(CHAT_LITERACY_INTEREST.options, interest), {
      type: "interest",
      interest,
    });

  const submitConcern = (concern: string) =>
    void commit(labelOf(CHAT_LITERACY_CONCERN.options, concern), { type: "concern", concern });

  const submitDevelop = (develop: string) =>
    void commit(labelOf(CHAT_LITERACY_DEVELOP.options, develop), { type: "develop", develop });

  const submitPriority = (priority: string) =>
    void commit(labelOf(CHAT_FUTURE_PRIORITY.options, priority), { type: "priority", priority });

  const submitFollowup = (followup: string) =>
    void commit(labelOf(followupFor(state)?.options ?? [], followup), {
      type: "followup",
      followup,
    });

  /** The field hands over a string; the action carries a number. */
  const submitAge = (value: string) =>
    void commit(value, { type: "age", childAge: Number(value) });

  /* ── The hub ── */

  const submitResource = async (resource: ResourceId) => {
    const label = labelOf(CHAT_RESOURCES.options, resource);

    // "What is BrainLIT?" has no step of its own - the flow marks it seen and
    // hands the hub straight back - so the explainer is said here. Deliberately
    // NOT gated on `sung.exploring_curious`: this one was asked for, and a
    // button that answers with silence reads as broken.
    if (resource === "explore") {
      say("user", label);
      sayAll(CHAT_EXPLORE.body);
      const data = await post({ action: { type: "resource", resource } });
      if (data?.state) narrate(data.state, data.closing);
      return;
    }

    await commit(label, { type: "resource", resource });
  };

  /* ── Inside a resource ── */

  /**
   * "I have seen it."
   *
   * Fired by the Continue under a media card and by pressing an external link.
   * The flow turns this into `resources` for everything except the parent
   * video, which earns one follow-up question.
   */
  const submitSeen = useCallback(
    async (what: SeenId, label?: string) => {
      // Said before the hub comes back, so it reads as a reply to the tap
      // rather than as an afterthought under the next menu.
      if (what === "community") say("bot", CHAT_COMMUNITY.after);

      /**
       * THE SOCIAL STEP DOES NOT MOVE, SO IT MUST NOT BE NARRATED.
       *
       * Marking a social link now keeps the step - that is what stops the
       * second link being stranded - and `narrate` says what has been ARRIVED
       * at. Running it here would post the paragraph and both links a second
       * time on every tap, so the state is updated and nothing is said. The
       * links and the way out are already on screen.
       */
      if (state.step === "social") {
        if (label) say("user", label);
        await post({ action: { type: "seen", what } });
        return;
      }

      await commit(label ?? null, { type: "seen", what });
    },
    [commit, post, say, state.step],
  );

  /**
   * Out of a resource without having taken it.
   *
   * NO USER BUBBLE - `commit` is passed null. This is navigation, not something
   * a parent said, and the same reasoning keeps the Continue under a video out
   * of the transcript. A conversation littered with "Something else" reads as
   * an argument with a menu.
   *
   * The flow ignores this anywhere but the eight resource steps, so it cannot
   * be used to jump the discovery questions - see the `back` case in
   * lib/chat/flow.ts.
   */
  const goBack = () => void commit(null, { type: "back" });

  const submitReaction = (reaction: string) =>
    void commit(labelOf(CHAT_TESTIMONIAL.options, reaction), { type: "reaction", reaction });

  /* ── The offer ── */

  const submitWhatsapp = async (answer: "yes" | "later") => {
    const label = labelOf(CHAT_WHATSAPP_OFFER.options, answer);
    // "Maybe later" is a real answer, so it gets a real reply before the hub
    // returns - otherwise declining reads as being ignored.
    if (answer === "later") {
      say("user", label);
      say("bot", CHAT_WHATSAPP_OFFER.later);
      const data = await post({ action: { type: "whatsapp", answer } });
      if (data?.state) narrate(data.state, data.closing);
      return;
    }
    await commit(label, { type: "whatsapp", answer });
  };

  const submitPhone = (phone: string) => void commit(phone, { type: "phone", phone });

  /* ── The workshop chooser ── */

  /**
   * Photos or videos - a SEPARATE action from `resource`, not a second one.
   *
   * The hub's question is "which of seven things next"; this one is "which half
   * of this one", and lib/chat/flow.ts keeps them apart so `ResourceId` never
   * has to carry two ids the hub must not offer. See the note on the action in
   * that file.
   *
   * Nothing moves if the video half is not configured - `isReachable` returns
   * the state untouched - which is why the option is filtered out of the list
   * below rather than left to fail silently.
   */
  const submitWorkshop = (which: string) =>
    void commit(labelOf(CHAT_WORKSHOP.options, which), {
      type: "workshop",
      which: which === "videos" ? "videos" : "photos",
    });

  /* ══════════════════════════════════════════════════ Free text ══ */

  async function ask(question: string) {
    say("user", question);
    setDraft("");
    const data = await post({ message: question });
    if (data?.reply) say("bot", data.reply);
    // A question about fees, enrolling or calling is not one this thing should
    // be answering alone. The reply still goes out - it may well be the right
    // passage - and a person is offered underneath it.
    if (data?.hot) say("bot", CHAT_HUMAN.body, "links", humanLink());
  }

  /**
   * Start the conversation again from nothing.
   *
   * `log` is emptied rather than re-seeded here: the effect that writes the
   * opening lines fires on `log.length === 0`, so clearing it replays the
   * greeting from the ONE place that owns that copy. Re-seeding it here would
   * be a second copy to keep in step.
   *
   * `sung` is cleared too, and it has to be: it is the only piece of the
   * conversation that does NOT live in `state`, so a restart that reset the
   * state alone would leave a second run through the same branch silently
   * missing its payoff paragraph.
   *
   * Note what this genuinely resets - `delivered` goes back to false, so a
   * person who restarts CAN reach the end and be messaged a second time. That
   * is the honest meaning of starting over, and it is bounded by the per-IP
   * turn limit; the alternative, a restart that silently cannot finish, would
   * be worse than the duplicate.
   */
  const restart = useCallback(() => {
    setState(INITIAL_STATE);
    setLog([]);
    setDraft("");
    setInvalid(null);
    sung.current = new Set();
  }, []);

  const testimonialSrc = publicStorageUrl(
    CHAT_MEDIA.testimonial.bucket,
    CHAT_MEDIA.testimonial.path,
  );

  /* One object, reused by every step whose only exit this is. Hoisted above
     the picker rather than repeated inside it so the four cases below read as
     one decision - "this step has no other way out" - rather than as four
     copies of a one-item list. */
  const backControl = {
    options: [{ id: "back", label: BACK_LABEL }],
    onPick: goBack,
  };

  /**
   * THE CONTROL FOR THE CURRENT STEP, as a table rather than a wall of JSX.
   *
   * Twenty steps is too many for a stack of `{state.step === "x" && ...}`
   * lines - which is what this was - because the answer to "what does this step
   * show?" is then spread over a hundred lines of markup. One switch returning
   * a list and a handler puts every step's control on one line, and the two
   * that are not option lists (the phone and age fields) stay in the markup
   * below where their sanitisers can be read.
   *
   * Returning null is a legitimate answer: the media steps and the link steps
   * carry their own controls inside the bubble, and `done` has only the
   * composer.
   */
  function picker(): { options: readonly { id: string; label: string }[]; onPick: (id: string) => void } | null {
    switch (state.step) {
      case "branch":
        return { options: CHAT_BRANCHES, onPick: (id) => chooseBranch(id as ChatBranchId) };

      case "exploring_reason":
        return { options: CHAT_EXPLORING_REASON.options, onPick: submitReason };
      case "exploring_ai_use":
        return { options: CHAT_EXPLORING_AI_USE.options, onPick: submitAiUse };
      case "exploring_understand":
        return { options: CHAT_EXPLORING_UNDERSTAND.options, onPick: submitUnderstand };

      case "literacy_interest":
        return { options: CHAT_LITERACY_INTEREST.options, onPick: submitInterest };
      case "literacy_ai_use":
        return { options: CHAT_LITERACY_AI_USE.options, onPick: submitAiUse };
      case "literacy_concern":
        return { options: CHAT_LITERACY_CONCERN.options, onPick: submitConcern };
      case "literacy_develop":
        return { options: CHAT_LITERACY_DEVELOP.options, onPick: submitDevelop };

      case "future_priority":
        return { options: CHAT_FUTURE_PRIORITY.options, onPick: submitPriority };
      case "future_followup": {
        const followup = followupFor(state);
        return followup ? { options: followup.options, onPick: submitFollowup } : null;
      }

      case "resources": {
        // The ids the hub still has to offer, given back their labels. Filtered
        // in CHAT_RESOURCES order rather than mapped in `resourceOptions` order
        // so the menu does not reshuffle itself between visits - a list whose
        // items move is a list that has to be re-read every time.
        const offered = new Set<ResourceId>(resourceOptions(state));
        return {
          options: CHAT_RESOURCES.options.filter((o) => offered.has(o.id)),
          onPick: (id) => void submitResource(id as ResourceId),
        };
      }

      case "testimonial_reaction":
        return { options: CHAT_TESTIMONIAL.options, onPick: submitReaction };

      case "workshop": {
        // An empty youtubeId means no film is configured, and an empty
        // GALLERY_PHOTOS means no photographs - either way the option is
        // dropped rather than rendered as a button that shows nothing. Same
        // reasoning as `isReachable` in lib/chat/flow.ts.
        const halves = CHAT_WORKSHOP.options.filter((o) =>
          o.id === "videos"
            ? CHAT_MEDIA.youtubeId.trim().length > 0
            : GALLERY_PHOTOS.length > 0,
        );
        // Both halves filtered out is a hole THIS filter opens, not one the
        // flow has: `resourceOptions` keeps offering the workshop because
        // nothing can ever be marked seen. `back` is the exit only when there
        // is otherwise none - not a second one sitting beside the chooser.
        return halves.length > 0
          ? { options: halves, onPick: submitWorkshop }
          : backControl;
      }

      /**
       * BOTH LINKS LIVE IN THE BUBBLE; THIS IS THE ONLY CONTROL.
       *
       * Marking a social link now KEEPS the step - see the `seen` case in
       * lib/chat/flow.ts - so Instagram and YouTube can both be taken. That
       * makes `back` the step's one exit rather than a convenience.
       */
      case "social":
        return backControl;

      /**
       * The handoff has no `seen` id - there is none for having read a
       * paragraph, and the hub deliberately never filters `human` out - so
       * without this the step could only be left by restarting.
       */
      case "human":
        return backControl;

      /**
       * Normally left by pressing the invite, which reports `seen` and returns
       * to the hub. Deliberately NOT given a second exit beside that. It gets
       * one only when the invite is unset - a preview deployment with no group
       * URL - because the bubble then renders no link at all.
       */
      case "community":
        return COMMUNITY_INVITE ? null : backControl;

      case "whatsapp_offer":
        return {
          options: CHAT_WHATSAPP_OFFER.options,
          onPick: (id) => void submitWhatsapp(id as "yes" | "later"),
        };

      default:
        return null;
    }
  }

  const control = picker();

  /**
   * Free text is open at EVERY step now - see `canAsk` in lib/chat/flow.ts.
   *
   * It used to be `state.step === "done" || state.step === "branch"`, which
   * meant a parent three questions into a branch who wanted to ask about fees
   * had to finish the script first. The predicate is imported rather than
   * repeated so the rule lives with the flow that enforces it.
   */
  const asking = canAsk(state);

  return (
    <>
      {/* ONLY WHEN CLOSED.
          The launcher used to swap to a violet X while the panel was open,
          which put a large dismiss button floating below the panel's own
          corner - two ways to close the same thing, in two places, one of them
          covering the page. Open, the panel owns its own controls; the
          launcher's whole job is to open it, so it stands down.

          Sits ABOVE the WhatsApp FAB rather than beside it: that button is
          `fixed right bottom z-40`, and two circles side by side on a phone is
          two thumb targets a few pixels apart. */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={false}
          aria-controls="brainlit-chat"
          className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4.5rem)] z-40 inline-flex h-20 items-center justify-end gap-2 rounded-full transition-transform duration-200 [transition-timing-function:var(--ease-out-expo)] hover:scale-105 focus-visible:scale-105"
        >
          <span className="sr-only">{`Open ${CHAT_INTRO.title}`}</span>

          {/* NAME ON THE LEFT, MARK ON THE RIGHT. The button is anchored by its
              right edge, so the mark stays put against the screen corner while
              the label extends leftwards.

              `aria-hidden` on the lockup: Wordmark renders its own role="img"
              with a label, and the sr-only span above is the one that should be
              read - it says what the button DOES. */}
          <span aria-hidden="true" className="inline-flex items-center gap-2">
            {/* THE WORDS GET A PLATE; THE MARK DOES NOT.
                Gradient type has no fixed contrast, and this floats over both
                halves of the page, so on the dark bands a white halo stopped
                reading as an outline and started reading as a smudge. The only
                reliable fix is to stop depending on the background. */}
            <span className="rounded-full bg-paper/92 px-3 py-1.5 shadow-[0_2px_8px_-2px_rgba(11,16,32,0.25)] ring-1 ring-mist/70 backdrop-blur-sm">
              <span className="font-wordmark text-brand-gradient text-[1.05rem] leading-none font-semibold tracking-tight whitespace-nowrap">
                {/* The SAME string as the panel header, not a second copy. Edit
                    it once, in content/chatbot.ts. */}
                {CHAT_INTRO.title}
              </span>
            </span>
            <Wordmark
              markOnly
              href={null}
              markClassName="h-16 drop-shadow-[0_2px_8px_rgba(11,16,32,0.3)]"
            />
          </span>
        </button>
      )}

      {open && (
        <div
          id="brainlit-chat"
          ref={panel}
          role="dialog"
          aria-label={CHAT_INTRO.title}
          /* The offset and the height cap are a PAIR, both derived from what is
             actually below the panel rather than chosen.
             It used to clear the launcher as well as the WhatsApp FAB - 10.5rem
             of reserved space. The launcher now unmounts while the panel is
             open, so the only thing left to clear is the FAB: bottom 1rem, 3.5rem
             tall, top edge at 4.5rem. 5.5rem clears it with a 1rem gap and hands
             the other 5rem back to the conversation.
             The height cap subtracts that offset plus room at the top; raise one
             without the other and the panel grows off the top of a short
             screen.

             `h-`, NOT `max-h-`. A max-height only caps - the flex column still
             collapsed to whatever the transcript happened to contain, so a
             fresh conversation with two lines in it rendered a 302px box no
             matter how generous the ceiling was. An explicit height gives the
             panel the same presence on its first turn as on its twentieth, and
             the message list inside is `flex-1`, so the extra room goes to the
             conversation rather than to dead space. */
          className="fixed right-[max(0.75rem,env(safe-area-inset-right))] bottom-[calc(max(1rem,env(safe-area-inset-bottom))+5.5rem)] z-40 flex h-[min(40rem,calc(100dvh-8.5rem))] w-[min(30rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl bg-paper shadow-[0_24px_60px_-24px_rgba(11,16,32,0.45)] ring-1 ring-mist"
        >
          {/* `href={null}` matters. Wordmark links to the homepage by default,
              and a logo that navigates away is a logo that throws away a
              half-finished conversation - the state lives in this component,
              so leaving the page loses it. Here it is identification, not a
              link, and it renders as a labelled <span> rather than an <a>. */}
          <header className="flex items-center gap-3 border-b border-mist px-4 py-3">
            <Wordmark markOnly href={null} markClassName="h-9" />
            {/* `flex-1` so the text takes the slack and pushes the control to
                the far edge, rather than a `justify-between` that would also
                fling the mark away from the words it belongs to. */}
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold text-ink">
                {CHAT_INTRO.title}
              </p>
              <p className="text-xs text-slate">{CHAT_INTRO.subtitle}</p>
            </div>

            <button
              type="button"
              onClick={restart}
              // Disabled mid-turn. Resetting while a request is in flight would
              // leave the reply to land in a conversation that no longer exists.
              disabled={busy}
              title="Start over"
              className="grid size-8 shrink-0 place-items-center rounded-full text-slate transition-colors hover:bg-mist/60 hover:text-ink focus-visible:bg-mist/60 disabled:opacity-40"
            >
              <span className="sr-only">Start the conversation over</span>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-none stroke-current stroke-2">
                <path d="M20 12a8 8 0 1 1-2.34-5.66" strokeLinecap="round" />
                <path d="M20 4v4.5h-4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* CLOSE LIVES HERE NOW, next to restart.
                Both are things you do TO the conversation, so they belong
                together in its own chrome rather than one being a slab floating
                over the page below. Not disabled while busy, unlike restart -
                a person must always be able to leave, and closing loses nothing
                that a reopen does not restore. */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              title="Close"
              className="-mr-1 grid size-8 shrink-0 place-items-center rounded-full text-slate transition-colors hover:bg-mist/60 hover:text-ink focus-visible:bg-mist/60"
            >
              <span className="sr-only">Close the chat</span>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-none stroke-current stroke-2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          {/* `aria-live="polite"`: replies arrive without focus moving, and a
              screen reader user would otherwise never learn they had. */}
          <div
            ref={scroller}
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {log.map((b) => (
              <Message
                key={b.id}
                bubble={b}
                testimonialSrc={testimonialSrc}
                onSeen={submitSeen}
              />
            ))}
            {busy && <p className="text-xs text-slate">{CHAT_ANSWERS.thinking}</p>}
          </div>

          <div className="border-t border-mist px-4 py-3">
            {control && (
              <Options options={control.options} disabled={busy} onPick={control.onPick} />
            )}

            {state.step === "phone" && (
              <Field
                label={CHAT_PHONE_STEP.placeholder}
                note={CHAT_PHONE_STEP.note}
                error={invalid === "phone" ? CHAT_PHONE_STEP.invalid : null}
                inputMode="tel"
                autoComplete="tel-national"
                disabled={busy}
                /**
                 * The SAME normaliser the server uses, not a hand-rolled
                 * `replace(/\D/g,"").slice(0,10)`.
                 *
                 * That naive version has a nasty failure: a parent pasting
                 * "+91 98765 43210" from their contacts gets 12 digits, and
                 * cutting the first ten silently produces "9198765432" - a
                 * different, valid-looking, wrong number. normalizeIndianMobile
                 * strips the country code and the trunk zero first, so the
                 * paste lands as the ten digits they meant.
                 *
                 * It returns at most 10 digits, so letters, spaces, "+" and an
                 * eleventh keystroke all simply never appear.
                 */
                sanitise={normalizeIndianMobile}
                onSubmit={submitPhone}
              />
            )}

            {state.step === "future_age" && (
              <Field
                label={CHAT_AGE_STEP.placeholder}
                note={CHAT_AGE_STEP.note}
                error={invalid === "age" ? CHAT_AGE_STEP.invalid : null}
                inputMode="numeric"
                disabled={busy}
                // Digits only, and two of them: the accepted range is 6 to 18,
                // so a third character could only ever be a typo.
                sanitise={(raw) => raw.replace(/\D/g, "").slice(0, 2)}
                onSubmit={submitAge}
              />
            )}

            {asking && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = draft.trim();
                  if (q && !busy) void ask(q);
                }}
                className="mt-2 flex gap-2"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={busy}
                  placeholder="Type a question"
                  aria-label="Type a question"
                  maxLength={600}
                  className="min-w-0 flex-1 rounded-full border border-mist px-3 py-2 text-sm text-ink outline-none focus-visible:border-violet"
                />
                <button
                  type="submit"
                  disabled={busy || !draft.trim()}
                  className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════ Pieces ══ */

/**
 * The film, wrapped so its callback is stable.
 *
 * YouTubeStep takes a zero-argument `onWatched` and has it in an effect
 * dependency list, where it tears the player down and rebuilds it on every
 * change. `onSeen` needs an argument, so binding it inline in `Message` would
 * hand the player a new function on every render. One `useCallback` behind one
 * component is the cheapest fix, and it cannot be written inside `Message`
 * because that branch is conditional and hooks are not.
 */
function VideoBubble({ onSeen }: { onSeen: (what: SeenId) => void }) {
  const watched = useCallback(() => onSeen("workshop_videos"), [onSeen]);
  return <YouTubeStep videoId={CHAT_MEDIA.youtubeId} onWatched={watched} />;
}

function Message({
  bubble: b,
  testimonialSrc,
  onSeen,
}: {
  bubble: Bubble;
  testimonialSrc: string | null;
  onSeen: (what: SeenId, label?: string) => void;
}) {
  if (b.media === "youtube") {
    return <VideoBubble onSeen={onSeen} />;
  }

  /**
   * THE WORKSHOP PHOTOGRAPHS, as a strip rather than a grid.
   *
   * Three of fourteen - `CHAT_MEDIA.photoCount` - because section 18 of the
   * brief asks what this visitor should see NEXT, not how much can be shown.
   * Horizontal and scrollable, so the panel's height is not eaten by a stack:
   * the transcript above has to stay visible or the answer to the previous
   * question scrolls away while the parent looks at pictures.
   *
   * Plain `<img>`, not next/image. These sit inside a scroller in a fixed panel
   * with no layout to reserve and no LCP to protect, and they are already
   * 800px WebP - see the note above GALLERY_PHOTOS in content/home.ts. The
   * optimiser would cost a round trip per frame to save nothing.
   */
  if (b.media === "photos") {
    const photos = GALLERY_PHOTOS.slice(0, CHAT_MEDIA.photoCount);
    if (photos.length === 0) return null;

    return (
      <div className="overflow-hidden rounded-xl ring-1 ring-mist">
        <div className="flex gap-2 overflow-x-auto p-2">
          {photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.src}
              src={photo.src}
              // The label is the caption written for THIS frame, so it is the
              // alt text as well - see the note in content/home.ts.
              alt={photo.label}
              loading="lazy"
              decoding="async"
              className="h-24 w-32 shrink-0 rounded-lg object-cover"
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => onSeen("workshop_photos")}
          // Matches the video step's control: same job, same weight. See the
          // note in YouTubeStep for why a bare tinted label loses under media.
          className="w-full bg-violet px-3 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet/90 focus-visible:bg-violet/90"
        >
          Continue
        </button>
      </div>
    );
  }

  /**
   * A paragraph with real links under it.
   *
   * `target="_blank"` with `rel="noopener noreferrer"`: opening in the same tab
   * would destroy the conversation, because the state lives in this component
   * and there is nothing on the server to come back to.
   *
   * Pressing one ALSO reports it as seen, so the hub stops offering what has
   * already been opened. The report goes out on the same click that follows the
   * link - the fetch is not cancelled by a new tab opening, and doing it on
   * `onClick` rather than after a return means it still happens for the parent
   * who never comes back to the tab.
   */
  if (b.media === "links") {
    return (
      <div className="w-fit max-w-[90%] space-y-2">
        <p className="w-fit rounded-2xl rounded-bl-sm bg-mist/50 px-3 py-2 text-sm text-ink">
          {b.text}
        </p>
        {b.links && b.links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {b.links.map((link) => (
              <a
                key={link.key}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (link.seen) onSeen(link.seen, link.label);
                }}
                className="rounded-full border border-violet px-3 py-1.5 text-sm font-medium text-violet transition-colors hover:bg-violet hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (b.media === "testimonial") {
    return (
      <figure className="overflow-hidden rounded-xl ring-1 ring-mist">
        {testimonialSrc && (
          <video
            src={testimonialSrc}
            poster={CHAT_MEDIA.testimonial.poster}
            controls
            playsInline
            preload="none"
            // The step advances when it ENDS, and also on the button below.
            // Watching a two-minute testimonial to completion inside a chat
            // window is rare, and a person who has seen enough should not be
            // stuck with no way forward.
            onEnded={() => onSeen("testimonial")}
            aria-label={b.text}
            className="aspect-video w-full bg-ink object-cover"
          >
            <track kind="captions" srcLang="en" label="English" />
          </video>
        )}
        <figcaption className="px-3 py-2 text-xs text-slate">{b.text}</figcaption>
        <button
          type="button"
          onClick={() => onSeen("testimonial")}
          // Matches the video step's control: same job, same weight. See the
          // note in YouTubeStep for why a bare tinted label loses under media.
          className="w-full bg-violet px-3 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet/90 focus-visible:bg-violet/90"
        >
          Continue
        </button>
      </figure>
    );
  }

  const mine = b.from === "user";
  return (
    <p
      className={
        mine
          ? "ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-ink px-3 py-2 text-sm text-paper"
          : "w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-mist/50 px-3 py-2 text-sm text-ink"
      }
    >
      {b.text}
    </p>
  );
}

function Options({
  options,
  disabled,
  onPick,
}: {
  /* `readonly`, so the `as const` lists in content/chatbot.ts can be passed
     straight in. They used to be copied through `.map((o) => ({ ...o }))` for
     no reason but the type, which is a per-render allocation to satisfy a
     mutability the component never wanted. */
  options: readonly { id: string; label: string }[];
  disabled: boolean;
  onPick: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(o.id)}
          className="rounded-full border border-violet px-3 py-1.5 text-sm font-medium text-violet transition-colors hover:bg-violet hover:text-white disabled:opacity-40"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * A single-line entry with a SANITISER rather than a validator.
 *
 * The difference matters. A validator lets someone type "nine seven..." and
 * tells them off afterwards; a sanitiser means the wrong character never
 * appears, so the field cannot hold a value the server would reject. Both
 * fields here are numeric, and both still get checked again on the server -
 * this is about not letting a parent type something that was never going to
 * work.
 */
function Field({
  label,
  note,
  error,
  inputMode,
  autoComplete,
  disabled,
  sanitise,
  onSubmit,
}: {
  label: string;
  note: string;
  error: string | null;
  inputMode: "tel" | "numeric";
  /** Runs on every change, including paste. Returns what the field may hold. */
  sanitise: (raw: string) => string;
  autoComplete?: string;
  disabled: boolean;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = value.trim();
        if (v && !disabled) {
          onSubmit(v);
          setValue("");
        }
      }}
    >
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(sanitise(e.target.value))}
          inputMode={inputMode}
          autoComplete={autoComplete}
          disabled={disabled}
          placeholder={label}
          aria-label={label}
          aria-invalid={Boolean(error)}
          className="min-w-0 flex-1 rounded-full border border-mist px-3 py-2 text-sm text-ink outline-none focus-visible:border-violet"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="rounded-full bg-violet px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Next
        </button>
      </div>
      {/* The purpose sits under the field, where it is read before the number
          is typed rather than after it is sent. */}
      <p className="mt-1.5 text-xs text-slate">{note}</p>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
