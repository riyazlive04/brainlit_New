"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  sampleLogoCloud,
  type FieldPattern,
  type LogoCloud,
} from "./lib/logoSampler";
import { brainVertexShader, brainFragmentShader } from "./shaders/brain";
import { scrollState } from "@/lib/scrollState";
import { PARTICLE } from "@/lib/brand";

/** Approximate world-space diameter of one particle. */
const PARTICLE_WORLD_SIZE = 0.011;

/**
 * How far each hemisphere slides during the split, in world units.
 *
 * Deliberately small. Pulled far apart, the mark stops being a logo and starts
 * looking broken — two unrelated blobs with a line floating between them. A
 * hairline parting reads as "these are two halves" without destroying it.
 */
const SPLIT_DISTANCE = 0.11;

/** Normalised progress within [start, end], clamped outside it. */
function range(p: number, start: number, end: number) {
  return Math.min(1, Math.max(0, (p - start) / (end - start)));
}

/** Frame-rate independent exponential smoothing. */
function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

function createUniforms() {
  return {
    uTime: { value: 0 },
    uForm: { value: 0 },
    uSplit: { value: 0 },
    uIgnite: { value: 0 },
    uDisperse: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uSize: { value: 10 },
    uPixelRatio: { value: 1 },
    uColorCore: { value: new THREE.Color(PARTICLE.core) },
    uClickPos: { value: new THREE.Vector2(0, 0) },
    uClickAge: { value: 0 },
    uClickActive: { value: 0 },
  };
}

/** Ripple lifetime in seconds. Must match WAVE_LIFE in the vertex shader. */
const WAVE_LIFE = 3.2;

type Props = {
  count: number;
  reducedMotion: boolean;
  /** Layout of the background dot field. */
  pattern?: FieldPattern;
  /** World-space placement, so the mark can sit beside the copy, not under it. */
  offsetX?: number;
  offsetY?: number;
  scale?: number;
};

export function BrainParticles({
  count,
  reducedMotion,
  pattern = "stagger",
  offsetX = 0,
  offsetY = 0,
  scale = 1,
}: Props) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const lastClickSeq = useRef(0);
  const { size, camera } = useThree();

  // A side-by-side layout has no room to be side-by-side on a phone. Below the
  // md breakpoint the mark returns to centre and shrinks. Computed before the
  // frame loop because the click ripple has to undo this transform to find
  // where the click landed in the group's own space.
  const narrow = size.width < 768;
  const placeX = narrow ? 0 : offsetX;
  const placeY = narrow ? offsetY * 0.5 : offsetY;
  const placeScale = narrow ? scale * 0.82 : scale;

  const [cloud, setCloud] = useState<LogoCloud | null>(null);

  // Sampling needs the artwork rasterised, which needs a network fetch and a
  // decode, so the cloud arrives asynchronously. Until it does this component
  // renders nothing and the static poster behind the canvas is what shows.
  useEffect(() => {
    let cancelled = false;

    sampleLogoCloud(count, pattern)
      .then((sampled) => {
        if (!cancelled) setCloud(sampled);
      })
      .catch((error) => {
        // Leaving the poster up is a perfectly acceptable outcome — far better
        // than a half-drawn mark or a thrown error taking the page down.
        console.error("[BrainParticles] logo sampling failed:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [count, pattern]);

  const geometry = useMemo(() => {
    if (!cloud) return null;

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(cloud.target, 3));
    g.setAttribute("aScatter", new THREE.BufferAttribute(cloud.scatter, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(cloud.color, 3));
    g.setAttribute("aSide", new THREE.BufferAttribute(cloud.side, 1));
    g.setAttribute("aIgnite", new THREE.BufferAttribute(cloud.ignite, 1));
    g.setAttribute("aAmbient", new THREE.BufferAttribute(cloud.ambient, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(cloud.seed, 1));

    // Particles travel far outside their target positions while scattered and
    // during dispersal. The auto-computed bounding sphere covers only the formed
    // mark, so three would frustum-cull the whole cloud mid-animation and the
    // hero would blink out. Pin it generously instead.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 8);

    return g;
  }, [cloud]);

  const initialUniforms = useMemo(() => createUniforms(), []);

  // Dispose GPU buffers when the geometry is replaced or unmounted. React drops
  // the object; the driver does not drop the VRAM unless asked.
  useEffect(() => {
    if (!geometry) return;
    return () => geometry.dispose();
  }, [geometry]);

  /* eslint-disable react-hooks/immutability --
   * Everything below writes to shader uniforms every frame.
   *
   * The compiler's analysis is correct in general and wrong here: it follows
   * `initialUniforms` from useMemo into the material's `uniforms` prop and back
   * out through `materialRef`, and concludes we are mutating a memo result.
   * We are — deliberately. A GPU render loop is the case this rule does not
   * model: uniforms must be written 60 times a second, and routing them through
   * React state would cost a full re-render per frame to animate values React
   * never reads.
   */

  // Point size must derive from viewport height and field of view, or particles
  // would appear a different physical size on a laptop and on a phone.
  useEffect(() => {
    const uniforms = materialRef.current?.uniforms;
    if (!uniforms) return;

    const perspective = camera as THREE.PerspectiveCamera;
    const fovRadians = ((perspective.fov ?? 45) * Math.PI) / 180;
    const projected = size.height / (2 * Math.tan(fovRadians / 2));

    uniforms.uSize.value = PARTICLE_WORLD_SIZE * projected;
    uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
  }, [size.height, camera, geometry]);

  useFrame((state, delta) => {
    const uniforms = materialRef.current?.uniforms;
    if (!uniforms) return;

    // A backgrounded tab can deliver a multi-second delta on return, which
    // would make every damped value snap. Cap it.
    const dt = Math.min(delta, 1 / 20);
    const p = scrollState.progress;

    if (reducedMotion) {
      // Hold the formed mark, lit, with no motion at all.
      uniforms.uForm.value = 1;
      uniforms.uIgnite.value = 1;
      uniforms.uSplit.value = 0;
      uniforms.uDisperse.value = 0;
      uniforms.uPointer.value.set(0, 0);
      pointsRef.current?.rotation.set(0, 0, 0);
      return;
    }

    uniforms.uTime.value = state.clock.elapsedTime;

    // --- click ripple -------------------------------------------------------
    // A new click has arrived if the sequence number moved. Converting from
    // normalised screen coordinates to the group's local space needs the
    // camera's visible extent at the z=0 plane, then the group's own offset
    // and scale removed — otherwise the ripple starts in the wrong place on
    // every layout that moves the mark off-centre.
    if (lastClickSeq.current !== scrollState.clickSeq) {
      lastClickSeq.current = scrollState.clickSeq;

      const perspective = camera as THREE.PerspectiveCamera;
      const distance = perspective.position.z;
      const visibleHeight =
        2 * Math.tan(((perspective.fov ?? 45) * Math.PI) / 360) * distance;
      const visibleWidth = visibleHeight * (size.width / size.height);

      const worldX = scrollState.clickNdcX * (visibleWidth / 2);
      const worldY = scrollState.clickNdcY * (visibleHeight / 2);

      uniforms.uClickPos.value.set(
        (worldX - placeX) / placeScale,
        (worldY - placeY) / placeScale,
      );
      uniforms.uClickAge.value = 0;
      uniforms.uClickActive.value = 1;
    }

    if (uniforms.uClickActive.value > 0.5) {
      uniforms.uClickAge.value += dt;
      // Switching off once spent lets the shader skip the ripple branch
      // entirely for the rest of the page's life.
      if (uniforms.uClickAge.value > WAVE_LIFE) {
        uniforms.uClickActive.value = 0;
      }
    }

    // --- the scroll beats ---------------------------------------------------
    // 0.00–0.28  scattered thought converges into the mark
    // 0.24–0.44  the filament ignites — the "LIT" moment
    // 0.46–0.70  the hemispheres part slightly: logic | creativity
    // 0.82–1.00  the mark disperses upward
    uniforms.uForm.value = damp(uniforms.uForm.value, range(p, 0, 0.28), 6, dt);
    uniforms.uIgnite.value = damp(
      uniforms.uIgnite.value,
      range(p, 0.24, 0.44),
      5,
      dt,
    );
    uniforms.uSplit.value = damp(
      uniforms.uSplit.value,
      range(p, 0.46, 0.7) * SPLIT_DISTANCE,
      4,
      dt,
    );
    uniforms.uDisperse.value = damp(
      uniforms.uDisperse.value,
      range(p, 0.82, 1),
      4,
      dt,
    );

    uniforms.uPointer.value.set(
      damp(uniforms.uPointer.value.x, scrollState.pointerX, 3, dt),
      damp(uniforms.uPointer.value.y, scrollState.pointerY, 3, dt),
    );

    // Whole-cloud tilt toward the cursor, for parallax depth.
    const points = pointsRef.current;
    if (points) {
      points.rotation.y = damp(
        points.rotation.y,
        scrollState.pointerX * 0.13,
        2.5,
        dt,
      );
      points.rotation.x = damp(
        points.rotation.x,
        -scrollState.pointerY * 0.08,
        2.5,
        dt,
      );
    }
  });
  /* eslint-enable react-hooks/immutability */

  if (!geometry) return null;

  return (
    <group position={[placeX, placeY, 0]} scale={placeScale}>
      <points ref={pointsRef} geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={brainVertexShader}
          fragmentShader={brainFragmentShader}
          uniforms={initialUniforms}
          transparent
          // Particles overlap constantly. Writing depth would let whichever
          // drew first punch a hole in everything behind it.
          depthWrite={false}
          // Normal, not additive: on a white page additive blending brightens
          // toward white, i.e. toward invisible.
          blending={THREE.NormalBlending}
        />
      </points>
    </group>
  );
}
