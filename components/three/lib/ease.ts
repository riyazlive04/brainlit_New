/**
 * Easing and interpolation helpers shared by the cinematic.
 *
 * These were previously private to BrainParticles. The camera rig needs the same
 * maths, and two copies of `damp` that drift apart is exactly the kind of bug
 * that shows up as "the camera feels different from the particles".
 */

/** Normalised progress within [start, end], clamped outside it. */
export function range(p: number, start: number, end: number): number {
  return Math.min(1, Math.max(0, (p - start) / (end - start)));
}

/** Frame-rate independent exponential smoothing. */
export function damp(
  current: number,
  target: number,
  lambda: number,
  dt: number,
): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/** Hermite smoothstep. Zero first derivative at both ends. */
export function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Perlin's smootherstep. Zero FIRST AND SECOND derivative at both ends.
 *
 * This is the one the camera uses, and the extra term earns its place. A camera
 * move eased with plain smoothstep still has a discontinuity in acceleration
 * where two shots meet — imperceptible on an object, very perceptible when it is
 * the whole frame, where it reads as a small kick at every shot boundary.
 * Smootherstep removes it.
 */
export function smootherstep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
