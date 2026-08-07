"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollState";
import { CartoonPlane } from "./CartoonPlane";
import { AeroplaneModel } from "./AeroplaneModel";
import { ModelBoundary } from "./lib/ModelBoundary";
import { AEROPLANE_MODEL_URL, useModelAvailable } from "./lib/characterModel";
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

export function PlaneBody({ reducedMotion }: { reducedMotion: boolean }) {
  const rootRef = useRef<THREE.Group>(null);

  /**
   * Born-out-of-fire glow.
   *
   * The materials belong to CartoonPlane, so they are collected by walking the
   * tree once on mount rather than being passed down — the alternative is
   * threading an emissive prop through eight components that have no other
   * reason to know about the burn.
   */
  const materials = useMemo(() => new Set<THREE.MeshStandardMaterial>(), []);

  const model = useModelAvailable(AEROPLANE_MODEL_URL);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;

      const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of list) {
        // Standard, NOT Physical. Physical extends Standard, so this catches
        // CartoonPlane's materials as well as anything a glTF brings — and a
        // glTF only ever brings Standard, so testing for Physical would have
        // silently left the loaded aircraft cold.
        const standard = material as THREE.MeshStandardMaterial;
        if (!standard.isMeshStandardMaterial) continue;
        standard.emissive = new THREE.Color(BRAND.spark);
        standard.emissiveIntensity = 0;
        materials.add(standard);
      }
    });

    const collected = materials;
    return () => collected.clear();
  }, [materials]);

  useFrame(() => {
    const p = reducedMotion ? REDUCED_MOTION_PROGRESS : scrollState.cinematic;

    // Heat bleeds out as it pulls clear of the burn it was born in.
    const heat = 1 - smootherstep(range(shotProgress(p, "burn"), 0.62, 1));
    for (const material of materials) material.emissiveIntensity = heat * 2.4;
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
            <AeroplaneModel />
          </Suspense>
        </ModelBoundary>
      ) : (
        procedural
      )}
    </group>
  );
}
