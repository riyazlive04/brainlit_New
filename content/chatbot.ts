/**
 * ═════════════════════════════════════════════════════════════════════════════
 * THE CHATBOT SCRIPT — this is the file to edit.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * Everything a person reads in the chat, every option they can press, the video
 * that plays, and the three WhatsApp messages live here. Nothing below needs a
 * developer: change a string, reload, it is changed.
 *
 * The flow ITSELF - which step follows which - is in lib/chat/flow.ts, because
 * a step that goes nowhere is a bug rather than a typo and should fail the
 * typechecker. This file is the words; that file is the wiring.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * VALUES STILL TO SUPPLY. Each is marked TODO below and each one degrades
 * SAFELY rather than crashing: an empty YouTube id skips the video step, and an
 * empty template sends nothing and records why. So this ships and works as a
 * lead capture before the content arrives.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ══════════════════════════════════════════════════════ The opening ══ */

export const CHAT_INTRO = {
  /** The launcher's label, and the bot's name in the header. */
  title: "Ask BrainLIT",
  subtitle: "Usually replies straight away",

  /**
   * Shown before anyone types. Written so the first message is not an
   * interrogation - a person who opens a chat widget and is immediately asked
   * for a phone number closes it again.
   */
  greeting:
    "Hello. I can tell you what BrainLIT actually does, or point you to the bit that matters for your child.",

  /** The question that carries the three branches. */
  prompt: "What are you looking for?",
} as const;

/* ═══════════════════════════════════════════════════════ The branches ══ */

/**
 * The three doors. `id` is the wire value and is matched in lib/chat/flow.ts -
 * rename the LABEL freely, but changing an id means changing it there too, and
 * the typechecker will tell you.
 */
export const CHAT_BRANCHES = [
  {
    id: "exploring",
    label: "Just exploring",
    /** Shown once they pick it, before the phone number is asked for. */
    lead: "Still weighing up whether AI is something your child needs at all - that is the honest place to start, and most parents here started there.",
  },
  {
    id: "ai_literacy",
    label: "AI literacy",
    lead: "Congratulations, you are on the right track.",
  },
  {
    id: "future_readiness",
    label: "Future readiness",
    lead: "As parents, are we giving our children enough opportunities to use technology beyond entertainment?",
  },
] as const;

export type ChatBranchId = (typeof CHAT_BRANCHES)[number]["id"];

/* ═════════════════════════════════════════════════════ Asking for it ══ */

export const CHAT_PHONE_STEP = {
  ask: "Enter you whatsapp number to stay connected?",
  /**
   * Under the field, not in a modal. The DPDP Act makes the purpose of
   * collection something a person is entitled to know BEFORE they hand it over,
   * and a line they have already scrolled past is not that.
   */
  note: "We will send this to your WhatsApp. No calls unless you ask for one.",
  placeholder: "10-digit mobile number",
  /** Shown when the number is not a valid Indian mobile. */
  invalid: "That does not look like a 10-digit Indian mobile number.",
} as const;

export const CHAT_AGE_STEP = {
  ask: "Enter your future leader's age (your child).",
  note: "So we point you at the right group rather than the whole catalogue.",
  placeholder: "Age in years",
  /** The schema enforces this range too - keep the numbers in step. */
  invalid: "Please enter an age between 6 and 18.",
} as const;

/* ══════════════════════════════════════════════ Branch: AI literacy ══ */

export const CHAT_READINESS_STEP = {
  ask: "How ready are you to create that opportunity for your child?",
  options: [
    { id: "ready", label: "Yes, I am ready" },
    { id: "more_details", label: "I need more details" },
  ],
} as const;

export type ChatReadinessId =
  (typeof CHAT_READINESS_STEP.options)[number]["id"];

/* ═══════════════════════════════════════════════════════════ Media ══ */

export const CHAT_MEDIA = {
  /**
   * "Just exploring" - what a BrainLIT parent noticed, in their own words.
   *
   * Defaults to the parent testimonial published on the homepage. Any path
   * inside the `session-videos` bucket works; `poster` is what shows before
   * play, and without one the player is a black rectangle.
   */
  testimonial: {
    bucket: "session-videos",
    path: "2026/st-josephs-tirupur-talk.mp4",
    poster: "/testimonials/poster-talk.jpg",
    caption: "A parent on what changed at home",
  },

  /**
   * "Future readiness" - the film that answers the question above it.
   *
   * The ID ONLY, never the whole URL: from https://youtu.be/vDozEm7ibco the id
   * is the part after the last slash. A full URL pasted here produces an embed
   * that silently fails to load.
   *
   * Setting this is what SWITCHES THE STEP ON. Left empty the branch still
   * runs - lib/chat/flow.ts skips a video step it cannot fill rather than
   * rendering an empty player - so clearing this string is also how you turn
   * the step off again.
   */
  youtubeId: "vDozEm7ibco",

  /**
   * How much of it counts as watched before the next step unlocks, 0 to 1.
   *
   * Not 1. A person who has seen five-sixths of a film has watched it; holding
   * the last frames hostage only teaches them to close the widget. It is also
   * unreachable in practice - the API stops reporting before the true end.
   */
  watchedFraction: 0.85,
} as const;

/* ════════════════════════════════════════════════ WhatsApp templates ══ */

/**
 * One message per branch, sent once the funnel completes.
 *
 * TODO: WRITE THE THREE MESSAGES. An empty `body` sends NOTHING and records
 * `template_missing` against the lead, so the number is still captured and
 * nothing is silently lost - fill these in and the queue starts flowing.
 *
 * Placeholders, substituted at send time. Any that has no value collapses to an
 * empty string rather than printing its own name:
 *
 *   {{age}}    the child's age, where the branch asked for one
 *   {{branch}} the human label of the branch they chose
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THERE IS NOTHING TO GET APPROVED. Evolution GO speaks the WhatsApp Web
 * protocol from a logged-in personal session, not the Business Cloud API: no
 * template registry, no review queue, no variable slots. What is written here
 * is sent verbatim.
 *
 * The cost of that freedom is that the sending account is a REAL WhatsApp
 * number which can be rate-limited or banned for unsolicited bulk messaging.
 * Each of these goes to somebody who typed their number in seconds earlier, so
 * write it as a reply to that - not as a broadcast.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const CHAT_WHATSAPP = {
  exploring: {
    body: "Hello, this is BrainLIT. You were reading about us a moment ago and asked us to message you here.\n\nYou said you were still exploring, which is the honest place to start. So rather than a pitch: the free parent session is one hour, it is for you and not for your child, and you can leave at the end before anything is sold.\n\nIf it is useful, reply and we will send you the next date. If not, you will not hear from us again.",
  },
  ai_literacy: {
    body: "Hello, this is BrainLIT. You just asked us to message you here about AI literacy.\n\nFor a {{age}}-year-old the useful question is not whether they can use AI, it is whether they can tell a good answer from a confident wrong one. That is the habit we teach, in small live batches, and every child finishes with a project they built and can explain.\n\nReply with a good time and a person will call you, or ask us anything here.",
  },
  future_readiness: {
    body: "Hello, this is BrainLIT. You just asked us to message you here after watching the video.\n\nThe question in it was whether our children get to use technology for anything beyond entertainment. Ours is a live, small-batch programme where they build something real and then have to stand up and explain it, which is the part most adults still find hard.\n\nReply and we will send you the next free parent session, or answer anything you want to ask first.",
  },
} as const satisfies Record<ChatBranchId, { body: string }>;

/* ═══════════════════════════════════════════════════════ Closing ══ */

export const CHAT_CLOSING = {
  /**
   * After a send that worked.
   *
   * Says WHAT was sent and WHERE, rather than a bare "Sent". A parent who has
   * just handed over a phone number is owed a receipt they can check, and
   * "Sent." on its own leaves them wondering what exactly went where.
   */
  sent: "Thank you. We have sent the details to your WhatsApp - they should arrive within a minute.",

  /**
   * After a send that did not.
   *
   * Deliberately does not say "failed": the number IS captured and a person
   * will follow it up, so telling a parent their enquiry vanished when it did
   * not is both untrue and alarming. It commits to a human rather than to a
   * timeframe we cannot guarantee while the provider is unavailable.
   */
  queued: "Thank you. We have your number, and someone from BrainLIT will message you on WhatsApp shortly.",

  /**
   * The free-text invitation, once the funnel is done. Phrased as an offer of
   * help rather than "ask away", which reads as a shrug at the end of what was
   * otherwise a considered exchange.
   */
  openFloor: "Is there anything else you would like to know?",
} as const;

/* ════════════════════════════════════════════════ Free-text answers ══ */

export const CHAT_ANSWERS = {
  /** Shown while Claude is composing. */
  thinking: "Thinking…",
  /**
   * When the model is not configured, or the API is down. Points at a human
   * rather than apologising - the WhatsApp number is on every page anyway.
   */
  unavailable:
    "I cannot answer that one right now. Message us on WhatsApp and a person will pick it up.",
  /**
   * A FAIR question about BrainLIT that our content does not answer - the
   * teacher's qualifications, next month's dates, something specific to one
   * child. A person should pick this up, so it hands over rather than deflects.
   */
  outOfScope:
    "I do not have that one to hand. A person can answer it properly on WhatsApp.",

  /**
   * Not about BrainLIT at all: the cricket score, the weather, used cars.
   *
   * Kept SEPARATE from outOfScope on purpose. Sending these to WhatsApp wastes
   * somebody's afternoon, and answering a real question with "ask about
   * BrainLIT" is dismissive - so the two failures get two replies.
   *
   * Written to steer rather than scold. It names what CAN be asked, because a
   * refusal with no exit leaves a person staring at a box with nothing to type.
   */
  offTopic:
    "I can only help with BrainLIT - the programme, the sessions, ages, fees and how it all works. Ask me one of those and I will find it for you.",
} as const;
