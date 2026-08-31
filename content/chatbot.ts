/**
 * ═════════════════════════════════════════════════════════════════════════════
 * THE CHATBOT SCRIPT — this is the file to edit.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * Everything a person reads in the chat, every option they can press, the media
 * that plays, and the three WhatsApp messages live here. Nothing below needs a
 * developer: change a string, reload, it is changed.
 *
 * The flow ITSELF - which step follows which - is in lib/chat/flow.ts, because
 * a step that goes nowhere is a bug rather than a typo and should fail the
 * typechecker. This file is the words; that file is the wiring.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE NUMBER IS ASKED LAST NOW, AND IT IS OPTIONAL.
 *
 * The first version asked for a WhatsApp number as the SECOND thing that
 * happened - press a branch, hand over your phone. That captured a number from
 * nearly everyone who pressed anything, and it captured them before the parent
 * had been given a single reason to want one.
 *
 * The order is now: understand the visitor, say something useful, show the one
 * piece of proof that fits, and only then offer to continue on WhatsApp - with
 * "Maybe later" sitting next to it as a real answer. Fewer numbers arrive.
 * The ones that do belong to somebody who walked five steps and then said yes,
 * and the consent is attached to a button that says what it is for rather than
 * to a form field at the top of a funnel.
 *
 * If lead volume matters more than this, the change to reverse is in
 * lib/chat/flow.ts - `applyAction` on the "branch" action - not here.
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
 *
 * `lead` is the one line said on the way in. It used to carry the weight of
 * introducing the phone-number ask that came immediately after; now it only has
 * to acknowledge the choice, so it is shorter and the first real question does
 * the work.
 */
export const CHAT_BRANCHES = [
  {
    id: "exploring",
    label: "Just exploring",
    lead: "Absolutely. Let's start with the bigger picture.",
  },
  {
    id: "ai_literacy",
    label: "AI literacy",
    lead: "AI literacy can mean different things for different children.",
  },
  {
    id: "future_readiness",
    label: "Future readiness",
    lead: "Then let's start with what you actually want for them.",
  },
] as const;

export type ChatBranchId = (typeof CHAT_BRANCHES)[number]["id"];

/* ═══════════════════════════════════ Branch: Just exploring ══ */

/**
 * Education and familiarity, not conversion. A visitor who pressed "Just
 * exploring" has told us they are not ready to be sold to, and the fastest way
 * to lose them is to argue with that.
 */
export const CHAT_EXPLORING_REASON = {
  ask: "What made you curious about AI and your child's future?",
  options: [
    { id: "already_using", label: "My child is already using AI" },
    { id: "understand_ai", label: "I want to understand AI better" },
    { id: "concerned", label: "I'm concerned about AI's impact on children" },
    { id: "future_skills", label: "I want to understand future skills" },
    { id: "curious", label: "I'm just curious" },
  ],
} as const;

export const CHAT_EXPLORING_AI_USE = {
  ask: "How does your child mostly use AI?",
  options: [
    { id: "homework", label: "Homework / schoolwork" },
    { id: "questions", label: "Asking questions" },
    { id: "creating", label: "Creating things" },
    { id: "images_videos", label: "Images / videos" },
    { id: "coding", label: "Coding / building" },
    { id: "unsure", label: "I'm not sure" },
  ],
} as const;

export const CHAT_EXPLORING_UNDERSTAND = {
  ask: "What would you most like to understand about your child's AI use?",
  options: [
    { id: "using_well", label: "Whether they're using it well" },
    { id: "dependency", label: "AI dependency" },
    { id: "independent_thinking", label: "Independent thinking" },
    { id: "creativity", label: "Creativity" },
    { id: "safe_use", label: "Safe / responsible use" },
    { id: "unsure", label: "I'm not sure" },
  ],
} as const;

/**
 * For "I'm just curious" - the one answer that must NOT be followed by another
 * question. Somebody who has said they are only looking has earned an answer,
 * not an interview.
 */
export const CHAT_EXPLORING_CURIOUS = {
  body: [
    "BrainLIT focuses on helping children develop the thinking and practical skills they need in an AI-powered world.",
    "The focus isn't simply on using AI tools, but on helping children think, question, create and solve problems while working with AI.",
  ],
} as const;

/* ═══════════════════════════════════════ Branch: AI literacy ══ */

export const CHAT_LITERACY_INTEREST = {
  ask: "What are you most interested in?",
  options: [
    { id: "already_uses", label: "My child already uses AI" },
    { id: "learn_properly", label: "I want my child to learn AI properly" },
    { id: "responsible_use", label: "I want them to use AI responsibly" },
    { id: "dependency_concern", label: "I'm concerned about AI dependency" },
    { id: "question_ai", label: "I want them to learn how to question AI" },
  ],
} as const;

export const CHAT_LITERACY_AI_USE = {
  ask: "What does your child mostly use AI for?",
  options: [
    { id: "homework", label: "Homework" },
    { id: "questions", label: "Asking questions" },
    { id: "creating", label: "Creating things" },
    { id: "images_videos", label: "Images / videos" },
    { id: "coding", label: "Coding / building" },
    { id: "everything", label: "Everything" },
    { id: "unsure", label: "I'm not sure" },
  ],
} as const;

export const CHAT_LITERACY_CONCERN = {
  ask: "What concerns you most about that?",
  options: [
    { id: "copying", label: "Copying answers" },
    { id: "wrong_info", label: "Trusting incorrect information" },
    { id: "dependent", label: "Becoming dependent" },
    { id: "losing_thinking", label: "Losing independent thinking" },
    { id: "nothing", label: "Nothing specific" },
    { id: "unsure", label: "I'm not sure" },
  ],
} as const;

/** Said before the "what would you like them to develop" question. */
export const CHAT_LITERACY_PROPERLY = {
  body: [
    "Learning AI shouldn't only mean learning which buttons to press in an AI tool.",
    "It also means knowing how to ask better questions, evaluate what AI produces, improve the output and make your own decisions.",
  ],
} as const;

export const CHAT_LITERACY_DEVELOP = {
  ask: "What would you most like your child to develop?",
  options: [
    { id: "critical_thinking", label: "Critical thinking" },
    { id: "creativity", label: "Creativity" },
    { id: "problem_solving", label: "Problem solving" },
    { id: "ai_skills", label: "AI skills" },
    { id: "communication", label: "Communication" },
    { id: "all", label: "All of these" },
  ],
} as const;

/**
 * The payoff line for this branch - said once, after the discovery questions,
 * never before them. Reaching this having answered nothing would be a lecture.
 */
export const CHAT_LITERACY_INSIGHT = {
  body: [
    "The important question isn't simply: can my child use AI?",
    "It's: can my child use AI without giving up their own thinking?",
    "That's an important part of what BrainLIT focuses on.",
  ],
  then: "Would you like to see how BrainLIT approaches this in practice?",
} as const;

/* ═══════════════════════════════ Branch: Future readiness ══ */

export const CHAT_FUTURE_PRIORITY = {
  ask: "When you think about your child's future, what matters most to you?",
  options: [
    { id: "think_independently", label: "Think independently" },
    { id: "creative", label: "Be creative" },
    { id: "solve_problems", label: "Solve unfamiliar problems" },
    { id: "build_create", label: "Build and create" },
    { id: "communicate", label: "Communicate ideas" },
    { id: "work_with_ai", label: "Work effectively with AI" },
    { id: "unsure", label: "I'm not sure yet" },
  ],
} as const;

export type ChatFuturePriorityId =
  (typeof CHAT_FUTURE_PRIORITY.options)[number]["id"];

/**
 * ONE follow-up, chosen by what they just pressed.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * The brief gave three of these verbatim - independent thinking, creativity,
 * working with AI - and said "adapt dynamically" for the rest. Adapting
 * dynamically here means a table, not a language model: the question a parent
 * gets is a fixed consequence of the button they pressed, so it can be read,
 * corrected and argued with by whoever owns this file.
 *
 * THE FOUR NOT IN THE BRIEF WERE WRITTEN HERE, and are marked. They are
 * conversational prompts rather than claims about BrainLIT, so nothing in them
 * can be factually wrong - but they are not the client's words, and somebody
 * should read them before this ships.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const CHAT_FUTURE_FOLLOWUP = {
  think_independently: {
    ask: "What makes independent thinking especially important to you right now?",
    options: [
      { id: "copies_answers", label: "They take answers without checking" },
      { id: "asks_me", label: "They ask before trying themselves" },
      { id: "school_pressure", label: "School rewards the right answer only" },
      { id: "general", label: "Nothing specific, it just matters" },
    ],
  },
  creative: {
    ask: "What would you love to see your child become more confident at creating?",
    options: [
      { id: "stories", label: "Stories and writing" },
      { id: "visual", label: "Images, video or design" },
      { id: "building", label: "Building things that work" },
      { id: "own_ideas", label: "Ideas of their own" },
    ],
  },
  work_with_ai: {
    ask: "Is your child already experimenting with AI, or are you preparing them before they start?",
    options: [
      { id: "already", label: "Already using it" },
      { id: "starting", label: "Just starting" },
      { id: "before", label: "Preparing them beforehand" },
    ],
  },

  /* WRITTEN HERE, not supplied in the brief. See the note above. */
  solve_problems: {
    ask: "What kind of problems would you like them to get better at?",
    options: [
      { id: "school", label: "Schoolwork they get stuck on" },
      { id: "real_world", label: "Real situations outside school" },
      { id: "open_ended", label: "Problems with no single right answer" },
      { id: "unsure", label: "I'm not sure yet" },
    ],
  },
  build_create: {
    ask: "Has your child built anything of their own yet?",
    options: [
      { id: "yes", label: "Yes, a few things" },
      { id: "tried", label: "They have tried" },
      { id: "not_yet", label: "Not yet" },
    ],
  },
  communicate: {
    ask: "Where would you most like them to be more confident?",
    options: [
      { id: "explaining", label: "Explaining what they think" },
      { id: "presenting", label: "Speaking in front of people" },
      { id: "writing", label: "Writing it down clearly" },
      { id: "asking", label: "Asking questions at all" },
    ],
  },
  unsure: {
    ask: "That is a fair answer. What worries you most when you think a few years ahead?",
    options: [
      { id: "jobs", label: "What work will look like" },
      { id: "dependence", label: "Depending on AI too much" },
      { id: "falling_behind", label: "Falling behind other children" },
      { id: "nothing", label: "Nothing in particular" },
    ],
  },
} as const satisfies Record<
  ChatFuturePriorityId,
  { ask: string; options: readonly { id: string; label: string }[] }
>;

/**
 * The core perspective, said after the age is known so the branch has earned it.
 */
export const CHAT_FUTURE_PERSPECTIVE = {
  body: [
    "AI can already generate answers, images, code and ideas.",
    "So the bigger question for the future is: what should children become really good at that AI cannot simply replace?",
    "That's where skills such as thinking, creativity, problem-solving, decision-making and communication become increasingly important.",
  ],
} as const;

/* ═════════════════════════════════════════════════════ Asking for it ══ */

/**
 * THE CONSENT LINE HAS TO COVER WHAT IS ACTUALLY STORED.
 *
 * The old note said "We will send this to your WhatsApp. No calls unless you
 * ask for one." That was true of the old flow, which stored a number, a branch
 * and an age. This version also stores what the parent said about their child's
 * AI use and what worries them, and section 14 of the brief is explicitly about
 * using that for later messages.
 *
 * A parent is entitled to know that BEFORE the number goes in, not in a privacy
 * page they will not open. If the retargeting is dropped, shorten this line
 * again - but not before.
 */
export const CHAT_PHONE_STEP = {
  ask: "What is your WhatsApp number?",
  note: "We will message you here, and keep what you have told us so the messages are relevant. No calls unless you ask for one.",
  placeholder: "10-digit mobile number",
  /** Shown when the number is not a valid Indian mobile. */
  invalid: "That does not look like a 10-digit Indian mobile number.",
} as const;

/**
 * Kept under its original name so nothing downstream has to be renamed; only
 * the question changed. Age is asked on the future-readiness branch, after the
 * follow-up, and it is used to pitch the rest of that branch at the right child.
 */
export const CHAT_AGE_STEP = {
  ask: "How old is your child?",
  note: "So we point you at the right group rather than the whole catalogue.",
  placeholder: "Age in years",
  /** The schema enforces this range too - keep the numbers in step. */
  invalid: "Please enter an age between 6 and 18.",
} as const;

/* ═══════════════════════════════════════════════════════════ Media ══ */

export const CHAT_MEDIA = {
  /**
   * The parent testimonial, offered rather than pushed.
   *
   * Defaults to the one published on the homepage. Any path inside the
   * `session-videos` bucket works; `poster` is what shows before play, and
   * without one the player is a black rectangle.
   */
  testimonial: {
    bucket: "session-videos",
    path: "2026/st-josephs-tirupur-talk.mp4",
    poster: "/testimonials/poster-talk.webp",
    caption: "A parent on what changed at home",
  },

  /**
   * The workshop clip, shown when somebody asks to see a session.
   *
   * The ID ONLY, never the whole URL: from https://youtu.be/vDozEm7ibco the id
   * is the part after the last slash. A full URL pasted here produces an embed
   * that silently fails to load.
   *
   * Left empty, the "Workshop videos" option disappears from the hub rather
   * than rendering an empty player - so clearing this string is also how you
   * turn that option off.
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

  /**
   * How many session photographs to show at once.
   *
   * Not all of them. Section 18 of the brief is explicit that the answer to
   * "what should this visitor see next" is one thing, not the whole library,
   * and fourteen photographs in a chat bubble is a scroll, not an answer.
   */
  photoCount: 3,
} as const;

/* ═══════════════════════════════════════════════════ The hub ══ */

/**
 * THE CENTRE OF THE CONVERSATION.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Every branch lands here once its discovery is done, and every resource
 * returns here afterwards. That is what makes the conversation feel like a
 * conversation rather than a form: there is always a way back, and nothing is a
 * dead end.
 *
 * The options are FILTERED BY WHAT HAS ALREADY BEEN SEEN - see `resourceOptions`
 * in lib/chat/flow.ts. Somebody who has watched the parent video is not offered
 * it again, which is the whole of section 18 and is also just good manners.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const CHAT_RESOURCES = {
  ask: "What would be most useful next?",
  /** Shown instead when every resource has been seen. */
  exhausted: "Is there anything else you would like to know?",
  options: [
    { id: "testimonial", label: "Hear from a parent" },
    { id: "workshop", label: "See a workshop" },
    { id: "explore", label: "What is BrainLIT?" },
    { id: "social", label: "Instagram & YouTube" },
    { id: "community", label: "Join parent community" },
    { id: "whatsapp", label: "Continue on WhatsApp" },
    { id: "human", label: "Talk to a BrainLIT person" },
  ],
} as const;

/* ══════════════════════════════════════════════ The resources ══ */

export const CHAT_TESTIMONIAL = {
  offer:
    "Rather than just telling you what BrainLIT does, here is a parent who has experienced it.",
  cta: "Watch parent experience",
  /** Asked AFTER they have watched. Not a sales question. */
  reaction: "What stood out to you?",
  /** The three replies to that question. */
  options: [
    { id: "recognised", label: "I recognised my own child" },
    { id: "approach", label: "The approach makes sense" },
    { id: "want_more", label: "I want to know more" },
  ],
} as const;

export const CHAT_WORKSHOP = {
  ask: "Would you like to see what a real BrainLIT learning experience looks like?",
  options: [
    { id: "photos", label: "Workshop photos" },
    { id: "videos", label: "Workshop videos" },
  ],
} as const;

/**
 * What BrainLIT is, for somebody who pressed "What is BrainLIT?" at the hub.
 * The same words as the exploring branch's explainer - deliberately, because
 * they are the right ones and two versions of this would drift apart.
 */
export const CHAT_EXPLORE = {
  body: CHAT_EXPLORING_CURIOUS.body,
} as const;

export const CHAT_SOCIAL = {
  /**
   * The LINKS are not here. They live in lib/site.ts alongside the ones in the
   * footer, so the chatbot cannot end up pointing at an old Instagram handle
   * that the rest of the site has already moved off.
   */
  body: "If you'd like to keep exploring BrainLIT, you can also see our latest workshops, AI content and updates on our social channels.",
} as const;

export const CHAT_COMMUNITY = {
  body: "We also have a BrainLIT Parent Community where parents can stay connected and continue exploring conversations around children and AI.",
  cta: "Join parent community",
  /** Said after they open it. Nothing is being sold. */
  after: "You are welcome to just read for a while. Nobody is sold to in there.",
} as const;

/**
 * The way out to a person, available from the hub at any point.
 *
 * NEVER PRETENDS TO BE ONE. The brief is explicit about that and it is also the
 * only honest option: this thing looks things up in a content file.
 */
export const CHAT_HUMAN = {
  body: "A person from BrainLIT can pick this up properly - programmes, fees, school enquiries, or anything specific to your child.",
  cta: "Message BrainLIT on WhatsApp",
} as const;

/* ═════════════════════════════════════════════ The WhatsApp offer ══ */

/**
 * "Maybe later" IS A REAL ANSWER and returns to the hub.
 *
 * A widget where the only way forward is to hand over a phone number is a form
 * wearing a conversation's clothes. Somebody who says no here keeps every other
 * resource, and can come back to this at the hub if the answer changes.
 */
export const CHAT_WHATSAPP_OFFER = {
  ask: "Would you like to continue with BrainLIT on WhatsApp? We can share relevant information and updates with you there.",
  options: [
    { id: "yes", label: "Continue on WhatsApp" },
    { id: "later", label: "Maybe later" },
  ],
  /** After "Maybe later". Does not sulk, does not ask again. */
  later:
    "Of course. Have a look around, and it is here if you change your mind.",
} as const;

/* ════════════════════════════════════════════════ WhatsApp templates ══ */

/**
 * One message per branch, sent once a parent has pressed "Continue on WhatsApp"
 * AND given a number.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NO {{Parent Name}}. The brief's drafts opened with it, and this flow never
 * asks for a name - so every message would have gone out reading "Hello ,".
 * `fill` in lib/whatsapp.ts collapses an unknown placeholder to an empty
 * string, which is the right behaviour and is exactly what would have produced
 * that. Adding a name step is the alternative; it is one more question in front
 * of the number, and the second paragraph is what makes these read as personal
 * anyway.
 *
 * Placeholders, substituted at send time. Any that has no value collapses to an
 * empty string rather than printing its own name:
 *
 *   {{age}}    the child's age, where the branch asked for one
 *   {{branch}} the human label of the branch they chose
 *
 * THERE IS NOTHING TO GET APPROVED. Evolution GO speaks the WhatsApp Web
 * protocol from a logged-in personal session, not the Business Cloud API: no
 * template registry, no review queue, no variable slots. What is written here
 * is sent verbatim.
 *
 * The cost of that freedom is that the sending account is a REAL WhatsApp
 * number which can be rate-limited or banned for unsolicited bulk messaging.
 * Each of these goes to somebody who pressed a button asking for it seconds
 * earlier, so write it as a reply to that - not as a broadcast.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const CHAT_WHATSAPP = {
  exploring: {
    body: "Hello, and thank you for exploring BrainLIT.\n\nWe hope your conversation with our website assistant gave you a clearer understanding of BrainLIT and our approach to children's learning in an AI-powered world.\n\nWe'll share relevant BrainLIT information and updates with you here.\n\nIf you have any questions, simply reply to this message.\n\nWarm regards,\nTeam BrainLIT",
  },
  ai_literacy: {
    body: "Hello, and thank you for connecting with BrainLIT.\n\nFrom our conversation, we understand that you are exploring how your child can develop the skills to use AI thoughtfully while continuing to think, question and create independently.\n\nWe'll share relevant BrainLIT information and resources with you here.\n\nIf you have any questions, simply reply to this message.\n\nWarm regards,\nTeam BrainLIT",
  },
  future_readiness: {
    body: "Hello, and thank you for connecting with BrainLIT.\n\nWe understand that you are exploring how to prepare your child with the thinking, creativity, problem-solving and practical skills needed for an AI-powered future.\n\nWe'll share relevant BrainLIT information and resources with you here.\n\nIf you have any questions, simply reply to this message.\n\nWarm regards,\nTeam BrainLIT",
  },
} as const satisfies Record<ChatBranchId, { body: string }>;

/* ═══════════════════════════════════════════════════════ Closing ══ */

export const CHAT_CLOSING = {
  /**
   * After a send that worked.
   *
   * Says WHAT was sent and WHERE, rather than a bare "Sent". A parent who has
   * just handed over a phone number is owed a receipt they can check.
   */
  sent: "Thank you. We have sent the details to your WhatsApp - they should arrive within a minute.",

  /**
   * After a send that did not.
   *
   * Deliberately does not say "failed": the number IS captured and a person
   * will follow it up, so telling a parent their enquiry vanished when it did
   * not is both untrue and alarming.
   */
  queued:
    "Thank you. We have your number, and someone from BrainLIT will message you on WhatsApp shortly.",

  /**
   * The free-text invitation, once the funnel is done. Phrased as an offer of
   * help rather than "ask away", which reads as a shrug at the end of what was
   * otherwise a considered exchange.
   */
  openFloor: "Is there anything else you would like to know?",
} as const;

/* ════════════════════════════════════════════════ Free-text answers ══ */

export const CHAT_ANSWERS = {
  /** Shown while the lookup runs. */
  thinking: "Thinking…",
  /**
   * When the content layer is unreachable. Points at a human rather than
   * apologising - the WhatsApp number is on every page anyway.
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
   */
  offTopic:
    "I can only help with BrainLIT - the programme, the sessions, ages, fees and how it all works. Ask me one of those and I will find it for you.",
} as const;
