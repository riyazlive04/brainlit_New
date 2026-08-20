"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  CHAT_INTRO,
  CHAT_BRANCHES,
  CHAT_PHONE_STEP,
  CHAT_AGE_STEP,
  CHAT_READINESS_STEP,
  CHAT_MEDIA,
  CHAT_CLOSING,
  CHAT_ANSWERS,
  type ChatBranchId,
} from "@/content/chatbot";
import { INITIAL_STATE, type ChatState } from "@/lib/chat/flow";
import { normalizeIndianMobile } from "@/lib/phone";
import { publicStorageUrl } from "@/lib/storage";
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
 */

type Bubble = {
  id: number;
  from: "bot" | "user";
  text: string;
  /** Rendered instead of text, when the bubble is a step's media. */
  media?: "testimonial" | "youtube";
};

let bubbleId = 0;
const bubble = (from: Bubble["from"], text: string, media?: Bubble["media"]): Bubble => ({
  id: ++bubbleId,
  from,
  text,
  media,
});

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ChatState>(INITIAL_STATE);
  const [log, setLog] = useState<Bubble[]>([]);
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState<"phone" | "age" | null>(null);
  const [draft, setDraft] = useState("");

  const scroller = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

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

  const say = useCallback((from: Bubble["from"], text: string, media?: Bubble["media"]) => {
    setLog((prev) => [...prev, bubble(from, text, media)]);
  }, []);

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
        return data as { reply?: string; closing?: string; state?: ChatState };
      } catch {
        say("bot", CHAT_ANSWERS.unavailable);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [state, say],
  );

  /* Whatever the new step is, narrate it. Kept in one place so a step added to
     the machine cannot arrive on screen with nothing said about it. */
  const narrate = useCallback(
    (next: ChatState, closing?: string) => {
      switch (next.step) {
        case "phone": {
          const branch = CHAT_BRANCHES.find((b) => b.id === next.branch);
          if (branch) say("bot", branch.lead);
          say("bot", CHAT_PHONE_STEP.ask);
          break;
        }
        case "readiness":
          say("bot", CHAT_READINESS_STEP.ask);
          break;
        case "age":
          say("bot", CHAT_AGE_STEP.ask);
          break;
        case "testimonial":
          say("bot", CHAT_MEDIA.testimonial.caption, "testimonial");
          break;
        case "video":
          say("bot", "", "youtube");
          break;
        case "done":
          if (closing) say("bot", closing);
          say("bot", CHAT_CLOSING.openFloor);
          break;
      }
    },
    [say],
  );

  async function chooseBranch(branch: ChatBranchId) {
    const label = CHAT_BRANCHES.find((b) => b.id === branch)?.label ?? "";
    say("user", label);
    const data = await post({ action: { type: "branch", branch } });
    if (data?.state) narrate(data.state, data.closing);
  }

  async function submitPhone(value: string) {
    say("user", value);
    const data = await post({ action: { type: "phone", phone: value } });
    if (data?.state) narrate(data.state, data.closing);
  }

  async function submitReadiness(readiness: "ready" | "more_details") {
    const label =
      CHAT_READINESS_STEP.options.find((o) => o.id === readiness)?.label ?? "";
    say("user", label);
    const data = await post({ action: { type: "readiness", readiness } });
    if (data?.state) narrate(data.state, data.closing);
  }

  async function submitAge(value: string) {
    say("user", value);
    const data = await post({ action: { type: "age", childAge: value } });
    if (data?.state) narrate(data.state, data.closing);
  }

  const finishMedia = useCallback(async () => {
    const data = await post({ action: { type: "watched" } });
    if (data?.state) narrate(data.state, data.closing);
  }, [post, narrate]);

  /**
   * Start the conversation again from nothing.
   *
   * `log` is emptied rather than re-seeded here: the effect that writes the
   * opening lines fires on `log.length === 0`, so clearing it replays the
   * greeting from the ONE place that owns that copy. Re-seeding it here would
   * be a second copy to keep in step.
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
  }, []);

  async function ask(question: string) {
    say("user", question);
    setDraft("");
    const data = await post({ message: question });
    if (data?.reply) say("bot", data.reply);
  }

  const testimonialSrc = publicStorageUrl(
    CHAT_MEDIA.testimonial.bucket,
    CHAT_MEDIA.testimonial.path,
  );

  /* Free text is offered once the funnel is done, and also at the very start —
     someone who arrives with a specific question should not have to walk a
     three-step script to ask it. */
  const canAsk = state.step === "done" || state.step === "branch";

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
                onWatched={finishMedia}
              />
            ))}
            {busy && <p className="text-xs text-slate">{CHAT_ANSWERS.thinking}</p>}
          </div>

          <div className="border-t border-mist px-4 py-3">
            {state.step === "branch" && (
              <Options
                options={CHAT_BRANCHES.map((b) => ({ id: b.id, label: b.label }))}
                disabled={busy}
                onPick={(id) => chooseBranch(id as ChatBranchId)}
              />
            )}

            {state.step === "readiness" && (
              <Options
                options={CHAT_READINESS_STEP.options.map((o) => ({ ...o }))}
                disabled={busy}
                onPick={(id) => submitReadiness(id as "ready" | "more_details")}
              />
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

            {state.step === "age" && (
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

            {canAsk && (
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

function Message({
  bubble: b,
  testimonialSrc,
  onWatched,
}: {
  bubble: Bubble;
  testimonialSrc: string | null;
  onWatched: () => void;
}) {
  if (b.media === "youtube") {
    return <YouTubeStep videoId={CHAT_MEDIA.youtubeId} onWatched={onWatched} />;
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
            onEnded={onWatched}
            aria-label={b.text}
            className="aspect-video w-full bg-ink object-cover"
          >
            <track kind="captions" srcLang="en" label="English" />
          </video>
        )}
        <figcaption className="px-3 py-2 text-xs text-slate">{b.text}</figcaption>
        <button
          type="button"
          onClick={onWatched}
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
  options: { id: string; label: string }[];
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
