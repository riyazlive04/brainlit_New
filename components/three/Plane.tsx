"use client";

import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollState";
import { PlaneBody } from "./PlaneBody";
import {
  EXIT_FRACTION,
  FLIGHT_CURVE,
  flightT,
  planeAt,
  planeTangentAt,
} from "./lib/flightPath";
import { REDUCED_MOTION_PROGRESS, shotProgress } from "./lib/shots";
import { range, smootherstep } from "./lib/ease";

/**
 * The aeroplane: what the paper rocket becomes when it burns.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE TRANSFORMATION IS THE ARGUMENT
 *
 * A child folds a piece of paper and throws it. It catches fire, and what comes
 * out the other side is a real aircraft — the toy version of a thing becoming
 * the actual thing. That is the same claim the page makes in words two screens
 * later: we are not teaching children to operate toys, we are building what
 * outlasts them.
 *
 * It is also several times the size of the rocket it replaces, on purpose. A
 * transformation into something the same size reads as a costume change.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This file owns WHERE the plane is; PlaneBody.tsx owns what it looks like.
 * Everything below is a pure function of scroll position, per lib/shots.ts —
 * the sole exception in the whole aircraft is the spinning propeller, and the
 * reasoning for that exemption lives with it.
 */

/**
 * EXIT_FRACTION lives in lib/flightPath.ts, alongside the exit path itself —
 * the camera rig has to frame this run and therefore has to know where it is,
 * and PlaneBody has to fade the aircraft out over the end of it.
 */

/** The model's own axis. It is built and exported nose-toward +Z. */
const LOCAL_FORWARD = new THREE.Vector3(0, 0, 1);

/** Which way is up, for keeping the wings level. See the basis in useFrame. */
const WORLD_UP = new THREE.Vector3(0, 1, 0);

type Props = {
  reducedMotion: boolean;
};

export function Plane({ reducedMotion }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);

  const scratch = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      tangent: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
      // For the roll correction below.
      right: new THREE.Vector3(),
      up: new THREE.Vector3(),
      basis: new THREE.Matrix4(),
    }),
    [],
  );

  useFrame(() => {
    const group = groupRef.current;
    const body = bodyRef.current;
    if (!group || !body) return;

    const p = reducedMotion ? REDUCED_MOTION_PROGRESS : scrollState.cinematic;
    const { pos, tangent, quat, right, up, basis } = scratch;

    const burning = shotProgress(p, "burn");
    const closing = shotProgress(p, "mark");

    /**
     * Birth. The plane scales up out of the fire as the paper is consumed,
     * overlapping the rocket's own disappearance rather than following it — the
     * two exchange places inside the fireball, which is what makes it read as
     * one thing turning into another rather than a swap.
     */
    const born = smootherstep(range(burning, 0.5, 0.92));

    group.visible = born > 0.001 && closing <= EXIT_FRACTION;
    if (!group.visible) return;

    if (closing <= 0) {
      // Still on the flight curve, finishing the climb the rocket started.
      const t = flightT(p);
      FLIGHT_CURVE.getPoint(t, pos);
      FLIGHT_CURVE.getTangent(t, tangent);
    } else {
      /**
       * The run at the viewer.
       *
       * "The aeroplane launches into the website" — so it does: it leaves the
       * curve, accelerates toward the eyeline it was thrown from, and comes
       * straight down the lens.
       *
       * BOTH TAKE `pass`, THE RAW SCROLL POSITION, and do their own easing.
       * They used to take a pre-eased `run`, which was fine while the exit was
       * a fixed vector. It is not one any more — the path now homes on the lens
       * as the lens actually moves — so the position needs the scroll value
       * itself. See `exitEase` and `lensAt` in lib/flightPath.ts; between them
       * they own why the approach is paced the way it is and why it stays in
       * the middle of frame while it closes.
       */
      const exitPass = Math.min(1, closing / EXIT_FRACTION);
      planeAt(exitPass, pos);
      // Where it is AND where that path is heading, from the same function.
      planeTangentAt(exitPass, tangent);
    }

    group.position.copy(pos);

    /**
     * Aim the nose down the path AND KEEP THE WINGS LEVEL.
     *
     * `setFromUnitVectors` alone is not enough. It returns the SHORTEST
     * rotation from one vector to another, which pins the nose to the tangent
     * and leaves the roll to fall wherever that happens to put it — and over a
     * curve that climbs and turns, where it happens to put it is upside down.
     * The procedural plane got away with it because it is roughly symmetrical
     * top to bottom. An aircraft with a canopy and landing gear does not: it
     * arrives out of the fire inverted, wheels to the sky.
     *
     * So the orientation is built as a BASIS instead — forward down the path,
     * right perpendicular to that and to world up, up completing the set. Roll
     * is then a decision rather than an accident, which is what lets the bank
     * below actually mean something.
     */
    tangent.normalize();
    right.copy(WORLD_UP).cross(tangent);

    if (right.lengthSq() < 1e-6) {
      // Flying dead vertical: world up and the tangent are parallel, so there
      // is no "right" to derive. Nothing in this flight does that, but a
      // degenerate basis would silently produce NaNs through the whole matrix.
      quat.setFromUnitVectors(LOCAL_FORWARD, tangent);
    } else {
      right.normalize();
      up.copy(tangent).cross(right).normalize();

      /**
       * Columns are the axes the model's own X, Y and Z are mapped onto. The
       * model is nose-toward +Z, so its Z column is the tangent.
       *
       * NO NEGATION ON `right`, and that is the whole point of this comment.
       *
       * `right` is `WORLD_UP x tangent` and `up` is `tangent x right`, which
       * makes `right x up = tangent` — the set is ALREADY right-handed.
       * Negating one column therefore does not fix a handedness problem, it
       * creates one: the matrix becomes a REFLECTION, determinant −1.
       *
       * A quaternion cannot represent a reflection. `setFromRotationMatrix`
       * does not fail on one, it silently returns the nearest thing it can, and
       * the nearest thing is wrong by a lot — measured on the fly-past tangent,
       * it put the nose 51.4 degrees off the direction of travel. That is the
       * residue behind every "the plane is facing the wrong way" symptom that
       * survived fixing the path, the heading and the model's own orientation.
       */
      basis.makeBasis(right, up, tangent);
      quat.setFromRotationMatrix(basis);
    }

    group.quaternion.copy(quat);

    /**
     * ATTITUDE, and why an aircraft needs one beyond where it is pointing.
     *
     * The basis above aims the nose down the path and levels the wings, which
     * is geometrically correct and, on its own, lifeless: the plane holds one
     * attitude for the whole pass and slides across the frame like a decal.
     * Nothing about a real aeroplane is that still. It rolls into the break, it
     * pitches as it loads the wing, and its silhouette changes continuously.
     *
     * All three below are functions of `pass` — position through the run — and
     * NOT of time, per the note at the top of this file. Scrub backwards and
     * the aircraft un-banks.
     */
    const pass = closing / EXIT_FRACTION;

    /**
     * Bank — now a lean, not a break-away.
     *
     * It has been 0.85 radians (49 degrees, aerobatic, and held from the first
     * frame) and then 0.62. Both were tuned when this was a fly-PAST, where a
     * banked silhouette is the whole read. It is not that shot any more: the
     * aircraft now comes down the lens at the viewer, and at 35 degrees of bank
     * what they see is its upper surface, three-quarter on. An aeroplane about
     * to hit you is square to you.
     *
     * 0.2 — about 11 degrees — is enough that it is not a decal pinned to the
     * frame, and little enough that the propeller stays dead centre.
     */
    body.rotation.z = -smootherstep(range(pass, 0.12, 1)) * 0.2;

    /**
     * NO NOSE-UP. It used to pitch 14 degrees over the back half of the run.
     *
     * That existed to acknowledge PULL_UP, back when the path climbed while the
     * viewer could still see it. PULL_UP now fires at 0.75 — after the pass, and
     * behind the camera — so there is nothing left to acknowledge, and all the
     * pitch did was make an aircraft coming straight at you read as climbing
     * away over your head. Which is the one thing this shot must not do.
     *
     * Left as an explicit zero rather than deleted: the property is written
     * every frame, so a stale value from a previous build would otherwise
     * persist through a hot reload.
     */
    body.rotation.x = 0;

    /**
     * A whisper of yaw, so the two wings are not pixel-identical.
     *
     * Halved along with the bank, and for the same reason. Yaw is the cheapest
     * silhouette change there is, but every degree of it turns the nose off the
     * lens — and the nose being ON the lens is the entire point of this shot
     * now. At 0.04 it is barely two degrees: enough that the near wing reads
     * nearer, not enough to aim him anywhere but at you.
     */
    body.rotation.y = Math.sin(pass * Math.PI) * 0.04;

    group.scale.setScalar(born);
  });

  return (
    <group ref={groupRef}>
      <group ref={bodyRef}>
        {/* Suspense falls back to NOTHING rather than to stand-in geometry.
            This beat lasts under a second; a placeholder flashing up for a
            frame before the real aircraft resolves is worse than the aircraft
            simply arriving a moment late. */}
        <Suspense fallback={null}>
          <PlaneBody reducedMotion={reducedMotion} />
        </Suspense>
      </group>
    </group>
  );
}
