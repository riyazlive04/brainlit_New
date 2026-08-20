import "server-only";

import {
  FAQS,
  PRICING,
  WHY_NOW,
  TRANSFORMATION,
  CURRICULUM,
  OUTCOMES,
  JOURNEY,
  COMPARISON,
  WEBINAR_VALUE,
} from "@/content/home";
import { PROGRAM_ESSENTIALS } from "@/content/courses";
import { getPublishedCourses } from "@/lib/content";

/**
 * Answering a typed question by FINDING the answer, never by writing one.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RETRIEVAL WITHOUT GENERATION, AND WHY THAT IS THE WHOLE POINT.
 *
 * Every string this module can return was written by a person and is returned
 * WORD FOR WORD. There is no model in the path, so there is no mechanism by
 * which a price, an age range, a batch size or a class date could come out
 * different from what is in content/home.ts. For a page whose whole job is to
 * be trusted by a parent deciding where to send their child, that guarantee is
 * worth more than fluent phrasing.
 *
 * The cost is real and should be understood rather than hidden: this cannot
 * rephrase, cannot combine two answers, and cannot handle a question the
 * content does not already answer. Those fall through to `outOfScope`, which
 * points at a human. A wrong answer delivered confidently is far worse than an
 * honest handover, so the threshold below is deliberately unkind.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * WHY BM25 AND NOT EMBEDDINGS. Embeddings would catch paraphrases this misses -
 * but computing them needs either a hosted API or a local model, which is the
 * exact dependency we just removed. Over 28 FAQs and a page of copy, lexical
 * scoring with a sensible threshold gets the common questions right, runs in
 * under a millisecond, works offline, and is inspectable when it goes wrong.
 */

/* ════════════════════════════════════════════════════════ Tokenising ══ */

/**
 * Words too common to carry meaning. Cutting them stops "what is the cost of
 * the course" from matching every entry that happens to contain "the".
 *
 * "how", "what", "when", "who" and "why" are deliberately KEPT. In an FAQ they
 * are signal, not noise - "how long is it" and "when does it start" differ by
 * exactly that word.
 */
const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "do", "does",
  "for", "from", "has", "have", "i", "if", "in", "is", "it", "its", "me", "my",
  "of", "on", "or", "our", "so", "that", "the", "then", "there", "these",
  "they", "this", "to", "up", "was", "we", "will", "with", "you", "your",
]);

/**
 * A crude suffix strip, so "classes" matches "class" and "costs" matches
 * "cost". Not a real stemmer - a real one would need a dictionary and would
 * mangle "ai" into nothing. This handles the plurals and gerunds that actually
 * appear in parent questions and leaves everything else alone.
 */
function stem(word: string): string {
  if (word.length <= 3) return word;

  let out = word;
  for (const suffix of ["ing", "ies", "es", "s"]) {
    if (out.endsWith(suffix) && out.length - suffix.length >= 3) {
      out = out.endsWith("ies") ? out.slice(0, -3) + "y" : out.slice(0, -suffix.length);
      break;
    }
  }

  /**
   * Then drop a trailing "e".
   *
   * Without this, "pricing" stems to "pric" while "price" stays "price" and the
   * two never meet - a parent typing "pricing" got the WhatsApp fallback while
   * "price" found the answer. Cutting the "e" from both lands them on "pric".
   *
   * Applied to every stem rather than only after an "ing" strip, so the two
   * halves cannot disagree: "live"/"living" both reach "liv", "course"/"courses"
   * both reach "cours".
   */
  if (out.length > 3 && out.endsWith("e")) out = out.slice(0, -1);

  return out;
}

/**
 * Words parents type, mapped to words the content uses.
 *
 * Lexical matching has exactly one weakness and this is it: the FAQ answering
 * "does my child need any background in this" is titled "My child has never
 * used AI. Is that a problem?" - same question, no shared vocabulary, so the
 * match failed and a real question got the WhatsApp fallback.
 *
 * Applied to the QUERY only, never the index. Expanding the index would make
 * every entry match more things; expanding the query makes one question reach
 * the words it meant. Keep this list short and evidence-driven - add a row when
 * a real question misses, not on a hunch.
 */
const SYNONYMS: Record<string, string[]> = {
  experience: ["used", "know", "beginner"],
  background: ["used", "know", "beginner"],
  prerequisite: ["used", "know", "beginner"],
  fee: ["cost", "price"],
  fees: ["cost", "price"],
  charge: ["cost", "price"],
  charges: ["cost", "price"],
  timing: ["schedule", "when", "time"],
  timings: ["schedule", "when", "time"],
  duration: ["long", "week"],
  syllabus: ["curriculum", "learn", "cover"],
  refund: ["stop", "cancel", "money"],
  language: ["tamil", "english"],
  laptop: ["need", "home", "device"],
  computer: ["need", "home", "device"],
};

/** The meaningful words of a query, before stemming, so SYNONYMS can be keyed on them. */
function rawWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

/**
 * One query word and everything it is allowed to match, all stemmed.
 *
 * A GROUP, not a flat list, and that distinction is the whole design. Flattened
 * into extra terms, "experience" would add three more words to the coverage
 * denominator that mostly will not match, so a synonym meant to HELP a question
 * would push it below the threshold instead. As a group it is one requirement
 * satisfied by any member.
 */
type TermGroup = { head: string; members: string[] };

function queryGroups(text: string): TermGroup[] {
  return rawWords(text).map((w) => ({
    head: stem(w),
    members: [w, ...(SYNONYMS[w] ?? [])].map(stem),
  }));
}

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    // Keep digits: "10-14", "6", "2026" are answers to real questions.
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    .map(stem);
}

/* ══════════════════════════════════════════════════════════ The index ══ */

type Entry = {
  /** What gets scored. */
  tokens: string[];
  /** What gets SENT BACK, verbatim. */
  answer: string;
  /** For logging and debugging a bad match. */
  label: string;
};

/**
 * Entries are built from the same content the site renders, so an edit to a FAQ
 * changes the bot's answer with no separate index to rebuild or re-embed. That
 * is the practical advantage of lexical scoring over a vector store here.
 *
 * A FAQ's QUESTION is repeated into the scored text. It is the single strongest
 * signal for matching - it is literally somebody asking the same thing - and
 * without the repetition a long answer's vocabulary drowns it out.
 */
function entry(label: string, scored: string, answer: string): Entry {
  return { tokens: tokenise(scored), answer, label };
}

let cached: { entries: Entry[]; builtAt: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function buildIndex(): Promise<Entry[]> {
  if (cached && Date.now() - cached.builtAt < TTL_MS) return cached.entries;

  const entries: Entry[] = [];

  for (const faq of FAQS) {
    entries.push(
      // Question three times: see the note above.
      entry(
        `faq:${faq.question}`,
        `${faq.question} ${faq.question} ${faq.question} ${faq.answer}`,
        faq.answer,
      ),
    );
  }

  entries.push(
    entry(
      "why-now",
      `why now AI changing childhood school ${WHY_NOW.heading} ${WHY_NOW.intro}`,
      `${WHY_NOW.intro} ${WHY_NOW.turn} ${WHY_NOW.punch}`,
    ),
  );

  entries.push(
    entry(
      "how-taught",
      // "how many kids in a class" was losing to an unrelated FAQ because none
      // of these words were in the index. Batch size is a question every parent
      // asks and the answer lives in PROGRAM_ESSENTIALS, so it needs the
      // vocabulary that actually gets typed.
      `how taught format live recorded online class classroom batch size small group how many children kids students per batch strength age ${PROGRAM_ESSENTIALS.map((p) => `${p.title} ${p.body}`).join(" ")}`,
      PROGRAM_ESSENTIALS.map((p) => `${p.title}: ${p.body}`).join("\n"),
    ),
  );

  entries.push(
    entry(
      "difference",
      `different how is BrainLIT different from other coding classes usual ${COMPARISON.map((r) => r.theme).join(" ")}`,
      COMPARISON.map((r) => `${r.theme} - usually ${r.usual} At BrainLIT ${r.brainlit}`).join("\n"),
    ),
  );

  entries.push(
    entry(
      "curriculum",
      `curriculum syllabus weeks what do they learn topics ${CURRICULUM.map((w) => `${w.week} ${w.title}`).join(" ")}`,
      CURRICULUM.map((w) => `${w.week} - ${w.title}: ${w.body}`).join("\n"),
    ),
  );

  entries.push(
    entry(
      "outcomes",
      `outcome result what will my child get portfolio project confidence ${OUTCOMES.map((o) => o.title).join(" ")}`,
      OUTCOMES.map((o) => `${o.title}: ${o.body}`).join("\n"),
    ),
  );

  entries.push(
    entry(
      "journey",
      // "get started" and "sign up" are how parents actually phrase this, and
      // without them the question lost to the outcomes entry on the word "get".
      `how do we get started start begin join enrol enroll sign up apply admission first step next step ${JOURNEY.map((s) => s.title).join(" ")}`,
      JOURNEY.map((s) => `${s.title}: ${s.body}`).join("\n"),
    ),
  );

  entries.push(
    entry(
      "webinar",
      `free webinar parent session demo trial ${WEBINAR_VALUE.heading} ${WEBINAR_VALUE.items.map((i) => i.title).join(" ")}`,
      `${WEBINAR_VALUE.intro}\n` +
        WEBINAR_VALUE.items.map((i) => `${i.title}: ${i.body}`).join("\n"),
    ),
  );

  entries.push(
    entry(
      "transformation",
      `what changes before after how children use AI copying thinking ${TRANSFORMATION.heading}`,
      `${TRANSFORMATION.before.label}: ${TRANSFORMATION.before.items.join("; ")}\n` +
        `${TRANSFORMATION.after.label}: ${TRANSFORMATION.after.items.join("; ")}`,
    ),
  );

  /**
   * Programmes come from the DATABASE, so a price edited in /admin changes the
   * answer here without a deploy. This is the entry most likely to be asked
   * about and the one where a stale answer would do real damage, which is why
   * the whole index carries a five minute TTL rather than being built once.
   */
  const courses = await getPublishedCourses().catch(() => []);
  for (const c of courses) {
    const facts = [
      c.summary ?? "",
      `Ages ${c.age_min} to ${c.age_max}.`,
      c.duration_weeks ? `${c.duration_weeks} weeks.` : "",
      c.price_inr ? `INR ${c.price_inr}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

    entries.push(
      entry(
        `course:${c.slug}`,
        `${c.title} price cost fee how much age duration programme course ${facts}`,
        `${c.title} - ${facts}`,
      ),
    );
  }

  // Only useful if it actually says something; PRICING is a shape that may hold
  // placeholders, and an entry made of empty strings matches nothing well but
  // can still win a weak race.
  const pricingText = JSON.stringify(PRICING);
  if (pricingText.length > 20) {
    entries.push(
      entry(
        "pricing",
        `price cost fee how much money rupees expensive afford ${pricingText}`,
        Object.values(PRICING)
          .filter((v) => typeof v === "string" && v.length > 0)
          .join(" "),
      ),
    );
  }

  cached = { entries: entries.filter((e) => e.answer.trim().length > 0), builtAt: Date.now() };
  return cached.entries;
}

/* ═══════════════════════════════════════════════════════════ Scoring ══ */

const K1 = 1.5;
const B = 0.75;

/**
 * The bar a match has to clear to be shown at all.
 *
 * Tuned by hand against the real FAQ set: high enough that "what is the weather"
 * returns nothing rather than the nearest FAQ, low enough that a three-word
 * question like "how much" still finds pricing. If it starts answering the
 * wrong thing, RAISE this before touching anything else - the failure mode that
 * matters is a confident wrong answer, not a handover to WhatsApp.
 */
const MIN_SCORE = 2.2;

/**
 * How much of a question's meaning must be found before an answer is offered,
 * as a fraction of its IDF mass. See the coverage gate in `search`.
 *
 * 0.4 rather than 0.5, because a single unrecognised word carries the maximum
 * possible weight and half of a four-word question is easy to lose to one of
 * them: "does my child need coding experience" matches child, need and coding,
 * but "experience" is not in the corpus and on its own outweighed all three.
 *
 * The off-topic questions stay rejected at this level - they fail by a wide
 * margin (0.2 and below), not a narrow one. Raise it if wrong answers start
 * appearing; a handover to WhatsApp is always the cheaper mistake.
 */
const MIN_COVERAGE = 0.4;

export type Match = { answer: string; label: string; score: number };

/**
 * A match, plus how much of the question the corpus RECOGNISED at all.
 *
 * `familiarity` is the share of the question's IDF mass made of words that
 * appear somewhere - anywhere - in BrainLIT's content. It is not about whether
 * a good answer was found; it is about whether the question was even on the
 * subject.
 *
 * That distinction is the whole reason this type exists. "What qualifications
 * do the teachers have?" and "do you sell used cars?" both fail to find an
 * answer, and they deserve completely different replies: the first is a fair
 * question we simply have not written down, and belongs with a human. The
 * second is not about us, and pointing it at WhatsApp wastes somebody's time
 * on both ends.
 */
export type SearchResult = { match: Match | null; familiarity: number };

/**
 * Below this share of recognised words - AND with no domain word present - a
 * question is treated as off-topic. Both conditions, never one alone.
 *
 * Familiarity alone was measured and is not separable. Across real examples the
 * off-topic misses landed at 0.37, 0.39 and 0.39 ("write me a poem about dogs",
 * "who won the cricket match", "recommend a good biryani place") while a
 * genuine unanswered question, "what are the teachers qualifications", scored
 * 0.49. Any single cut through a 0.39/0.49 gap is a coin toss that would start
 * telling real parents to stay on topic.
 *
 * The reason they scored at all is that ordinary English words appear in the
 * corpus too - "who", "good", "about", "write". Those raise familiarity while
 * saying nothing about the subject. DOMAIN_WORDS is the second, decisive
 * signal: is any word here about a school, a child, or a course?
 */
const MIN_FAMILIARITY = 0.5;

/**
 * The subject, in words. If a question contains ONE of these it is treated as
 * being about BrainLIT, however badly it matched.
 *
 * Stated explicitly rather than inferred, because it is a judgement about scope
 * and not a statistic - and because when this gets it wrong the fix is to read
 * this list and add a word, which anyone can do.
 */
const DOMAIN_WORDS = [
  "brainlit", "ai", "artificial", "intelligence", "chatgpt", "prompt",
  "child", "children", "kid", "kids", "son", "daughter", "student", "parent",
  "class", "classes", "course", "courses", "program", "programme", "batch",
  "session", "sessions", "webinar", "workshop", "curriculum", "syllabus",
  "teach", "teacher", "teachers", "tutor", "learn", "learning", "lesson",
  "homework", "project", "portfolio", "certificate", "school", "education",
  "fee", "fees", "cost", "price", "pricing", "payment", "refund", "discount",
  "age", "ages", "old", "enrol", "enroll", "admission", "join", "register",
  "schedule", "timing", "duration", "week", "weeks", "live", "recorded",
  "online", "offline", "tamil", "english", "laptop", "screen", "safe",
  "privacy", "consent", "thinking", "skill", "skills",
].map(stem);

const DOMAIN = new Set(DOMAIN_WORDS);

/** Classic BM25. Returns null when nothing clears MIN_SCORE. */
export function search(query: string, entries: Entry[]): SearchResult {
  const groups = queryGroups(query);
  // Scoring sees every member, so a synonym can win a match on its own.
  const terms = [...new Set(groups.flatMap((g) => g.members))];
  if (terms.length === 0 || entries.length === 0) {
    return { match: null, familiarity: 0 };
  }

  const N = entries.length;
  const avgLen = entries.reduce((sum, e) => sum + e.tokens.length, 0) / N;

  // Document frequency per term, computed over the whole index so a word that
  // appears in every entry ("brainlit", "child") contributes almost nothing.
  const df = new Map<string, number>();
  const idf = new Map<string, number>();
  for (const term of new Set(terms)) {
    let count = 0;
    for (const e of entries) if (e.tokens.includes(term)) count += 1;
    df.set(term, count);
    // A term the corpus has NEVER seen is maximally specific, not ignorable.
    // Scoring skips it (nothing to score against) but coverage below counts it
    // in the denominator, which is what makes "sell used cars" fall through.
    idf.set(term, Math.log(1 + (N - count + 0.5) / (count + 0.5)));
  }

  /**
   * How much of the question the corpus recognises AT ALL - before any question
   * of which entry wins. A group counts as recognised if any of its members
   * appears somewhere in the index.
   */
  let familiarTotal = 0;
  let familiarFound = 0;
  for (const g of groups) {
    const weight = idf.get(g.head) ?? 0;
    familiarTotal += weight;
    if (g.members.some((m) => (df.get(m) ?? 0) > 0)) familiarFound += weight;
  }
  const familiarity = familiarTotal > 0 ? familiarFound / familiarTotal : 0;

  let best: Match | null = null;

  for (const e of entries) {
    const len = e.tokens.length;
    if (len === 0) continue;

    let score = 0;
    for (const term of terms) {
      if ((df.get(term) ?? 0) === 0) continue;

      let tf = 0;
      for (const t of e.tokens) if (t === term) tf += 1;
      if (tf === 0) continue;

      score +=
        (idf.get(term) ?? 0) *
        ((tf * (K1 + 1)) / (tf + K1 * (1 - B + (B * len) / avgLen)));
    }

    if (!best || score > best.score) {
      best = { answer: e.answer, label: e.label, score };
    }
  }

  if (!best || best.score < MIN_SCORE) return { match: null, familiarity };

  /**
   * COVERAGE GATE, WEIGHTED BY IDF. Score alone is not enough.
   *
   * "do you sell used cars" reduces to [sell, use, car]. Only "use" appears in
   * the corpus - in "how children use AI" - and that one term cleared MIN_SCORE
   * on its own, so an off-topic question came back with a confident FAQ answer
   * about prior coding experience. That is the single worst thing this can do.
   *
   * Counting matched terms fixed that but broke "what is the price": two terms,
   * one of them the near-meaningless "what", so a perfectly good question was
   * refused for failing to match a word that carries nothing.
   *
   * So the gate weighs terms by IDF instead of counting them. "what" and "how"
   * appear everywhere, contribute almost nothing to the denominator, and their
   * absence costs almost nothing; "sell" and "car" appear NOWHERE, so they
   * carry maximum weight and can never be matched. The question must find at
   * least half of what it was actually asking about.
   */
  const winner = entries.find((e) => e.label === best.label);
  if (winner) {
    let total = 0;
    let found = 0;
    // One group = one thing the parent asked about. Weighted by the word they
    // actually typed, satisfied by any of its synonyms.
    for (const g of groups) {
      const weight = idf.get(g.head) ?? 0;
      total += weight;
      if (g.members.some((m) => winner.tokens.includes(m))) found += weight;
    }
    if (total > 0 && found / total < MIN_COVERAGE) return { match: null, familiarity };
  }

  return { match: best, familiarity };
}

/**
 * What the route gets back.
 *
 * Three outcomes rather than a string-or-null, because the two failures are not
 * the same failure and the reply should not pretend they are. The WORDING for
 * each lives in content/chatbot.ts; this decides only which one applies.
 */
export type Answer =
  /** Found it. `text` was written by a person and is returned untouched. */
  | { kind: "answer"; text: string }
  /** About BrainLIT, but the content does not cover it. Hand to a human. */
  | { kind: "unanswered" }
  /** Not about BrainLIT at all. Steer back rather than involve a human. */
  | { kind: "off_topic" };

export async function answerFromContent(question: string): Promise<Answer> {
  const entries = await buildIndex();
  const { match, familiarity } = search(question, entries);

  if (match) {
    // Useful when somebody reports a wrong answer: it names the entry that won
    // and by how much, which is the whole diagnosis.
    console.log(
      `[chat] "${question.slice(0, 60)}" -> ${match.label} (${match.score.toFixed(2)})`,
    );
    return { kind: "answer", text: match.answer };
  }

  // One domain word is enough to earn a human. "What are the teachers
  // qualifications" scores no better than "who won the cricket match" on
  // familiarity alone; "teachers" is the entire difference.
  const onSubject = queryGroups(question).some((g) =>
    g.members.some((m) => DOMAIN.has(m)),
  );

  const kind =
    !onSubject && familiarity < MIN_FAMILIARITY ? "off_topic" : "unanswered";
  console.log(
    `[chat] "${question.slice(0, 60)}" -> ${kind} (familiarity ${familiarity.toFixed(2)})`,
  );
  return { kind };
}
