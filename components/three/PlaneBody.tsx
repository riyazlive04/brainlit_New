"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollState";
import { CartoonPlane } from "./CartoonPlane";
import { AeroplaneModel } from "./AeroplaneModel";
import { ModelBoundary } from "./lib/ModelBoundary";
import { AEROPLANE_MODEL_URL, useModelAvailable } from "./lib/characterModel";
import {
  EXIT_FRACTION,
  cutoffDistance,
  planeDistanceAt,
} from "./lib/flightPath";
import { REDUCED_MOTION_PROGRESS, shotProgress } from "./lib/shots";
import { range, smootherstep } from "./lib/ease";
import { BRAND } from "@/lib/brand";

/**
 * The aeroplane's appearance, and the heat it carries out of the burn.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TWO AIRCRAFT, ONE PART — as with Boy.tsx and Rocket.tsx.
 *
 * `public/aeroplane.glb` is flown when it is there. CartoonPlane.tsx, built
 * from Three.js primitives at runtime, is what flies while it downloads and if
 * it never arrives — no fetch to fail, nothing to drift out of step with the
 * code positioning it.
 *
 * The heat below is collected by WALKING THE TREE rather than by passing an
 * emissive prop down, which is what lets the same three lines light either
 * aircraft: the procedural one's MeshPhysical materials and the loaded one's
 * MeshStandard materials are found by the same traversal.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This component owns only the LOOK. Where the plane is, how big it is and
 * which way it points stay in Plane.tsx, with the rest of the flight logic.
 */

/** Scales the ~3-unit-span model to the size the shot was framed for. */
const MODEL_SCALE = 0.3;

/**
 * How hot it comes out of the fire, and how long it stays that way.
 *
 * PEAK was 2.4, which is not a glow — it is a blowout. The aeroplane arrives as
 * a flat yellow silhouette and holds it for the better part of a second, so the
 * one shot the whole sequence has been building to spends most of its length
 * showing a shape rather than an aircraft.
 *
 * It is worse on the loaded model than it ever was on the procedural one. The
 * GLB has a SINGLE material across the entire aircraft, so an emissive term
 * lifts the canopy, the wings, the cowling and the propeller by exactly the
 * same amount. There is no differential left for the eye to read form from.
 * CartoonPlane has seven materials and degrades far more gracefully, which is
 * why this was not obvious when the number was chosen.
 *
 * 0.8 is hot metal. The window closes earlier and faster for the same reason:
 * the heat should be gone by the time the aircraft is worth looking at.
 */
const HEAT_PEAK = 0.8;
const HEAT_WINDOW = { from: 0.42, to: 0.86 } as const;

/**
 * Where the fly-past fades out — measured in METRES FROM THE LENS, not scroll.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IT HAS TO STAY SOLID UNTIL IT IS ENORMOUS, then leave before it stops being
 * an aeroplane. Those are the two ends of this window, and both of them are
 * distances, not scroll positions.
 *
 * This used to be a `pass` window (0.80–0.90). A fixed pass is a fixed
 * distance, and a fixed distance is a DIFFERENT SIZE on every viewport,
 * because the camera's field of view is vertical and the horizontal one falls
 * out of the aspect ratio. On a 396x806 phone the aircraft was still opaque at
 * a distance that filled the frame with a landing-gear strut; on desktop the
 * same pass value was a well-framed aeroplane. One number could not serve
 * both, and no third number would have served tablets.
 *
 * So the fade is driven by `planeDistanceAt` against `cutoffDistance`, which
 * solves the viewport's own geometry for the distance at which the wingspan
 * covers PASS_SPAN_TARGET of the shorter screen axis. See lib/flightPath.ts.
 *
 * It is fully opaque beyond FADE_START x that distance and gone at it, so the
 * aircraft always reaches the same SIZE before it goes, whatever the shape of
 * the screen. Resize the window mid-pass and it re-solves on the next frame.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const FADE_START = 2.2;

export function PlaneBody({ reducedMotion }: { reducedMotion: boolean }) {
  const rootRef = useRef<THREE.Group>(null);

  /**
   * Born-out-of-fire glow, and the fade on the way out.
   *
   * The materials belong to whichever aircraft is flying, so they are collected
   * by walking the tree rather than being passed down — the alternative is
   * threading an emissive prop through eight components that have no other
   * reason to know about the burn.
   *
   * A MAP, not a set, and the value is each material's ORIGINAL opacity. The
   * fade is applied as a multiplier against that rather than written straight
   * in, because not everything on the aircraft starts opaque: the propeller's
   * blur disc lives at 0.22, and assigning the fade directly would snap it to
   * a solid white plate on the nose for the whole flight.
   */
  const baseOpacity = useMemo(() => new Map<THREE.Material, number>(), []);

  /** The subset that is lit, and therefore the subset the heat applies to. */
  const lit = useMemo(() => new Set<THREE.MeshStandardMaterial>(), []);

  const model = useModelAvailable(AEROPLANE_MODEL_URL);

  /**
   * Bumped when the loaded aircraft finishes resolving, to re-run the
   * collection below.
   *
   * Without this the whole effect is a race that the GLB usually loses. The
   * traversal runs when THIS component mounts; `AeroplaneModel` is behind a
   * Suspense boundary INSIDE it, so on a cold cache the tree being walked
   * contains the procedural fallback and nothing else. The real aircraft then
   * arrives already collected-past, flies the entire sequence stone cold, and
   * takes the propeller with it. On a warm cache it resolves synchronously and
   * the bug vanishes — which is exactly why it survived this long.
   */
  const [resolved, setResolved] = useState(0);
  const onModelReady = useCallback(() => setResolved((n) => n + 1), []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    lit.clear();
    baseOpacity.clear();

    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;

      const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of list) {
        if (!material) continue;

        /**
         * Set once, here, rather than toggled when the fade begins. Changing
         * `transparent` on a live material forces the renderer to recompile its
         * shader program, and doing that in the middle of the fastest shot in
         * the sequence produces exactly the hitch you would expect.
         */
        material.transparent = true;
        baseOpacity.set(material, material.opacity);

        // Standard, NOT Physical. Physical extends Standard, so this catches
        // CartoonPlane's materials as well as anything a glTF brings — and a
        // glTF only ever brings Standard, so testing for Physical would have
        // silently left the loaded aircraft cold.
        const standard = material as THREE.MeshStandardMaterial;
        if (!standard.isMeshStandardMaterial) continue;
        standard.emissive = new THREE.Color(BRAND.spark);
        standard.emissiveIntensity = 0;
        lit.add(standard);
      }
    });

    const collectedLit = lit;
    const collectedOpacity = baseOpacity;
    return () => {
      collectedLit.clear();
      collectedOpacity.clear();
    };
  }, [lit, baseOpacity, model, resolved]);

  useFrame(() => {
    const p = reducedMotion ? REDUCED_MOTION_PROGRESS : scrollState.cinematic;

    // Heat bleeds out as it pulls clear of the burn it was born in.
    const heat =
      1 -
      smootherstep(
        range(shotProgress(p, "burn"), HEAT_WINDOW.from, HEAT_WINDOW.to),
      );
    for (const material of lit) material.emissiveIntensity = heat * HEAT_PEAK;

    // ...and it fades as it goes past, rather than being switched off.
    // `range` is inverted on purpose: distance SHRINKS as it approaches, so
    // opacity is 1 while it is far and 0 once it is inside the cutoff.
    const pass = shotProgress(p, "mark") / EXIT_FRACTION;
    const cut = cutoffDistance();
    const fade = smootherstep(
      range(planeDistanceAt(pass), cut, cut * FADE_START),
    );
    for (const [material, base] of baseOpacity) material.opacity = base * fade;
  });

  const procedural = (
    <CartoonPlane
      scale={MODEL_SCALE}
      // Position, bank and heading all come from Plane.tsx, which computes
      // them from scroll. A float here would fight that and, worse, would be
      // time-based inside a sequence that is strictly positional.
      float={false}
      spinPropeller={!reducedMotion}
    />
  );

  return (
    <group ref={rootRef}>
      {model === "present" ? (
        <ModelBoundary label="Aeroplane" fallback={procedural}>
          <Suspense fallback={procedural}>
            <AeroplaneModel
              reducedMotion={reducedMotion}
              onReady={onModelReady}
            />
          </Suspense>
        </ModelBoundary>
      ) : (
        procedural
      )}
    </group>
  );
}
