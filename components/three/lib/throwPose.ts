/**
 * The shape of the throw, shared by the procedural boy and the loaded model.
 *
 * In its own module so that swapping one character for the other cannot
 * silently change the motion — the same reason BOY_FACING lives in flightPath
 * rather than in either component. If the GLB brings its own "throw" clip that
 * takes precedence; this is what drives the arm when it does not.
 */

/**
 * Arm rotation through a throw, in radians about the shoulder's X axis.
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

/**
 * Outward drift of the arm through the throw, about Z.
 *
 * A throw is not planar; letting the arm swing wide as it comes over is the
 * difference between a throw and a salute.
 */
export function armSwing(t: number): number {
  return 0.17 + Math.sin(t * Math.PI) * 0.34;
}

/**
 * Whole-body lean through the throw, for a model with NO RIG.
 *
 * An unrigged mesh has no arm to swing, and a character who stands perfectly
 * still while a rocket launches itself out of his hand does not read as a throw
 * at all — it reads as a bug. Leaning the whole body is the crudest possible
 * substitute and it is still enormously better than a statue: the eye reads the
 * weight shift as the action even when nothing articulates.
 *
 * Derived from `armAngle` rather than keyframed separately, so the wind-up, the
 * whip and the follow-through happen on exactly the same beats as they do for a
 * character that can actually move its arm. Positive tips him forward.
 *
 * The multiplier is a compromise with a narrow window. Too little and the throw
 * is invisible; too much and a rigid mesh pivoting from the ankles stops looking
 * like a boy throwing and starts looking like a statue being pushed over. At
 * 0.105 the wind-up reaches about 12° back and the follow-through about 12°
 * forward, which is as far as a single unbending body can go before it reads as
 * falling.
 *
 * This is a stopgap. A rigged model makes it dead code — see `BoyModel`.
 */
export function bodyLean(t: number): number {
  return -armAngle(t) * 0.105;
}
