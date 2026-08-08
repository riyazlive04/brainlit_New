"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollState";
import { CartoonPlane } from "./CartoonPlane";
import { AeroplaneModel } from "./AeroplaneModel";
import { ModelBoundary } from "./lib/ModelBoundary";
import { AEROPLANE_MODEL_URL, useModelAvailable } from "./lib/characterModel";
import { EXIT_FRACTION } from "./lib/flightPath";
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
 * Where the fly-past fades out, as a fraction of the run at the viewer.
 *
 * Plane.tsx drops `group.visible` the instant the run completes, which is
 * correct — past that point the aircraft is behind the camera and drawing it is
 * waste. What it is not is INVISIBLE: at the speed it is travelling it is still
 * several degrees wide when the flag flips, so it does not leave, it blinks
 * out. This takes it to zero before the cut, so the cut lands on something
 * already gone.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IT HAS TO STAY SOLID UNTIL IT IS ENORMOUS. This window is the difference
 * between an aircraft flying towards you and one that is about to hit you.
 *
 * THIS WINDOW IS DOWNSTREAM OF THE AIM, and the two have been wrong together.
 * The path arrives at the lens at pass 0.635 — that is `FLYBY_AIM_AT` in
 * flightPath.ts, derived from FLYBY_CARRY rather than typed in. A fade that
 * finishes before then dissolves the aircraft over exactly the stretch that
 * carries the effect. At 0.45–0.66 it was down to 0.14 while the plane was at
 * its largest; it read as approaching politely and giving up.
 *
 * So the window now OPENS at the arrival and closes just after it. Measured on
 * captured frames at 1900x920, span as a percentage of frame width:
 *
 *      p 0.850   19%
 *      p 0.858   33%
 *      p 0.862   63%   ← still fully opaque
 *      p 0.866   clipped by the frame edge, whipping past to the right
 *      p 0.870   gone
 *
 * If you move `from` earlier you will shrink that peak, which is the entire
 * shot. If you move `to` later the aircraft is still on screen when the path
 * drops through the floor at pass 0.70 — see PULL_UP in flightPath.ts, which is
 * zero and relies on this window closing first.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const FADE = { from: 0.64, to: 0.69 } as const;

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
    const run = shotProgress(p, "mark") / EXIT_FRACTION;
    const fade = 1 - smootherstep(range(run, FADE.from, FADE.to));
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
