"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollState";
import { FLIGHT_CURVE, flightT } from "./lib/flightPath";
import { REDUCED_MOTION_PROGRESS, shotProgress } from "./lib/shots";
import { range } from "./lib/ease";
import { PARTICLE_BUDGET, type DeviceTier } from "./lib/deviceTier";
import { emberVertexShader, emberFragmentShader } from "./shaders/embers";
import { BRAND, PARTICLE } from "@/lib/brand";

/**
 * The burst of sparks the paper throws off as it burns.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * REPLACES Mark.tsx. THE LOGO NO LONGER ASSEMBLES AT THE END.
 *
 * The sequence used to close on the embers converging into the BrainLIT mark.
 * That is gone at the client's request: the aeroplane emerging from the fire is
 * the climax now, and a logo forming behind it competed with the one image the
 * whole film exists to deliver.
 *
 * The consequence is a large simplification. This no longer rasterises the
 * artwork, samples it, or carries a per-particle destination — it does not need
 * `sampleLogoCloud` at all. Sparks are generated in place: a direction, a speed,
 * a seed. All the work happens on the GPU and the buffers are never touched
 * after upload.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Approximate world-space diameter of one spark. */
const SPARK_WORLD_SIZE = 0.009;

/** Share of the device budget spent here. The rest is the flight trail. */
const EMBER_SHARE = 0.4;

type Props = {
  tier: DeviceTier;
  reducedMotion: boolean;
};

export function Embers({ tier, reducedMotion }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { camera, size } = useThree();

  const geometry = useMemo(() => {
    const count = Math.round(PARTICLE_BUDGET[tier] * EMBER_SHARE);

    const position = new Float32Array(count * 3);
    const dir = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    const seed = new Float32Array(count);

    // Deterministic, so the burst is identical on every load and cannot differ
    // between two visits to the same scroll position.
    let s = 0x9e3779b9;
    const rand = () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    for (let i = 0; i < count; i++) {
      // Uniform on the sphere. Anything else and the burst has a visible axis.
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(rand() * 2 - 1);
      const sp = Math.sin(phi);

      dir[i * 3] = sp * Math.cos(theta);
      dir[i * 3 + 1] = Math.cos(phi);
      dir[i * 3 + 2] = sp * Math.sin(theta);

      // Cubed, so most sparks stay near the source and a few fly far. A
      // uniform spread reads as an expanding shell rather than an explosion.
      //
      // Reduced twice now — 2.6, then 1.75, now 1.15 — and each time for the
      // same reason, because the lens keeps getting longer. Shot 3 now brings
      // 70% of the zoom forward (see APPROACH_ZOOM), so by the time the paper
      // catches, the frame is far tighter than it was when 1.75 was chosen.
      // The far outliers landed a screen-width from the source and read as
      // scattered dots rather than as anything thrown by a fire.
      speed[i] = 0.2 + rand() ** 3 * 1.15;
      seed[i] = rand();
    }

    const g = new THREE.BufferGeometry();
    // Every spark starts at the origin; the shader moves it. `position` exists
    // only because three requires the attribute to compute a draw range.
    g.setAttribute("position", new THREE.BufferAttribute(position, 3));
    g.setAttribute("aDir", new THREE.BufferAttribute(dir, 3));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));

    // Sparks travel well outside the origin. Left to compute its own bounds
    // from an all-zero position buffer, three would cull the entire burst.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 6);
    return g;
  }, [tier]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpray: { value: 0 },
      uOpacity: { value: 0 },
      uSize: { value: 10 },
      uPixelRatio: { value: 1 },
      // A real temperature ramp. `PARTICLE.spark` and `PARTICLE.core` were used
      // for these two and are the same orange to the eye, which flattened the
      // whole burst to one colour — see the note in the fragment shader.
      uHot: { value: new THREE.Color(BRAND.spark) },
      uCool: { value: new THREE.Color("#a8380b") },
      // Hot YELLOW, not near-white. Under normal blending a hundred pale
      // semi-transparent motes average toward their own colour, so a white core
      // does not read as hotter — it reads as milk. Saturation is what carries
      // heat when the blend mode cannot.
      uCore: { value: new THREE.Color("#ffd766") },
    }),
    [],
  );

  useEffect(() => {
    const u = materialRef.current?.uniforms;
    if (u) u.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    return () => geometry.dispose();
  }, [geometry]);

  /* eslint-disable react-hooks/immutability -- GPU uniforms, written per frame.
   * Same exemption as BrainParticles.tsx: routing these through React state
   * would cost a full re-render per frame to animate values React never reads.
   */
  useFrame((state) => {
    const u = materialRef.current?.uniforms;
    const group = groupRef.current;
    if (!u || !group) return;

    const p = reducedMotion ? REDUCED_MOTION_PROGRESS : scrollState.cinematic;
    u.uTime.value = state.clock.elapsedTime;

    // Born where the paper is. At the end of the burn `flightT` is 1, so the
    // burst stays put once the rocket has arrived.
    FLIGHT_CURVE.getPoint(flightT(p), group.position);

    const burning = shotProgress(p, "burn");

    // Sparks appear as the paper chars — the same window in which the aeroplane
    // scales up out of the fire, so the two share one event rather than queuing.
    u.uOpacity.value = range(burning, 0.34, 0.55) * (1 - range(burning, 0.9, 1));
    u.uSpray.value = range(burning, 0.34, 1);

    // Point size tracks the animated field of view — the burn zooms to a 12°
    // long lens, so a size computed once would be wrong for the whole shot.
    const perspective = camera as THREE.PerspectiveCamera;
    const fovRadians = ((perspective.fov ?? 45) * Math.PI) / 180;
    u.uSize.value =
      SPARK_WORLD_SIZE * (size.height / (2 * Math.tan(fovRadians / 2)));
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group ref={groupRef}>
      <points geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={emberVertexShader}
          fragmentShader={emberFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>
    </group>
  );
}
