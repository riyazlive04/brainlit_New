/**
 * World layout for the cinematic, and the path the rocket travels.
 *
 * All units are metres and the world is Y-up, which is what glTF exports use —
 * so the character model that arrives later drops in without a conversion step.
 * The boy is 1.5m, roughly a twelve-year-old, which is the middle of the 10–14
 * range in lib/site.ts.
 *
 * The boy stands to the RIGHT of world origin, not on it. The hero headline
 * occupies the left half of the viewport on desktop, and the camera rig frames
 * the empty left-of-boy space so the two never fight. See `framing()` in
 * Cinematic.tsx for how that collapses to centred on a phone.
 */

import * as THREE from "three";
import { MARK_SETTLE, SHOTS } from "./shots";
import { smootherstep } from "./ease";

/** Where he stands. Origin is between the feet, as glTF convention expects. */
export const BOY_FEET = new THREE.Vector3(1.7, 0, 0);

/** Overall height, metres. Both the placeholder and the real model are fitted to this. */
export const BOY_HEIGHT = 1.5;

/**
 * Which way he faces, in radians about Y.
 *
 * Three-quarter view, angled down the flight path but still showing a face. A
 * thrower square to the camera has nowhere to throw to — the pose has to read as
 * aiming at the space the rocket is about to occupy, which is up and screen-left.
 *
 * Shared by the placeholder and the loaded model so that swapping one for the
 * other cannot silently change the composition.
 *
 * Reduced from -1.0 once the real model landed. On the abstract mannequin the
 * angle cost nothing, because there was no face to hide. On a character whose
 * entire appeal is his face, a full radian turned him three-quarters away and
 * shot 1 became the back of someone's head.
 */
export const BOY_FACING = -0.55;

/**
 * The point the camera occupies during the POV shots.
 *
 * Slightly forward of the skull centre and a little below the crown — an eye
 * position, not a head position. Putting the camera at the head's origin is the
 * classic first-person mistake and it reads as floating behind your own face.
 */
export const EYE = new THREE.Vector3(
  BOY_FEET.x,
  // 0.818 of his height, and NOT a free parameter — it is where CartoonBoy
  // actually puts his eyes, which is `H.head + 0.035 * H.headScale` over a
  // 2.0-unit figure. If the character's proportions change, this changes with
  // them or the POV shot ends up inside his skull.
  //
  // It was 0.72 while he was a chibi with a head 45% of his height. The client's
  // turnaround replaced that with a slim five-head child, whose eyes sit far
  // higher up the body, and 0.72 then put the camera at his collarbone.
  BOY_FEET.y + BOY_HEIGHT * 0.818,
  BOY_FEET.z + 0.12,
);

/**
 * Where the rocket leaves his hand.
 *
 * A STARTING GUESS, not the answer. It is the curve's first control point at
 * module scope, and it is what the low tier uses — there is no character there,
 * so there is no hand to ask.
 *
 * Everywhere else it is overwritten at runtime by `setReleasePoint` with the
 * hand's actual world position. It has to be: this point is downstream of the
 * character's proportions, his placement, his facing, the model's own scale and
 * wherever the rig puts his wrist, and every one of those has changed at least
 * once. Hard-coding it means it is wrong again the next time any of them moves —
 * which is exactly what had happened by the time this was written, leaving the
 * rocket to teleport about a metre at the instant of release.
 */
export const HAND_RELEASE = new THREE.Vector3(1.32, 1.34, 0.48);

/**
 * The flight.
 *
 * Deliberately not ballistic. A real thrown object arcs over and comes down, and
 * a paper rocket comes down almost immediately — which is a fine piece of
 * physics and a terrible piece of storytelling. This climbs and keeps climbing,
 * because the shot it has to sell is a child watching something of his own leave
 * the ground for good.
 *
 * It also travels LEFT and AWAY as it rises. Left because the boy is right of
 * centre and the frame has room there; away because a receding object reads as
 * gaining height far more clearly than one that merely moves up the screen.
 *
 * Centripetal parameterisation, not the default uniform one: uniform Catmull-Rom
 * overshoots when control points are unevenly spaced, and these are — the gaps
 * widen deliberately as it accelerates away. Overshoot here would show up as the
 * rocket briefly flying backwards at the top of the arc.
 */
export const FLIGHT_CURVE = new THREE.CatmullRomCurve3(
  [
    HAND_RELEASE.clone(),
    new THREE.Vector3(0.3, 2.4, 0.25),
    new THREE.Vector3(-0.55, 4.0, -0.7),
    new THREE.Vector3(-0.85, 6.3, -2.3),
    new THREE.Vector3(-0.3, 9.3, -4.6),
  ],
  false,
  "centripetal",
);

/* ═════════════════════════════════════════════════ the release, at runtime ══ */

/**
 * Anything that has baked the curve's shape into a buffer and must rebuild.
 *
 * Only the dotted trail, today. It samples several hundred points once and
 * uploads them; if the curve moves underneath it, the trail keeps describing a
 * flight that no longer happens.
 */
const curveListeners = new Set<() => void>();

export function onFlightCurveChanged(listener: () => void): () => void {
  curveListeners.add(listener);
  return () => {
    curveListeners.delete(listener);
  };
}

/**
 * Move the start of the flight to where the rocket actually leaves the hand.
 *
 * Called by whoever is holding it — see Rocket.tsx, which already reads the
 * hand's world position on every frame before release and so knows the answer
 * without any extra work.
 *
 * Cheap to call repeatedly: it returns immediately unless the point has really
 * moved, because `updateArcLengths` rebuilds the curve's whole length table and
 * every listener rebuilds a buffer.
 */
export function setReleasePoint(point: THREE.Vector3): void {
  const start = FLIGHT_CURVE.points[0];
  if (start.distanceToSquared(point) < 1e-8) return;

  start.copy(point);
  // Without this the curve keeps handing out positions from a stale length
  // table, so `getPointAt` — which is arc-length parameterised — bunches the
  // first stretch of the flight.
  FLIGHT_CURVE.updateArcLengths();

  for (const listener of curveListeners) listener();
}

/**
 * The end of the flight — where the paper burns and the aeroplane is born.
 *
 * Still called MARK_ANCHOR for continuity with the rest of the rig, though the
 * mark no longer assembles here: that beat was removed and the aeroplane's run
 * at the camera is the ending now.
 */
export const MARK_ANCHOR = FLIGHT_CURVE.getPoint(1);

/**
 * Small drift on the closing shot, so the fly-past has parallax to read against.
 *
 * LIVES HERE, not in the camera rig, because the plane's exit is aimed at where
 * the camera ENDS UP rather than where it starts. Two files owning half of that
 * relationship each is how the aircraft ended up missing by two metres more
 * than intended the last time the drift was nudged.
 */
export const CLOSE_DRIFT = new THREE.Vector3(0.35, -0.25, 0.9);

/**
 * Fraction of the final shot the plane spends flying at the viewer.
 *
 * Lives here rather than in Plane.tsx, where it was, because PlaneBody now
 * needs it too — it fades the aircraft out over the last stretch of the run.
 * Importing it from Plane.tsx would be circular: Plane renders PlaneBody.
 */
export const EXIT_FRACTION = 0.62;

/** Where the lens actually is by the time the aeroplane reaches it. */
const CLOSE_EYE = EYE.clone().add(CLOSE_DRIFT);

/**
 * How far the aeroplane misses the lens by — and, far more importantly, IN
 * WHICH DIRECTION.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * "LEVEL IN THE WORLD" IS NOT "LEVEL ON SCREEN", AND THAT IS THE WHOLE BUG.
 *
 * The miss used to be written as a world vector with its Y set to roughly zero
 * — (0.22, −0.02, 0.10) — on the reasoning that no vertical offset means no
 * vertical drift. That reasoning holds only for a camera looking at the
 * horizon. This one is craned 54 degrees UP at MARK_ANCHOR, so its screen-up
 * axis is (0.311, 0.591, 0.744): two thirds of it lies in X and Z. A miss that
 * is perfectly level in world terms therefore still projects 0.131 onto screen
 * up, and the aircraft climbed 9.8 degrees off frame centre in the last metre.
 * Flat in the world, rising on the screen.
 *
 * So the miss is DERIVED from the camera's own frame instead of typed in as
 * world coordinates: purely along screen-right, which by construction has zero
 * component along screen-up. Measured drift is now 0.0 degrees at every point
 * of the approach. The aircraft holds the centre of frame and grows, and what
 * little sideways movement there is happens in the final metre while the fade
 * is already taking it.
 *
 * Derived rather than hard-coded so it stays true: move CLOSE_DRIFT, or the
 * anchor, or the boy, and this re-solves itself. Hard-coding the result is what
 * put the vertical component there in the first place.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const FLYBY_SIDESTEP = 0.25;

/**
 * Where in the run the aeroplane and the camera actually meet.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * AIM AT WHERE THE CAMERA IS WHEN IT ARRIVES, NOT WHERE IT ENDS UP.
 *
 * This is the bug that survived every other fix, because it is invisible in the
 * algebra: the aim was CLOSE_EYE, the camera's position at the END of its
 * drift. But the aircraft arrives around 0.62 of the run, when the camera is
 * only part way through drifting, and CLOSE_DRIFT is (0.35, −0.25, 0.9) — a
 * metre of travel. So the thing being aimed at was about 0.9m from the thing
 * actually looking, which is FOUR TIMES the intended 0.25m miss.
 *
 * Measured, aiming at end-of-drift against aiming at mid-drift:
 *
 *              pass 0.55            pass 0.62
 *   end-drift  50% span, +9.6 deg   177% span, +84.9 deg   ← climbs off frame
 *   mid-drift  50% span, +1.8 deg   163% span,  −0.0 deg   ← holds centre
 *
 * The screen-up climb and the aircraft never filling the frame were the same
 * fault seen from two sides: it was passing nearly a metre wide of the lens, so
 * it stayed small AND swung upward getting there.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const FLYBY_CARRY = 1.35;

/**
 * Pass at which the eased run reaches `target`.
 *
 * Bisection because `smootherstep` has no closed-form inverse, and forty
 * iterations of it once at module load is free.
 */
function passForRun(target: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (smootherstep(mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * DERIVED, not chosen. The run is eased, so the aircraft covers the whole exit
 * vector when `smootherstep(pass) = 1 / FLYBY_CARRY` — that, and only that, is
 * the moment it reaches the aim point. Picking the aim pass by hand and the
 * carry separately is how the two got out of step: aiming at the camera's
 * position at 0.62 while the aircraft did not actually arrive until 0.66 left
 * it passing 0.9m wide again, just less than before.
 */
const FLYBY_AIM_AT = passForRun(1 / FLYBY_CARRY);

/**
 * The camera's position at a given point through the exit run.
 *
 * Mirrors the shot-5 branch of the rig in Cinematic.tsx exactly — same
 * smootherstep, same MARK_SETTLE, same lerp from EYE to EYE+CLOSE_DRIFT. If
 * that move ever changes, this has to change with it or the aim drifts again.
 */
function cameraAt(pass: number): THREE.Vector3 {
  const settle = smootherstep(
    Math.min(1, (pass * EXIT_FRACTION) / MARK_SETTLE),
  );
  return EYE.clone().lerp(CLOSE_EYE, settle);
}

/** The lens, at the moment the aeroplane reaches it. */
const AIM_EYE = cameraAt(FLYBY_AIM_AT);

/** The camera's view axis at the moment the aeroplane arrives. */
const VIEW_AXIS = MARK_ANCHOR.clone().sub(AIM_EYE).normalize();

/**
 * Screen-right for that view. Perpendicular to both the view axis and world up,
 * which is exactly the direction that carries no screen-up component.
 */
const SCREEN_RIGHT = new THREE.Vector3()
  .crossVectors(VIEW_AXIS, new THREE.Vector3(0, 1, 0))
  .normalize();

const FLYBY_MISS = SCREEN_RIGHT.clone().multiplyScalar(FLYBY_SIDESTEP);

/**
 * How far beyond the lens the run carries. Above 1, or it stops at your face.
 * FLYBY_AIM_AT above is solved from this, so the two cannot drift apart.
 */

/**
 * The aeroplane's departure vector, from MARK_ANCHOR.
 *
 * Aimed at the CLOSING camera position plus a deliberate small miss, so the
 * plane he launched comes back straight at the viewer. That is the shot the
 * whole sequence has been building to now that the logo assembly is gone.
 *
 * THE MISS IS NOT THERE TO AVOID A COLLISION READ. It used to be, and the
 * comment used to say so — "dead centre reads as a collision rather than a
 * fly-past" — which is now exactly backwards. A collision read IS the intent:
 * the aircraft should look like it is going to hit you. The miss survives for
 * two mechanical reasons only, neither of them aesthetic:
 *
 *   1. dead centre would fly THROUGH the camera, and
 *   2. something has to decide which way it breaks at the end.
 *
 * It is therefore as small as it can be, and pointed along screen-right so that
 * the break costs no vertical drift. See FLYBY_MISS above.
 *
 * Fixed rather than computed from the live camera. An earlier version chased
 * `camera.position` each frame, which was correct but circular — the camera rig
 * needs to know where the plane IS in order to frame it, and it cannot if the
 * plane's path depends on where the camera ended up. CLOSE_EYE is the
 * ANALYTICAL end of that move, which is not circular.
 */
export const PLANE_EXIT = AIM_EYE.clone()
  .add(FLYBY_MISS)
  .sub(MARK_ANCHOR)
  .multiplyScalar(FLYBY_CARRY);

/**
 * The aeroplane's departure.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A STRAIGHT PATH, AND A TURNING AIRCRAFT. The two are separate on purpose.
 *
 * The plane is born out of the fire heading UP AND AWAY — the flight curve's
 * final tangent, (0.144, 0.785, -0.602). The exit takes it DOWN AND TOWARD the
 * viewer, (0.307, -0.809, 0.501). Those are 153 DEGREES APART, and switching
 * between them on one frame is what made the aircraft point one way while
 * travelling another.
 *
 * The obvious fix — bend the path so it leaves tangentially — was tried and is
 * wrong here, for a reason particular to this shot: the camera holds still
 * AIMED AT MARK_ANCHOR, which is where the plane starts. A path that curves
 * away from that axis walks straight out of frame, and the aircraft was simply
 * gone by the time it came back round. The straight run works precisely because
 * it travels DOWN THE VIEW AXIS: the plane stays centred and grows.
 *
 * So the path stays straight and the AIRCRAFT turns onto it — the heading eases
 * from the arrival tangent onto the exit over the first third of the run. That
 * is a wingover, which is what an aeroplane does when it comes out of a climb
 * and rolls in on a target, and it costs the shot nothing.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * How hard it pulls up once past the viewer, in metres. IT IS NOW ZERO.
 *
 * The pull existed because the plane starts 9.3m up and the lens is at about
 * 1m, so a straight run carried past the lens keeps descending and would
 * eventually go through the floor. At 2.5m / 0.58 it was also doing shot work:
 * the last thing the viewer saw was the aircraft hauling up over their head.
 *
 * THAT READ AS CLIMBING AWAY, which is the one thing this shot must not do. So
 * the obvious suspect for the climb was this constant — and MEASURING IT CLEARED
 * IT. Setting PULL_UP to 0 and capturing the frames moved the centroid at
 * p=0.850 from y=167 to y=163: no change worth the name. The climb was coming
 * from the aim being wrong (see FLYBY_AIM_AT), not from the pull.
 *
 * Zero is safe, and this is the check that says so — the floor argument above is
 * real, so it cannot just be deleted on taste:
 *
 *   · path first crosses y = 0    pass 0.70  (p ≈ 0.876)
 *   · FADE completes              pass 0.69  (p ≈ 0.870)
 *   · measured pixels at p=0.870  0
 *
 * The aircraft is fully gone one fade-width before the path drops through the
 * floor, so there is nothing left on screen for a pull to protect. If you change
 * FADE, EXIT_FRACTION or FLYBY_CARRY, re-check those three lines before assuming
 * this can stay at zero.
 *
 * PULL_START is parked at 0.95 rather than removed: with PULL_UP at 0 it has no
 * effect, and keeping it late means restoring a pull cannot accidentally act
 * during the visible approach.
 */
const PULL_UP = 0;
const PULL_START = 0.95;

/** How much of the run is spent turning onto the exit heading. */
const TURN_IN = 0.35;

/** The heading it inherits from the rocket's flight, at the moment it is born. */
const ARRIVAL_HEADING = FLIGHT_CURVE.getTangent(1).normalize();

/** Where the aeroplane is, `run` being 0..1 through its departure. */
export function planeAt(run: number, out: THREE.Vector3): THREE.Vector3 {
  out.copy(MARK_ANCHOR).addScaledVector(PLANE_EXIT, run);

  // Squared, so it is imperceptible at the pass and dominant by the time it
  // leaves frame — an aircraft rotating out of a dive, not one changing its
  // mind.
  const pull = Math.max(0, (run - PULL_START) / (1 - PULL_START));
  out.y += PULL_UP * pull * pull;

  return out;
}

/** Which way it is POINTING at `run`. */
export function planeTangentAt(run: number, out: THREE.Vector3): THREE.Vector3 {
  // The path's own direction: the derivative of `planeAt`.
  out.copy(PLANE_EXIT);
  const pull = Math.max(0, (run - PULL_START) / (1 - PULL_START));
  out.y += (2 * PULL_UP * pull) / (1 - PULL_START);
  out.normalize();

  // Eased onto from the heading it arrived with, so there is no instant where
  // the nose jumps. Normalising after the blend keeps it a unit vector through
  // the turn; a plain lerp between two unit vectors is not one in the middle.
  const turn = Math.min(1, run / TURN_IN);
  const eased = turn * turn * (3 - 2 * turn);

  return out.lerp(ARRIVAL_HEADING, 1 - eased).normalize();
}

/**
 * Scroll position at which the rocket leaves his hand.
 *
 * Partway into the `throw` shot, because the wind-up has to happen first. A
 * throw that releases on the first frame of the shot has no anticipation, and
 * anticipation is most of what makes a throw read as a throw.
 *
 * 0.52, NOT 0.45. The swing curve in lib/throwPose.ts passes through zero at
 * 0.45 — the exact moment the arm is hanging straight down and the body is
 * upright, which is the one instant in the whole shot that reads as "not
 * throwing". It bottoms out at 0.52, the forward-most point of the follow
 * through, and that is where a thrown object actually leaves the hand.
 */
export const RELEASE_PROGRESS =
  SHOTS.throw.start + (SHOTS.throw.end - SHOTS.throw.start) * 0.52;

/** Scroll position at which it reaches the end of the curve. */
export const ARRIVAL_PROGRESS = SHOTS.burn.end;

/**
 * Overall scroll progress → position along the flight curve, 0..1.
 *
 * Clamped at both ends: before release the rocket is in his hand and this
 * returns 0; after arrival the mark takes over and it returns 1.
 */
export function flightT(progress: number): number {
  const span = ARRIVAL_PROGRESS - RELEASE_PROGRESS;
  return Math.min(1, Math.max(0, (progress - RELEASE_PROGRESS) / span));
}

/**
 * Points along the curve for the dotted trail.
 *
 * Returns positions plus the curve parameter each dot sits at, so the shader can
 * reveal the trail progressively by comparing against the rocket's own `t`
 * rather than needing the CPU to rewrite the buffer every frame.
 *
 * Spacing is by curve parameter, not by arc length. Arc-length spacing would
 * give perfectly even dots; parameter spacing bunches them where the curve is
 * slow and stretches them where it is fast, which is exactly the "accelerating
 * away" cue the flight is built around.
 */
export function sampleTrail(count: number): {
  position: Float32Array;
  t: Float32Array;
} {
  const position = new Float32Array(count * 3);
  const t = new Float32Array(count);
  const point = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    const u = i / (count - 1);
    FLIGHT_CURVE.getPoint(u, point);

    position[i * 3] = point.x;
    position[i * 3 + 1] = point.y;
    position[i * 3 + 2] = point.z;
    t[i] = u;
  }

  return { position, t };
}
