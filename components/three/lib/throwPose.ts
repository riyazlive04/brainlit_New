/**
 * The shape of the throw, shared by the procedural boy and the loaded model.
 *
 * In its own module so that swapping one character for the other cannot
 * silently change the motion — the same reason BOY_FACING lives in flightPath
 * rather than in either component. If the GLB brings its own "throw" clip that
 * takes precedence; everything here is what drives the throw when it does not.
 *
 * The functions are pure and take only `t`, the 0..1 progress through the
 * throw. That is not incidental: the whole cinematic is a function of scroll
 * position, so anything here has to be samplable at an arbitrary `t`, forwards
 * or backwards, with no internal state to get out of sync.
 */

/* ══════════════════════════════════════════════════════════════ the arm ══ */

/**
 * Arm rotation through a throw, in radians about the shoulder's swing axis.
 * Zero is hanging down; positive swings the arm backwards.
 *
 * The numbers matter less than the SHAPE: a slow wind-up, a fast whip, a long
 * follow-through. Amateur throws are symmetrical, which is what makes them read
 * as a wave — real ones spend two thirds of their duration loading and a few
 * frames releasing.
 *
 * Capped at 1.9 rather than an anatomical 2.4: on a stylised figure the forearm
 * cannot pass behind a head this size, and anything further buries the hand in
 * the skull.
 *
 * Passes through zero at t = 0.4485, which is where the rocket leaves the hand:
 * solve the linear segment below, 1.9 - 3.9 * (t - 0.38) / 0.14 = 0. NOT 0.52 —
 * that is where the whip BOTTOMS OUT at -2.0, a different moment, and this
 * comment claimed it for years. lib/flightPath.ts derives RELEASE_PROGRESS from
 * the crossing, so if the shape below changes, the crossing moves with it.
 */
export function armAngle(t: number): number {
  if (t < 0.38) {
    const u = t / 0.38;
    return -0.2 + 2.1 * (1 - (1 - u) * (1 - u));
  }
  if (t < 0.52) {
    // Linear on purpose — easing the whip is what kills the snap.
    return 1.9 + (-2.0 - 1.9) * ((t - 0.38) / 0.14);
  }
  const u = (t - 0.52) / 0.48;
  return -2.0 + 1.8 * (u * u * (3 - 2 * u));
}

/** Peak of `armAngle`, used to normalise anything derived from it. */
export const ARM_PEAK = 1.9;

/**
 * Outward drift of the arm through the throw, about its secondary axis.
 *
 * A throw is not planar; letting the arm swing wide as it comes over is the
 * difference between a throw and a salute. On a single-joint rig this is also
 * the only thing stopping the swing reading as a door on a hinge — one axis of
 * rotation looks mechanical no matter how well the timing is tuned.
 */
export function armSwing(t: number): number {
  return 0.17 + Math.sin(t * Math.PI) * 0.34;
}

/* ═══════════════════════════════════════════════════════════ soft limit ══ */

/** Fraction of the limit below which the swing is passed through untouched. */
const SOFT_KNEE = 0.7;

/**
 * Clamp that never actually arrives.
 *
 * A hard `Math.min` is the obvious way to keep a swing inside what one joint
 * can hold, and it is wrong here for a reason that is invisible in a still and
 * obvious in motion: `armAngle` sits near its peak for most of the wind-up, so
 * a hard clamp pins the arm flat against the ceiling and the loading phase —
 * two thirds of the throw — becomes a freeze. The eye reads a frozen arm as no
 * arm at all, which is most of why the throw currently does not exist.
 *
 * This instead passes the swing through unchanged up to a knee, then bends the
 * remainder onto an exponential approach to the limit. The arm keeps moving for
 * the whole curve, decelerating as it runs out of room, which is also what a
 * real shoulder does at the end of its range. It never reaches `limit`, so the
 * skinning never sees an angle that tears the mesh.
 *
 * `limit` is a MAGNITUDE — always positive. The sign of `value` is preserved.
 */
export function softLimit(value: number, limit: number): number {
  if (limit <= 0) return 0;

  const size = Math.abs(value);
  const knee = limit * SOFT_KNEE;
  if (size <= knee) return value;

  const room = limit - knee;
  const over = size - knee;
  const eased = room * (1 - Math.exp(-over / room));

  return Math.sign(value) * (knee + eased);
}

/* ════════════════════════════════════════════════════════════ the body ══ */

/**
 * How much of the throw the BODY carries, in two flavours.
 *
 * A throw is a weight transfer that happens to end at a hand. On a properly
 * rigged character the arm can carry it alone; on anything less the body has to
 * do the work, and the two cases want different amounts.
 *
 * WITH_ARM is deliberately about half of NO_RIG. The arm and the lean are on
 * the same curve, so at full strength they compound — the figure pitches
 * forward at the same instant the arm comes over, and a stylised boy folding in
 * half reads as a stumble rather than a throw. Half is the amount that supports
 * the arm without competing with it.
 */
export const LEAN_NO_RIG = 0.105;
export const LEAN_WITH_ARM = 0.058;

/**
 * Whole-body lean through the throw. Positive tips him forward.
 *
 * Derived from `armAngle` rather than keyframed separately, so the wind-up, the
 * whip and the follow-through happen on exactly the same beats as they do for
 * the arm. At NO_RIG strength the wind-up reaches about 12 degrees back and the
 * follow-through about 12 degrees forward, which is as far as a single unbending
 * body can go before it reads as falling.
 */
export function bodyLean(t: number, strength: number = LEAN_NO_RIG): number {
  return -armAngle(t) * strength;
}

/**
 * Shoulder rotation, about the vertical.
 *
 * The single most useful thing you can add to a one-joint throw. A real thrower
 * winds the shoulders away from the target and unwinds them through the
 * release — it is where most of the power comes from and, more to the point
 * here, it changes the SILHOUETTE. A swing about one axis leaves the outline
 * identical from frame to frame; a turn makes the figure read as three
 * dimensional and the arm as attached to something.
 *
 * SIGN: positive turns him one way and negative the other, and which of those
 * is "winding up" depends on MODEL_YAW_OFFSET and BOY_FACING. If he winds up
 * towards the camera instead of away from it, negate the strength constants —
 * nothing else needs to change.
 */
export const TURN_NO_RIG = 0.11;
export const TURN_WITH_ARM = 0.075;

export function bodyTurn(t: number, strength: number = TURN_NO_RIG): number {
  return armAngle(t) * strength;
}

/**
 * Vertical weight transfer, as a fraction of the character's height.
 *
 * He sinks while loading and pushes up through the release. Small — under two
 * centimetres either way on a 1.5m figure — because this is the one channel
 * where too much is instantly comic. Its job is not to be seen; its job is that
 * the release has a beat the eye can land on, in a sequence where every other
 * channel is a smooth curve.
 */
export const DIP_DEPTH = 0.022;

export function bodyDip(t: number): number {
  // How loaded the arm is, 0..1. Zero once the whip has passed through.
  const load = Math.max(0, armAngle(t)) / ARM_PEAK;

  // A single push, centred on the release and gone by the follow-through.
  const pop =
    t > 0.38 && t < 0.62 ? Math.sin(((t - 0.38) / 0.24) * Math.PI) : 0;

  return pop * 0.45 - load * 0.55;
}
