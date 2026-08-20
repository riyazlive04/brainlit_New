import type { Faq } from "@/content/home";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * THE WEBINAR LANDING PAGE — this is the file to edit.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * Every word on /webinar lives here. The page file arranges these blocks; it
 * does not contain copy. Change a string, reload, it is changed.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS PAGE HAS ITS OWN FAQ.
 *
 * It used to borrow the first six questions from FAQS in content/home.ts, which
 * is also what the homepage and /faq render - and /faq publishes them as
 * FAQPage structured data. Rewriting them for this page would have silently
 * rewritten both of those and the search markup with them.
 *
 * So WEBINAR_FAQS is separate. The cost is that a fact stated in both places
 * has to be changed in both; the benefit is that this page can speak to a
 * parent deciding about ONE FREE SESSION rather than about enrolment, which is
 * a different conversation.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ══════════════════════════════════════════ 1. Hero — parent proof ══ */

export const WEBINAR_HERO = {
  eyebrow: "Free · Live online · For parents",

  /** Sits above the video. */
  proofLabel: "Real parent experience",

  /**
   * A SUMMARY, and it must stay one.
   *
   * Deliberately not in quotation marks and introduced as "in summary": the
   * parent did not say these words in this order. She described children who
   * scrolled and asked for quick answers, and who now research what they
   * actually need and build things. Compressing that is fair. Putting it in
   * quotes would be inventing a sentence and attributing it to a real person.
   */
  summaryIntro: "In her words, in summary:",
  summary:
    "Before BrainLIT, my children used technology mostly for scrolling and quick answers. Now, they use it to research, learn and create.",

  /** Under the video. */
  caption:
    "See how one BrainLIT parent noticed the difference in the way her children use technology and AI.",

  cta: "Reserve my free seat",

  /**
   * The clip, as a window into the full recording.
   *
   * TODO: A TRIMMED FILE WOULD BE BETTER. These seconds are enforced in the
   * player - it opens at `start` and stops at `end` - but the scrubber still
   * spans the whole 2m16s, so a viewer can wander outside the window. Supply a
   * cut file and set start/end to null.
   */
  clip: {
    bucket: "session-videos",
    path: "2026/st-josephs-tirupur-talk.mp4",
    poster: "/testimonials/poster-talk.jpg",
    start: 67, // 01:07
    end: 103, // 01:43
  },
} as const;

/* ═══════════════════════════════════════ 2. The core message ══ */

export const WEBINAR_CORE = {
  /** The page's H1. The strongest line on the page; it is not being replaced. */
  headline: {
    before: "Your child will use AI either way. The question is whether they can ",
    accent: "think",
    after: " first.",
  },
  lead: "A free session for parents. No pitch to sit through - bring the questions you have actually been worrying about.",

  body: [
    "AI can give children an answer in seconds.",
    "But getting an answer is not the same as learning.",
    "BrainLIT helps children learn how to use AI as a learning partner - to understand, explore, question, check and create - instead of simply asking AI to do the work for them.",
  ],
} as const;

/* ═══════════════════════════════════════ 3. Why this matters now ══ */

export const WEBINAR_WHY_NOW = {
  /**
   * NOT "Your child is going to use AI. The question is how."
   *
   * That is the third restatement of the H1 on one page - the headline says it,
   * this said it again, and the closing CTA says it a third time. Repetition
   * blunts the line that is doing the most work. This section earns its own
   * headline and the CTA keeps the callback.
   */
  heading: "The question is no longer whether. It is how.",

  body: [
    "Keeping children away from AI is becoming less realistic.",
    "The more useful skill is helping them learn how to use it well.",
  ],

  /** Rendered as questions, because that is what they are. */
  questions: [
    "A child can ask AI for an answer in seconds. But can they tell whether the answer is correct?",
    "Can they ask a better question?",
    "Can they explain what they learned?",
    "Can they use AI to create something of their own?",
  ],

  close: "These are the habits children need to start developing now.",
} as const;

/* ═══════════════════════════════ 4. What AI literacy means ══ */

export const WEBINAR_LITERACY = {
  heading: "What does AI literacy actually mean for a child?",
  lead: "It is not about knowing the most AI tools.",
  subLead: "It is about knowing:",
  points: [
    "when to use AI",
    "what to ask",
    "how to question the answer",
    "how to check whether it makes sense",
    "when not to depend on AI",
    "how to use AI to create something of their own",
  ],
} as const;

/* ═════════════════════════════ 5. What makes BrainLIT different ══ */

/**
 * The method, as one sequence.
 *
 * Drawn ONCE. The brief described this flow and then described the same seven
 * steps again inside the worked example below - the same diagram twice running.
 * The example now walks through these steps rather than redrawing them, so a
 * change here changes both.
 */
export const WEBINAR_METHOD = {
  heading: "What makes BrainLIT different?",
  lead: "BrainLIT is an AI literacy approach where children learn through real situations and problems.",

  steps: [
    "Real-world problem",
    "Think",
    "Use AI as a learning partner",
    "Question",
    "Check",
    "Decide",
    "Create",
  ],

  body: [
    "Instead of starting with “Which AI tool should my child learn?”, we start with “What is your child trying to understand or solve?”",
    "Then AI becomes a partner in the learning process - not a machine that simply gives the answer.",
  ],
} as const;

/* ═══════════════════════════════════ 6. One real example ══ */

export const WEBINAR_EXAMPLE = {
  heading: "What that looks like in practice",
  prompt: "Imagine your child is asked:",
  question: "How can we reduce plastic waste in our school?",
  contrast: "Instead of asking AI “Give me the answer,” the child learns to:",

  /** Deliberately the same seven beats as WEBINAR_METHOD.steps, made concrete. */
  walkthrough: [
    "Understand the problem",
    "Research with AI",
    "Ask better questions",
    "Compare ideas",
    "Check information",
    "Make a decision",
    "Create and explain their solution",
  ],

  close: "That is the kind of AI literacy BrainLIT is building.",
} as const;

/* ═══════════════════════════════════ 7. Webinar takeaways ══ */

export const WEBINAR_TAKEAWAYS = {
  heading: "What will you take away from this free session?",
  items: [
    "Understand what AI literacy really means for children",
    "Recognise the difference between using AI to learn and using AI to avoid thinking",
    "Understand how children can use AI as a learning partner",
    "See how real-world problems can become meaningful AI learning experiences",
    "Know what skills your child should start developing now",
  ],
  close:
    "You will leave with a way of thinking about this that you can use at home, not just a description of what BrainLIT does.",
} as const;

/* ════════════════════════════════ 8. What we will cover ══ */

/**
 * BRAINLIT IS NOT ANTI-CODING, and the old first line read as though it were:
 * "Why 'learn to code' is no longer the answer, and what replaced it". Coding
 * is now framed as necessary but no longer sufficient, which is both the
 * honest position and the one that does not insult a parent who has already
 * paid for a coding class.
 */
export const WEBINAR_COVER = {
  heading: "What we will cover",
  items: [
    "Why learning to code alone is no longer enough - and what children need alongside it",
    "The important questions children should ask before trusting an AI answer",
    "How to recognise whether your child is using AI to learn - or simply to get answers",
    "How children can use AI as a learning partner through real-world problems",
    "What BrainLIT teaches and whether your child is ready for it",
  ],
} as const;

/* ═══════════════════════════════════════════ 9. FAQ ══ */

/**
 * Written for a parent deciding about the FREE SESSION, not about enrolment.
 *
 * Kept factually in step with FAQS in content/home.ts - "never used AI" and
 * "more screen time" say the same thing there in different words. If you change
 * a fact here, change it there too.
 */
export const WEBINAR_FAQS: Faq[] = [
  {
    category: "The approach",
    question: "Is this an AI class or a critical-thinking class?",
    answer:
      "It is an AI literacy program, but we do not begin with tools. We begin with how children should think when using AI. Children learn to use AI to understand, explore, question and create rather than simply asking AI to do the work for them.",
  },
  {
    category: "The approach",
    question: "What does “AI as a learning partner” actually mean?",
    answer:
      "Instead of “Give me the answer”, the child learns to ask AI to help them understand something, show them different possibilities, and challenge what they already think. The child still does the deciding. AI is there to widen the options and test the reasoning, not to hand over a finished answer.",
  },
  {
    category: "How classes run",
    question: "What will my child actually do?",
    answer:
      "They work on real situations and problems. They use AI during the process, question what it gives them, compare it against other sources, make their own decisions, and build something they can explain to somebody else.",
  },
  {
    category: "The approach",
    question: "Is this a coding class?",
    answer:
      "No. Coding can be useful, and we are not against it. BrainLIT focuses on AI literacy, thinking, problem-solving and responsible use of AI. The goal is not to make children dependent on one particular tool.",
  },
  {
    category: "The approach",
    question: "How is BrainLIT different from other AI courses for children?",
    answer:
      "Many programs begin by teaching children what a particular AI tool can do. BrainLIT begins with what the child is trying to understand or solve, then uses AI as a learning partner. Tools will change. The ability to think and use them well matters longer.",
  },
  {
    category: "AI and screens",
    question: "Will my child just copy AI answers?",
    answer:
      "No. That is exactly what we want to avoid. Children are encouraged to question, compare, check, make decisions and explain their thinking. AI can support the process, but it should not replace the child's thinking.",
  },
  {
    category: "AI and screens",
    question: "Will this mean more screen time?",
    answer:
      "Not necessarily. The goal is not to keep children in front of AI for longer. Much of the work - questioning, planning, discussing, deciding - happens away from the keyboard. AI is one part of the process, not the whole of it.",
  },
  {
    category: "Your child",
    question: "My child knows nothing about AI. Can they still join?",
    answer:
      "Yes. No prior AI knowledge is needed, and having none is often an advantage - there are no habits to unlearn. We are teaching thinking, not software.",
  },
  {
    category: "Your child",
    question: "Will this help with school learning?",
    answer:
      "The skills transfer: researching properly, asking better questions, checking whether information holds up, explaining an idea clearly, and working through a problem to something finished. We are not going to promise you better marks - that depends on far more than one program.",
  },
  {
    category: "Your child",
    question: "Do parents need to know AI?",
    answer:
      "Not at all. The session is built for parents who have never used these tools. Nothing in it assumes you have, and you will not be asked to do anything technical.",
  },
  {
    category: "The approach",
    question: "What will I learn from the webinar?",
    answer:
      "What AI literacy actually means for a child, how to spot the difference between using AI to learn and using it to avoid thinking, how AI can work as a learning partner, and which skills your child should begin developing now.",
  },
];

/* ═══════════════════════════════════════ 10. Final CTA ══ */

export const WEBINAR_FINAL_CTA = {
  /** The callback to the H1 - the one place repeating it earns its keep. */
  heading: "Your child will use AI either way. Help them learn how to use it well.",
  body: "Join this free live session to understand what AI literacy really means for your child - and what you can start doing now.",
  cta: "Reserve my free seat",
} as const;

/* ══════════════════════════════════════════ The form ══ */

/**
 * Ages offered on this page's registration form.
 *
 * NARROWED FROM 6-16, because the page says the session is for 10-14 year olds
 * and the form was offering ages the copy does not serve.
 *
 * Understand what this costs: a parent of a nine-year-old can no longer
 * register here. The site-wide FAQ answer "Come to the free parent session and
 * ask" is still true of BrainLIT but is no longer true of THIS FORM, which is
 * why that question is not in WEBINAR_FAQS above. If you would rather keep
 * those registrations, widen this back out and say so in the copy.
 */
export const WEBINAR_FORM_AGES = [10, 11, 12, 13, 14] as const;
