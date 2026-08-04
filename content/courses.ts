/**
 * Programs.
 *
 * SHIPS EMPTY ON PURPOSE.
 *
 * Course names, age bands, duration, session count and price were not in the
 * client's discovery documents. Inventing them would put fabricated commercial
 * terms in front of parents deciding how to spend money on their child's
 * education — and every one of those numbers would then have to be walked back.
 *
 * The Programs page detects the empty list and shows an honest "being
 * finalised" state with a route to the free session, which is the correct
 * conversion path anyway. Fill this array and the full listing appears, with
 * per-program detail pages generated automatically.
 *
 * NEEDS INPUT for each program: name, slug, summary, age range, duration,
 * session count, price in INR, and the curriculum outline.
 */

export type CourseModule = {
  title: string;
  description: string;
};

export type Course = {
  slug: string;
  title: string;
  summary: string;
  ageMin: number;
  ageMax: number;
  durationWeeks: number;
  sessionsPerWeek?: number;
  priceInr: number | null;
  outcomes: string[];
  curriculum: CourseModule[];
};

export const COURSES: Course[] = [];

export function findCourse(slug: string): Course | undefined {
  return COURSES.find((course) => course.slug === slug);
}

/**
 * What every program shares, regardless of which one a family picks. These are
 * supported by the discovery documents, so they can be stated now.
 */
export const PROGRAM_ESSENTIALS = [
  {
    title: "Live, never recorded",
    body: "Thinking is taught through questions and disagreement. That does not happen watching a video.",
  },
  {
    title: "Small batches",
    body: "Small enough that every child has to speak, and cannot hide at the back.",
  },
  {
    title: "Ages 10–14",
    body: "Old enough to reason about their own thinking, young enough that the habits still form easily.",
  },
  {
    title: "A real project to show",
    body: "Every child finishes with work they scoped, built and can explain — not a certificate of attendance.",
  },
];
