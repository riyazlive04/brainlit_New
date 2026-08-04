/**
 * Homepage content.
 *
 * Phase 1 keeps copy here as typed data rather than inline in components, so
 * the Phase 2 CMS migration swaps the data source instead of rewriting every
 * section.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT IS AND IS NOT WRITTEN HERE
 *
 * Everything below is derived from the client's own discovery documents. Where
 * a fact was not in those documents — pricing, batch size, session length,
 * schedule — the copy is written to avoid claiming it rather than inventing a
 * plausible number. Search for NEEDS INPUT.
 *
 * `TESTIMONIALS` and `PROJECTS` ship EMPTY on purpose. Inventing parent quotes
 * or student work would put fabricated testimony on a live education site
 * aimed at parents. The sections render nothing until real, consented content
 * is supplied.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type HowItWorksStep = {
  step: string;
  title: string;
  body: string;
};

export const HOW_IT_WORKS: HowItWorksStep[] = [
  {
    step: "01",
    title: "Start with the free parent session",
    body: "Before anything else, you see how we teach. Bring your questions about raising a child alongside AI — we would rather answer those first than sell you a course.",
  },
  {
    step: "02",
    title: "Choose the right program",
    body: "Programs are grouped by age and readiness, not by school grade. We will tell you honestly if your child is better served waiting a year.",
  },
  {
    step: "03",
    title: "Live online, small batches",
    body: "Sessions are live, not recorded. Small groups, because thinking is taught through argument and questions — which does not happen in a room of a hundred.",
  },
  {
    step: "04",
    title: "Your child builds something real",
    body: "Every child leaves with work they can show: a project they scoped, questioned, made and can explain. Not a certificate of attendance.",
  },
];

export type Faq = { question: string; answer: string };

export const FAQS: Faq[] = [
  {
    question: "Is this a coding class?",
    answer:
      "No. Coding tools change every few months, and AI already writes most routine code. We teach the layer underneath — how to question an answer, frame a problem, judge whether something is any good, and decide when AI should not be used at all. Those skills outlast any tool.",
  },
  {
    question: "My child has never used AI. Is that a problem?",
    answer:
      "Not at all, and it is often an advantage. We are teaching thinking, not software. A child who has never touched a chatbot has no habits to unlearn.",
  },
  {
    question: "Will this just mean more screen time?",
    answer:
      "It is a fair worry. Sessions are live and discussion-led rather than a child alone with a screen, and much of the work — questioning, planning, arguing a position — happens away from the keyboard. The aim is a child who uses AI deliberately instead of reflexively.",
  },
  {
    question: "Are you teaching children to use ChatGPT?",
    answer:
      "We teach them to think before they reach for it. Children will use these tools regardless of what any of us prefer. The question is whether they can tell a good answer from a confident wrong one — and that has to be taught deliberately.",
  },
  {
    question: "What ages is this for?",
    answer:
      "Ten to fourteen. That range is deliberate: old enough to reason about their own thinking, young enough that the habits still form easily.",
  },
  {
    question: "Do you teach in Tamil?",
    answer:
      "Sessions are conducted in English, and our team speaks Tamil — so parent conversations, questions and support happen in whichever you are more comfortable with.",
  },
];

/**
 * Parent testimonials.
 *
 * EMPTY UNTIL REAL ONES ARE SUPPLIED. Each needs the parent's name, city, the
 * quote, and their consent to publish. If a child is named, that requires
 * recorded parental consent — see PLAN.md §10 and `testimonials.consent_ref`
 * in the schema.
 */
export type Testimonial = {
  quote: string;
  parentName: string;
  city: string;
  childContext?: string;
};

export const TESTIMONIALS: Testimonial[] = [];

/**
 * Student project showcase.
 *
 * EMPTY UNTIL REAL ONES ARE SUPPLIED, each with written parental consent.
 * Display children as first name and age only — never a full name, school or
 * photograph without explicit consent on record.
 */
export type Project = {
  title: string;
  summary: string;
  studentFirstName: string;
  age: number;
};

export const PROJECTS: Project[] = [];

/**
 * Founder.
 * NEEDS INPUT: bio, credentials and a photograph.
 */
export const FOUNDER = {
  name: "Haja Najmudeen",
  role: "Founder & CEO",
  // Written from the mission in the discovery document. Replace with the
  // founder's own words before launch.
  quote:
    "AI will handle the routine. What it cannot replace is a child who knows how to think, question, create and solve a problem worth solving. That is the whole reason BrainLIT exists.",
  bio: null as string | null,
  photoUrl: null as string | null,
};
