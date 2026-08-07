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
import { SHOTS } from "./shots";

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
 * The aeroplane's departure vector, from MARK_ANCHOR.
 *
 * Aimed at the boy's own eyeline and carried past it, so the plane he launched
 * comes back straight at the viewer and over their head. That is the shot the
 * whole sequence has been building to now that the logo assembly is gone.
 *
 * Fixed rather than computed from the live camera. An earlier version chased
 * `camera.position` each frame, which was correct but circular — the camera rig
 * needs to know where the plane IS in order to frame it, and it cannot if the
 * plane's path depends on where the camera ended up.
 *
 * The sideways bias stops it flying dead centre down the lens, which reads as a
 * collision rather than a fly-past.
 */
export const PLANE_EXIT = EYE.clone()
  .sub(MARK_ANCHOR)
  .multiplyScalar(1.5)
  .add(new THREE.Vector3(1.7, -0.3, 0.6));

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
 * How hard it pulls up once past the viewer, in metres.
 *
 * WITHOUT THIS IT FLIES INTO THE GROUND. The exit aims at the eyeline and
 * carries 50% past it; since the plane starts 9.3m up and the eyeline is at
 * 1.2m, carrying past on a straight line means continuing down, reaching
 * y = -3.1 — three metres under the floor, nose first.
 */
const PULL_UP = 9;
const PULL_START = 0.45;

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
