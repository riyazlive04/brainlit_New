"use client";

import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollState";
import { PlaneBody } from "./PlaneBody";
import { FLIGHT_CURVE, flightT, planeAt, planeTangentAt } from "./lib/flightPath";
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
 * Fraction of the final shot the plane spends flying at the viewer.
 *
 * Its path lives in lib/flightPath.ts as PLANE_EXIT, not here, because the
 * camera rig has to frame it and therefore has to know where it is. An earlier
 * version computed the exit from the live camera position each frame, which was
 * circular — the camera cannot aim at something whose path depends on where the
 * camera ended up.
 */
const EXIT_FRACTION = 0.62;

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
       * curve, accelerates toward the eyeline it was thrown from, and passes
       * overhead. Eased rather than linear, because an aircraft that changes
       * direction instantly reads as a sprite being moved rather than a thing
       * with mass.
       */
      const run = smootherstep(Math.min(1, closing / EXIT_FRACTION));
      planeAt(run, pos);
      // Where it is AND where that path is heading, from the same function.
      planeTangentAt(run, tangent);
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
      // Columns are the axes the model's own X, Y and Z are mapped onto. The
      // model is nose-toward +Z, so its Z column is the tangent.
      basis.makeBasis(right.negate(), up, tangent);
      quat.setFromRotationMatrix(basis);
    }

    group.quaternion.copy(quat);

    /**
     * Bank into the break-away, and scale in from nothing.
     *
     * Shallower and later than it was. At 0.85 radians it rolled 49 degrees —
     * an aerobatic angle — and it started rolling the instant the shot began,
     * so the aircraft was already on its side while still a speck. A fly-past
     * banks as it passes, not while it approaches.
     */
    body.rotation.z =
      -smootherstep(range(closing / EXIT_FRACTION, 0.3, 1)) * 0.5;
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
