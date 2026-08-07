/**
 * The five shots of the hero cinematic, as scroll ranges.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EVERYTHING IS A PURE FUNCTION OF SCROLL POSITION. NOTHING IS A FUNCTION OF
 * TIME.
 *
 * This is the single rule the whole sequence is built on, and it is not a
 * stylistic preference. A scroll-driven film has no playhead: the viewer can
 * flick past four shots in one gesture, land mid-sequence from a bookmark, hit
 * the back button, or scrub slowly backwards. A time-based animation has no
 * correct answer for any of those. A positional one always renders the frame
 * that belongs to where the page is.
 *
 * The practical consequence: never accumulate. No `elapsed += delta`, no
 * play/pause state, no "has this shot fired yet" flags. Read `progress`, compute
 * the frame. Idle flourishes that genuinely have no correct position — a breath,
 * a flicker — may use the clock, but nothing that carries the story may.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type ShotName = "boy" | "throw" | "eyes" | "burn" | "mark";

/**
 * Shot boundaries as fractions of the cinematic zone.
 *
 * The ranges are deliberately even (~20% each) rather than weighted by how much
 * "happens" in each. Under scroll the viewer sets the pace, so an unevenly
 * divided timeline does not read as pacing — it reads as some shots being
 * mysteriously harder to scroll through than others.
 *
 * `boy` is the exception at 18%: it is the shot the visitor is looking at while
 * they read the headline, so it wants to be a fraction shorter than the ones
 * they are actively scrubbing through.
 */
export const SHOTS: Record<ShotName, { start: number; end: number }> = {
  /** He stands, rocket in hand. */
  boy: { start: 0.0, end: 0.18 },
  /** Wind-up, release, the trail draws. */
  throw: { start: 0.18, end: 0.38 },
  /** Dolly to his eyeline. Sky. The rocket climbing. */
  eyes: { start: 0.38, end: 0.58 },
  /** It catches fire and chars to embers. */
  burn: { start: 0.58, end: 0.78 },
  /** The embers converge into the mark. */
  mark: { start: 0.78, end: 1.0 },
};

/** Local 0..1 progress within one shot, clamped outside it. */
export function shotProgress(p: number, shot: ShotName): number {
  const { start, end } = SHOTS[shot];
  return Math.min(1, Math.max(0, (p - start) / (end - start)));
}

/**
 * The single frame shown when the visitor has asked for reduced motion.
 *
 * Late in the final shot: the mark formed, the filament lit, everything settled.
 * Not 1.0, because the very end of the range is where the camera has finished
 * arriving and the composition is at its most static — a hair before it reads as
 * a held frame rather than a stopped one.
 *
 * Every component reads this same constant. They used to each pick their own
 * value, which meant the rocket was posed for one moment of the film and the
 * mark for another, and the still they composed did not exist anywhere in the
 * actual sequence.
 *
 * This is a WCAG 2.3.3 obligation and a vestibular-safety issue, not a styling
 * preference. It must not be removed to "keep the cinematic consistent".
 */
export const REDUCED_MOTION_PROGRESS = 0.97;

/**
 * Fraction of the `eyes` shot spent travelling to the boy's eyeline.
 *
 * Short on purpose — see the note on the dolly in Cinematic.tsx. At normal
 * scrolling speed this passes in a few frames and reads as a cut.
 */
export const DOLLY_FRACTION = 0.25;

/**
 * Fraction of the final shot spent assembling. The rest is a held frame.
 *
 * Every animation in the sequence used to finish exactly at its shot boundary,
 * which for the last shot means finishing on the final pixel of the zone — so
 * the mark was still 23% unassembled and the camera still drifting at the point
 * where the philosophy line settles over it. The payoff frame did not exist.
 *
 * Assembly now completes with room to spare and the remainder holds. A beat of
 * stillness at the end of a sequence is not dead time; it is the only thing that
 * makes the preceding motion read as having arrived somewhere.
 */
export const MARK_SETTLE = 0.72;
