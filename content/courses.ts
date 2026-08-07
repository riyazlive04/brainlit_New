/**
 * Static copy shared by every programme.
 *
 * Programme records themselves now live in the database and are managed from
 * /admin — they were previously a hard-coded array here, which meant adding a
 * programme required a developer and a deploy.
 *
 * What stays here is the part that is true of all of them regardless, and is
 * editorial rather than data.
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
    title: "Ages 10-14",
    body: "Old enough to reason about their own thinking, young enough that the habits still form easily.",
  },
  {
    title: "A real project to show",
    body: "Every child finishes with work they scoped, built and can explain - not a certificate of attendance.",
  },
];
