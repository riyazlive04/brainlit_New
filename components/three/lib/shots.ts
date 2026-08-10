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
 * ─────────────────────────────────────────────────────────────────────────────
 * WEIGHTED BY WHAT MOVES, not evenly divided.
 *
 * These were ~20% each on the argument that an unevenly divided timeline reads
 * as some shots being mysteriously harder to scroll through than others. That
 * holds when every shot has something happening in it. Two did not:
 *
 *   · `boy` — he stands still. There is nothing to scrub.
 *   · `eyes` — the camera LOOKS AT the rocket (`look.copy(rocket)` in
 *     Cinematic.tsx), so the rocket sits at a fixed point on screen while it
 *     climbs. Tracking a subject removes the very cue that says it is moving.
 *     Measured, the paper held one screen position for 1.7 seconds.
 *
 * Together they were 38% of the zone — over 1.5 screens of scrolling with
 * almost no visible change. That budget now goes to the beats that pay for it:
 *
 *              before          after      screens of scroll (zone is 500svh,
 *   boy     0.00-0.18 18%   0.00-0.10 10%      so scrub is 4 viewports and
 *   throw   0.18-0.38 20%   0.10-0.34 24%      screens = span x 4)
 *   eyes    0.38-0.58 20%   0.34-0.44 10%
 *   burn    0.58-0.78 20%   0.44-0.68 24%   boy+eyes: 1.52 -> 0.80 screens
 *   mark    0.78-1.00 22%   0.68-1.00 32%   mark:     0.88 -> 1.28 screens
 *
 * NOTHING DOWNSTREAM NEEDS EDITING TO FOLLOW THIS, which is the point of
 * `shotProgress`: every consumer normalises to 0..1 inside its own window, so a
 * beat still plays in full, just over more or less scroll. The two constants
 * derived from these numbers — RELEASE_PROGRESS and ARRIVAL_PROGRESS in
 * lib/flightPath.ts — are written as fractions of the windows and move with
 * them. DOLLY_FRACTION below is the one exception; see the note on it.
 *
 * `boy` at 10% is deliberately not lower. He cannot throw yet — the rig is
 * three bones — and when a real clip lands the WIND-UP belongs to the `throw`
 * shot, which grew to 24%. Release sits 52% into it, so the wind-up now has
 * 0.125 of the zone to play in, up from 0.104. Shortening `boy` gives the
 * future animation more room, not less.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const SHOTS: Record<ShotName, { start: number; end: number }> = {
  /** He stands, rocket in hand. */
  boy: { start: 0.0, end: 0.1 },
  /** Wind-up, release, the trail draws. */
  throw: { start: 0.1, end: 0.34 },
  /** Dolly to his eyeline. Sky. The rocket climbing. */
  eyes: { start: 0.34, end: 0.44 },
  /** It catches fire and chars to embers. */
  burn: { start: 0.44, end: 0.68 },
  /** The fly-past. */
  mark: { start: 0.68, end: 1.0 },
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
 * 0.5, RAISED FROM 0.25 TO CANCEL THE REBALANCE ABOVE. This is a fraction of a
 * window that just halved, and unlike everything else downstream it should NOT
 * follow it: the dolly is the one part of `eyes` that moves, so it is not what
 * was dead. At 0.25 of the old 20% window it spanned 0.050 of the zone; 0.5 of
 * the new 10% window spans the same 0.050, so the travel is untouched and the
 * static tail behind it is what got cut.
 *
 * Still short on purpose — see the note on the dolly in Cinematic.tsx. At
 * normal scrolling speed it passes in a few frames and reads as a cut.
 */
export const DOLLY_FRACTION = 0.5;

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
