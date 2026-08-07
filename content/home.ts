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
 * Everything below is derived from the client's own discovery documents and the
 * homepage improvement brief. Where a fact was not in those documents —
 * pricing, batch size, attendance numbers, ratings — the copy is written to
 * avoid claiming it rather than inventing a plausible number.
 * Search for NEEDS INPUT.
 *
 * Several arrays ship EMPTY on purpose: PROOF_STATS and RESOURCES. Their
 * sections render nothing until real content is supplied. An empty section
 * costs a conversion; a fabricated statistic on a site selling education to
 * parents is a different kind of thing entirely, and it is also the sort of
 * claim that gets an ad account rejected.
 *
 * Removed Aug 2026 along with their sections — see the cut list in
 * app/(marketing)/page.tsx before re-adding any of them: TRUST_MARKS,
 * ARTICLES, PODCAST.episodes and HOW_IT_WORKS.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ═══════════════════════════════════════════════════════ Why now — urgency ══ */

/**
 * The urgency argument.
 *
 * Deliberately built from what AI can already do — statements any parent can
 * verify in thirty seconds — rather than from adoption statistics we would have
 * to source. A cited figure we cannot defend is worse than no figure.
 */
export const WHY_NOW = {
  eyebrow: "Why now",
  heading: "AI is changing childhood faster than schools can.",
  intro:
    "None of this was true when you were at school. Most of it was not true three years ago.",
  capabilities: [
    { label: "Homework", body: "Finished, formatted and plausible, in seconds." },
    { label: "Mathematics", body: "Solved, with the working shown underneath." },
    { label: "Essays", body: "Written in any voice, on any book, at any length." },
    { label: "Code", body: "Generated, explained and debugged on request." },
    { label: "Almost any question", body: "Answered instantly - confidently, and sometimes wrongly." },
  ],
  turn: "So the question is no longer whether your child will use AI.",
  punch:
    "It is whether they will know how to think, or quietly learn to depend on it.",
  footnote:
    "Every month that answer gets harder to change, because habits form long before anyone teaches the skill.",
} as const;

/* ══════════════════════════════════════════════════════════ Positioning ══ */

/**
 * BrainLIT against the category it is most often confused with.
 *
 * The left column is deliberately labelled by approach, not by competitor. We
 * are not naming or ranking other academies — we do not have evidence about
 * any specific one, and a comparison table that does is a legal and reputational
 * liability rather than a marketing asset.
 */
export type ComparisonRow = { theme: string; usual: string; brainlit: string };

export const COMPARISON: ComparisonRow[] = [
  { theme: "What is taught", usual: "Coding", brainlit: "Thinking" },
  { theme: "What is built", usual: "Tool skills", brainlit: "Mindset" },
  { theme: "The focus", usual: "Syntax and steps", brainlit: "Creativity and judgement" },
  { theme: "What they leave with", usual: "A certificate", brainlit: "A portfolio they can explain" },
  { theme: "How it is learned", usual: "Memorisation", brainlit: "Problem solving" },
];

/* ═════════════════════════════════════════════════════ Transformation ══ */

/**
 * Before and after.
 *
 * Framed as "where most children start" → "what we are building toward", not as
 * a guaranteed result. The distinction matters: the second version is a promise
 * about an individual child that no education provider can honestly make.
 */
export const TRANSFORMATION = {
  eyebrow: "What changes",
  heading: "The same tool, used two completely different ways.",
  before: {
    label: "Where most children start",
    items: [
      "Asks the AI for the answer",
      "Copies what it produces into the homework",
      "Cannot tell a good answer from a confident wrong one",
      "Stops at the first response",
    ],
  },
  after: {
    label: "What we build toward",
    items: [
      "Asks the AI for options, then chooses",
      "Uses it to get unstuck, not to skip the work",
      "Notices when the answer is wrong and says so",
      "Pushes further - and knows when to close the laptop",
    ],
  },
} as const;

/* ════════════════════════════════════════════════════════ Curriculum ══ */

/**
 * The learning roadmap.
 *
 * NEEDS INPUT: these four themes come from the client's homepage brief, where
 * they were given as an example. Confirm them against the real syllabus before
 * launch — a parent who enrols on the strength of this page will expect it.
 */
export type CurriculumWeek = { week: string; title: string; body: string };

export const CURRICULUM: CurriculumWeek[] = [
  {
    week: "01",
    title: "Thinking Foundations",
    body: "How to take a question apart before answering it. What makes a claim believable. Why the first answer is rarely the best one.",
  },
  {
    week: "02",
    title: "Creativity with AI",
    body: "Using AI to widen the range of ideas instead of narrowing it. Making something the model could not have produced alone.",
  },
  {
    week: "03",
    title: "Problem Solving",
    body: "Breaking a hard, vague problem into small solvable pieces - the skill that makes everything else possible.",
  },
  {
    week: "04",
    title: "Portfolio Project",
    body: "Your child scopes, builds and presents something of their own, and can explain every decision in it.",
  },
];

/**
 * What a child leaves with.
 *
 * No counts here. "3 projects" and similar numbers appeared in the brief as
 * examples; stating one commits us to delivering exactly that.
 * NEEDS INPUT: confirm the real deliverables and we will make them specific,
 * which will convert considerably better than this does.
 */
export const OUTCOMES = [
  { title: "Work they can show", body: "A finished project they scoped and built, not a worksheet." },
  { title: "A portfolio", body: "Their own work, collected somewhere they can point a school or a relative at." },
  { title: "The ability to present", body: "Standing up and explaining a decision to a room, which most adults still cannot do." },
  { title: "Better questions", body: "Prompting well is really just asking well, and it transfers to everything else." },
  { title: "A thinking framework", body: "A repeatable way to approach a problem they have never seen before." },
  { title: "Confidence", body: "The quiet kind that comes from having actually made something." },
] as const;

/* ═══════════════════════════════════════════════════ Student journey ══ */

/**
 * The path from a parent's first click to where a child ends up.
 * `upcoming` marks stages that do not exist yet — they are shown as planned,
 * never as something available today.
 */
export type JourneyStage = {
  title: string;
  body: string;
  upcoming?: boolean;
};

export const JOURNEY: JourneyStage[] = [
  { title: "You", body: "A parent wondering what AI is doing to their child's thinking." },
  { title: "Free parent session", body: "Live, no pitch. You see how we teach and ask what you want." },
  { title: "Enrolment", body: "Grouped by age and readiness. We will say if it is worth waiting a year." },
  { title: "Weekly live classes", body: "Small batches, taught through discussion and argument." },
  { title: "Projects", body: "Real work, scoped and built by your child." },
  { title: "Portfolio", body: "Everything collected into something they can show." },
  { title: "Certificate", body: "Completion, backed by work rather than attendance." },
  { title: "Founder Program", body: "For students who want to take an idea further.", upcoming: true },
];

/* ═══════════════════════════════════════════════════ Webinar value ══ */

/** What a parent actually gets for the hour — the answer to "what's the catch". */
export const WEBINAR_VALUE = {
  eyebrow: "The free parent session",
  heading: "One hour, for parents, about the thing nobody has explained yet.",
  intro:
    "Not a demo class for your child and not a sales presentation you have to sit through. It is a conversation for you.",
  items: [
    { title: "The AI myths", body: "What is genuinely changing, and what is marketing noise dressed as urgency." },
    { title: "Screen time, honestly", body: "Why the hours matter less than what is happening during them." },
    { title: "The careers question", body: "What we can reasonably say about the next ten years, and what nobody can." },
    { title: "The thinking framework", body: "The actual method we teach, walked through so you can use it at home tonight." },
    { title: "Live Q&A", body: "Your questions about your child, answered by a person, not a slide." },
    { title: "A walkthrough of the program", body: "What it covers, how it runs, what it costs. At the end, so you can leave before it." },
  ],
} as const;

/* ═══════════════════════════════════════════════════════════ Pricing ══ */

/**
 * NEEDS INPUT — every field below.
 *
 * `startingFromInr` null renders an honest "fees are covered in the session"
 * panel instead of a price. That is deliberate: a parent who cannot find any
 * indication of cost assumes the worst and leaves, so saying "we will tell you,
 * here is when" beats saying nothing.
 *
 * `hasScholarships` stays false until the client confirms a scholarship
 * actually exists. Advertising one that does not is a straightforward
 * misrepresentation.
 */
export const PRICING = {
  startingFromInr: null as number | null,
  /** e.g. "per 4-week program" — required if a price is set, or the number is meaningless */
  unit: null as string | null,
  hasInstalments: false,
  hasScholarships: false,
  note: "Fees depend on the program and age group. We go through them at the end of the free parent session, so you can hear how we teach before you think about cost.",
} as const;

/* ═════════════════════════════════════════════════════ Proof / stats ══ */

/**
 * Headline numbers.
 *
 * SHIPS EMPTY, AND MUST. The brief suggested "100+ parents attended",
 * "30+ student projects", "4.9/5 parent rating" as examples. Every one of those
 * is a factual claim about the business that we cannot verify, that appears
 * beside a request for money, and that Meta and Google both treat as a
 * substantiable advertising claim.
 *
 * Fill it in as soon as the real figures exist — this is one of the highest
 * converting sections on the page, and it stays invisible until then.
 */
export type ProofStat = {
  /** The number as it should read, including any "+" — e.g. "100+" */
  value: string;
  label: string;
  /** Shown small underneath. Use it to make the claim precise and defensible. */
  qualifier?: string;
};

export const PROOF_STATS: ProofStat[] = [
  // { value: "100+", label: "Parents attended", qualifier: "Across 6 sessions since Jan 2026" },
  // { value: "30+",  label: "Student projects", qualifier: "Built and presented by students" },
  // { value: "4.9/5", label: "Parent rating",   qualifier: "From 41 post-session responses" },
];

/* ═══════════════════════════════════════════════════════════ Founder ══ */

/**
 * Founder.
 *
 * NEEDS INPUT: `story`, `photoUrl` and `credentials`.
 *
 * `story` is the highest-value missing item on this entire page. Parents choose
 * a small education brand on the strength of the person behind it, and a quote
 * cannot do that work. It should be written in the founder's own voice and
 * answer: what did you see that made you start this, and why should a parent
 * trust you with their child's thinking.
 *
 * The section adapts to what exists rather than showing a placeholder avatar or
 * lorem paragraphs.
 */
export const FOUNDER = {
  name: "Haja Najmudeen",
  role: "Founder & CEO",

  eyebrow: "Meet the founder",
  heading: "Helping children think in the age of AI.",

  /**
   * The pull quote. Supplied by the founder and left exactly as written — it is
   * the sharpest line on the page and any editing would only blunt it.
   */
  quote: "Technology changes fast. Thinking lasts forever.",

  /**
   * Long-form, first person, in the founder's own words. Paragraphs in order.
   * The pull quote above is lifted out of the middle of this, so it is not
   * repeated in the prose.
   */
  story: [
    "Hi, I'm Haja Najmudeen, Founder of BrainLIT.",
    "I'm an Electronics & Communication Engineer and a lifelong technology enthusiast. Over the years I've worked in technology, in software testing, and built several businesses. Through every one of those experiences I kept arriving at the same lesson.",
    "When AI became part of everyday life, I noticed something worrying. Children were learning how to get answers from AI - but very few were learning how to ask better questions, think critically, verify what they were told, solve real problems, or explain their own ideas with confidence.",
    "That is why I started BrainLIT. Not to teach children another AI tool, but to teach them how to think with AI instead of depending on it.",
  ] as string[],

  /**
   * The founder's own framing of what a session develops.
   *
   * Cut from seven items to three. Seven was the whole pillar list restated in
   * his voice — "solve meaningful problems", "build real projects", "present
   * ideas with confidence" and "use AI responsibly" are Problem Solving,
   * Portfolio Building, Communication and Ethical AI Usage, read a screen
   * earlier under their own heading. The argument for keeping them was that a
   * personal voice makes repetition read as conviction. It does not; it reads
   * as a page with less to say than it appears to.
   *
   * What is left is the part the pillars do not already cover, in his words.
   * The section's own guard handles a shorter list, and the two-column grid
   * takes three items without a gap.
   */
  mission: [
    "Ask powerful questions",
    "Think logically",
    "Research deeply",
  ] as string[],

  /** Closes the section. First person, and deliberately a promise, not a claim. */
  promise: {
    heading: "My promise to every parent",
    body: [
      "I don't want children to become dependent on AI. I want them to become the kind of thinkers who can lead it.",
      "In the future, AI won't replace children. But children who know how to think, create and lead with AI will stand out. That is the future we're building at BrainLIT.",
    ] as string[],
  },

  /** Short, factual. Verifiable claims only. */
  credentials: [
    "Electronics & Communication Engineer",
    "Background in technology and software testing",
    "Founder of several businesses",
  ] as string[],
  bio: null as string | null,
  /**
   * 1254×1254 square.
   *
   * The section renders it into an `aspect-[4/5]` box with `object-cover`, and
   * a square source is WIDER than that box — so the crop is HORIZONTAL: the
   * full height survives and about 10% is trimmed from each side. Keep the
   * subject centred left-to-right and allow room at the shoulders; there is no
   * need to bias the face upward, because nothing is cut off the top or bottom.
   */
  photoUrl: "/founder.png" as string | null,
};

/* ═══════════════════════════════════════════════════════════════ Hero ══ */

/**
 * The hero artwork, beside the headline on the first screen.
 *
 * Cropped from the client's `image.png`, which arrived as a partial export with
 * half-words orphaned along the left and bottom edges. The top band was removed
 * as well — it repeated the same "AI Literacy for the next generation of
 * Thinkers & Leaders" line as the <h1> directly beside it, and text baked into
 * an image is unselectable, untranslatable, invisible to search and does not
 * reflow on a phone.
 *
 * NEEDS INPUT: the full-resolution original. At 477px wide this is upscaled in
 * the hero column on any large screen and will look soft — and the hero is the
 * one image on the site that every visitor sees.
 *
 * The alt text describes the illustration rather than asserting these are
 * BrainLIT students. The figures are AI-generated, which is why no DPDP consent
 * question arises, and equally why nothing may present them as a real class.
 */
export const HERO = {
  photo: {
    src: "/programme.png",
    width: 477,
    height: 582,
    alt: "Illustration of a class working with AI: one student questioning an AI assistant, another writing by hand, and a third presenting a real-world case study on plastic waste.",
  },
} as const;

/*
 * The "At a glance" panel was removed at the client's request.
 *
 * It was built to hold a photograph beside the programme facts. The artwork
 * then went to the hero instead — the right call — which left the panel with a
 * placeholder drawing and two facts (ages, format) that a parent had already
 * read in the hero strapline two screens earlier. It was not earning its place.
 *
 * If it comes back, what would make it worth having is the facts that are still
 * missing: batch size, session length, number of weeks. Those are the numbers a
 * parent comparing two academies actually scans for, and nothing else on the
 * page states them.
 */

/* ═════════════════════════════════════════════ Interactive demo ══ */

/**
 * A sample of the actual lesson, playable in the page.
 *
 * Each item is a confident AI answer with something wrong in it. The point is
 * the same one the program makes in week one: the arithmetic can be perfect and
 * the reasoning still worthless, and a fluent answer is not evidence of a
 * correct one.
 *
 * FACT-CHECKED. Every claim used as the "correct" reading is verifiable:
 * ISRO was established in 1969 under Vikram Sarabhai; the mean of
 * 40/45/50/55/260 really is 90. If these are ever edited, re-check them — a
 * thinking exercise that is itself wrong would be a bad joke on this site.
 */
export type Challenge = {
  /** What a child asked */
  prompt: string;
  /** What the AI confidently replied */
  answer: string;
  options: string[];
  /** Index into `options` */
  correct: number;
  /** Shown once answered, whether or not they got it right */
  explanation: string;
  /** The transferable move, one line */
  lesson: string;
};

export const CHALLENGES: Challenge[] = [
  {
    prompt: "When was ISRO founded, and who started it?",
    answer:
      "ISRO was founded in 1969 by Dr. A. P. J. Abdul Kalam, who is widely regarded as the father of the Indian space programme.",
    options: [
      "The year is wrong",
      "The year is right, the person is wrong",
      "Nothing is wrong - this is correct",
    ],
    correct: 1,
    explanation:
      "ISRO really was established in 1969 - but by Vikram Sarabhai, who is the person usually called the father of the Indian space programme. Dr. Kalam was a major figure in it later, which is exactly why the sentence sounds right.",
    lesson:
      "Half-true is the most convincing kind of wrong. Check the part you did not doubt.",
  },
  {
    prompt:
      "A team scored 40, 45, 50, 55 and 260 in five matches. What do they usually score?",
    answer:
      "The total is 450 across 5 matches, so the average is 90. The team usually scores around 90.",
    options: [
      "The arithmetic is wrong",
      "The arithmetic is right, but the conclusion is not",
      "Nothing is wrong - this is correct",
    ],
    correct: 1,
    explanation:
      "450 ÷ 5 really is 90, and the team has never once scored anywhere near it. One enormous innings drags the average up. In four matches out of five they scored between 40 and 55 - that is what 'usually' means.",
    lesson:
      "Correct maths can still produce a false statement. Ask what the number is being used to claim.",
  },
  {
    prompt: "Which is the best programming language?",
    answer:
      "Python is the best programming language. It is easy to read, has huge library support, and is used everywhere in AI.",
    options: [
      "It picked the wrong language",
      "The question cannot be answered as asked",
      "Nothing is wrong - this is correct",
    ],
    correct: 1,
    explanation:
      "Every fact given about Python is true. But 'best' depends entirely on best for what - a game console, a website, a satellite and a school project all have different answers. The AI answered a question nobody could answer rather than saying so.",
    lesson:
      "These tools will almost never tell you that your question was the problem. That part is your job.",
  },
];

/* ═══════════════════════════════════════════════════════════ Podcast ══ */

/**
 * The podcast channel, linked from the footer.
 *
 * NEEDS INPUT: `channelUrl`. The footer link hides itself while it is null.
 *
 * There was also an `episodes` list and an `ARTICLES` list feeding a "Library"
 * band on the homepage. Both are gone. Episodes and articles are worth having
 * — they are just not a homepage section; they belong on /podcast and /blog,
 * which the discovery docs ask for and which do not exist yet. Hand-listing
 * them on the homepage was standing in for a build that still has to happen.
 */
export const PODCAST = {
  channelUrl: null as string | null,
};

/* ═════════════════════════════════════════════════════════ Resources ══ */

/**
 * Lead magnets.
 *
 * NEEDS INPUT: the guides themselves. Each needs a real downloadable file at
 * `href`. Listing a resource that 404s is worse than not listing it — it is the
 * first promise we make to a parent and it would be a broken one.
 */
export type Resource = {
  title: string;
  body: string;
  /** Path to the file in /public, or an external URL */
  href: string;
  /** e.g. "PDF · 8 pages" */
  meta?: string;
};

export const RESOURCES: Resource[] = [
  // { title: "The AI Parent Guide", body: "…", href: "/resources/ai-parent-guide.pdf", meta: "PDF · 12 pages" },
  // { title: "Prompt Guide for Families", body: "…", href: "/resources/prompt-guide.pdf" },
  // { title: "Screen Time Checklist", body: "…", href: "/resources/screen-time.pdf" },
  // { title: "AI Safety Guide", body: "…", href: "/resources/ai-safety.pdf" },
];

/* ═══════════════════════════════════════════════════════ Community ══ */

/**
 * Parent WhatsApp community.
 * NEEDS INPUT: `inviteUrl`. Hidden until it exists.
 */
export const COMMUNITY = {
  inviteUrl: process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL ?? null,
  heading: "The BrainLIT parent community",
  body: "A WhatsApp group for parents working out the same things you are. No selling, and you can leave whenever you like.",
  benefits: [
    "Conversations with parents facing the same questions",
    "Plain-language updates when something in AI actually matters",
    "Reminders before each free session",
    "Guides and reading, shared as we write them",
  ],
} as const;

/*
 * TRUST_MARKS ("featured in", partner schools, guest talks, awards) was removed
 * with its section. Logos of third parties are the weakest trust signal
 * available to us, and every entry is a claim about someone who did not agree
 * to appear here. Testimonials and StudentProjects do that job far harder and
 * are already built and waiting on content.
 *
 * HOW_IT_WORKS was removed with its section too. Its four steps — free session,
 * choose a program, live small batches, build something real — are stages 2 to
 * 5 of JOURNEY above, which says the same thing at more length and in order.
 */

/* ═════════════════════════════════════════════════════════════ FAQ ══ */

export type Faq = { question: string; answer: string; category: FaqCategory };

export type FaqCategory =
  | "The approach"
  | "AI and screens"
  | "Your child"
  | "How classes run"
  | "Fees and refunds"
  | "Safety and privacy";

/**
 * The full question set.
 *
 * The homepage shows the first few; /faq shows all of them grouped by category.
 * Answers about fees and refunds deliberately do not state numbers — the fee
 * structure is not confirmed, and the refund window in lib/legal.ts is still a
 * placeholder awaiting legal review. They point at the real source instead of
 * inventing terms that would then contradict the policy page.
 */
export const FAQS: Faq[] = [
  /* ── The approach ──────────────────────────────────────────────────── */
  {
    category: "The approach",
    question: "Is this a coding class?",
    answer:
      "No. Coding tools change every few months, and AI already writes most routine code. We teach the layer underneath - how to question an answer, frame a problem, judge whether something is any good, and decide when AI should not be used at all. Those skills outlast any tool.",
  },
  {
    category: "The approach",
    question: "How is this different from other AI courses for children?",
    answer:
      "Most teach children to operate a tool - this prompt, that button, this app. We teach the thinking that decides what to ask for in the first place. A child who can only operate today's tools has to be retrained every time the tools change.",
  },
  {
    category: "The approach",
    question: "What does a session actually look like?",
    answer:
      "Live, small, and closer to a discussion than a lecture. A problem is put on the table, children argue about it, they try things, and the reasoning gets examined out loud. Some of it involves AI. A fair amount of it deliberately does not.",
  },
  {
    category: "The approach",
    question: "Is this just critical thinking with AI attached for marketing?",
    answer:
      "It is critical thinking taught in the situation children now actually face - where a confident answer is always one sentence away. That context changes what has to be taught. Recognising a plausible-sounding wrong answer is a specific skill, and it did not need teaching at this scale five years ago.",
  },

  /* ── AI and screens ────────────────────────────────────────────────── */
  {
    category: "AI and screens",
    question: "Are you teaching children to use ChatGPT?",
    answer:
      "We teach them to think before they reach for it. Children will use these tools regardless of what any of us prefer. The question is whether they can tell a good answer from a confident wrong one - and that has to be taught deliberately.",
  },
  {
    category: "AI and screens",
    question: "Will this just mean more screen time?",
    answer:
      "It is a fair worry. Sessions are live and discussion-led rather than a child alone with a screen, and much of the work - questioning, planning, arguing a position - happens away from the keyboard. The aim is a child who uses AI deliberately instead of reflexively.",
  },
  {
    category: "AI and screens",
    question: "Isn't AI going to make my child lazier?",
    answer:
      "It can, and for a lot of children it already is. That is the reason this exists. Used as an answer machine it removes the struggle that learning depends on; used as a thinking partner it raises the ceiling. The difference is entirely in the habits, and habits are teachable.",
  },
  {
    category: "AI and screens",
    question: "Will my child stop doing their own homework?",
    answer:
      "We work on the opposite. A recurring theme is the difference between using AI to get unstuck and using it to skip the work - and why the second one costs you later, in the child's own words rather than ours.",
  },
  {
    category: "AI and screens",
    question: "Do you use AI tools in class?",
    answer:
      "Some of the time, with the session led by a teacher rather than by a tool. Plenty of sessions involve no AI at all, because you cannot teach someone to judge an answer if they have never had to produce one themselves.",
  },

  /* ── Your child ────────────────────────────────────────────────────── */
  {
    category: "Your child",
    question: "What ages is this for?",
    answer:
      "Ten to fourteen. That range is deliberate: old enough to reason about their own thinking, young enough that the habits still form easily.",
  },
  {
    category: "Your child",
    question: "My child has never used AI. Is that a problem?",
    answer:
      "Not at all, and it is often an advantage. We are teaching thinking, not software. A child who has never touched a chatbot has no habits to unlearn.",
  },
  {
    category: "Your child",
    question: "My child is shy and won't speak up. Will they cope?",
    answer:
      "Batches are kept small partly for this reason. Quiet children usually do not need to be pushed to talk so much as given a small enough room that talking stops feeling like a performance. Tell us before the first session and we will watch for it.",
  },
  {
    category: "Your child",
    question: "My child is older or younger than the range. Can they still join?",
    answer:
      "Come to the free parent session and ask. Readiness matters more than the birthday, and we would rather say honestly that a year's wait would serve your child better than take an enrolment that will not work.",
  },
  {
    category: "Your child",
    question: "What if my child does not enjoy it?",
    answer:
      "Tell us early rather than at the end. Sometimes it is a fit problem and sometimes it is a batch problem, and the second one we can usually fix. For anything to do with fees in that situation, the Refund Policy is the binding answer.",
  },

  /* ── How classes run ───────────────────────────────────────────────── */
  {
    category: "How classes run",
    question: "Are classes live or recorded?",
    answer:
      "Live. Thinking is taught through back-and-forth - a question asked at the moment a child is confused is most of the value, and a recording cannot do that.",
  },
  {
    category: "How classes run",
    question: "Are sessions recorded so we can catch up?",
    answer:
      "Recording a live class means recording other people's children, which brings consent obligations we take seriously. If your child misses a session, speak to us and we will sort out how they catch up.",
  },
  {
    category: "How classes run",
    question: "Do you teach in Tamil?",
    answer:
      "Sessions are conducted in English, and our team speaks Tamil - so parent conversations, questions and support happen in whichever you are more comfortable with.",
  },
  {
    category: "How classes run",
    question: "Do parents need to sit in?",
    answer:
      "No, and mostly it is better if you do not - children argue more freely without an audience. The free session is the one built for you, and we will tell you what to look for at home afterwards.",
  },
  {
    category: "How classes run",
    question: "What do we need at home?",
    answer:
      "A laptop or tablet with a working camera and microphone, and an internet connection good enough for video. Nothing needs to be bought or installed beyond that.",
  },
  {
    category: "How classes run",
    question: "Is there homework?",
    answer:
      "Small things between sessions, and closer to a challenge than an assignment - notice something, try something, come back with an opinion. The project work builds up across the program.",
  },

  /* ── Fees and refunds ──────────────────────────────────────────────── */
  {
    category: "Fees and refunds",
    question: "How much does it cost?",
    answer:
      "Fees depend on the program and age group, and we go through them at the end of the free parent session - after you have seen how we teach rather than before. If you would rather know first, message us and we will tell you.",
  },
  {
    category: "Fees and refunds",
    question: "Is the parent session really free?",
    answer:
      "Yes, and there is no obligation attached. The program walkthrough is at the end precisely so you can leave before it if you have what you came for.",
  },
  {
    category: "Fees and refunds",
    question: "What if we want to stop after starting?",
    answer:
      "The Refund Policy sets out the terms and is the binding version - please read it before enrolling rather than relying on a summary here.",
  },

  /* ── Safety and privacy ────────────────────────────────────────────── */
  {
    category: "Safety and privacy",
    question: "Is it safe for my child online?",
    answer:
      "Sessions are closed and joined by link, an adult from our team is present throughout, and children are known to us by first name only. We do not run open chat rooms or public forums for students.",
  },
  {
    category: "Safety and privacy",
    question: "What information do you keep about my child?",
    answer:
      "First name and age. That is all. Contact details are yours, not theirs, and we do not ask for a school, an address or a photograph. The Privacy Policy sets this out in full.",
  },
  {
    category: "Safety and privacy",
    question: "Would you ever publish my child's work or photograph?",
    answer:
      "Not without your written consent, recorded against that specific piece of work - and it is enforced in the database, not just promised in a policy. Consent can be withdrawn at any time and the work comes down.",
  },
  {
    category: "Safety and privacy",
    question: "Do you advertise to children?",
    answer:
      "No. Everything on this site is addressed to parents, and behavioural advertising aimed at children is prohibited under the DPDP Act 2023 - we do not do it and our analytics are configured not to.",
  },
];

/** The handful shown on the homepage — the rest live on /faq. */
export const HOMEPAGE_FAQS = FAQS.slice(0, 6);
