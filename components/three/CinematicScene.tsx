"use client";

import { useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { Cinematic } from "./Cinematic";
import { detectDeviceTier, MAX_DPR } from "./lib/deviceTier";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

type Props = {
  /** False when the cinematic zone has scrolled out of view — pauses the frame loop. */
  active: boolean;
  onContextLost: () => void;
};

/**
 * Canvas host for the hero cinematic.
 *
 * A sibling of Scene.tsx rather than a rewrite of it. Scene.tsx still drives the
 * five `/lab/*` layout explorations, which exist to compare compositions of the
 * older logo arrangement; folding both into one component would mean a prop
 * matrix where most combinations are meaningless.
 */
export function CinematicScene({ active, onContextLost }: Props) {
  const reducedMotion = useReducedMotion();

  // Both read `window`, which is safe here because this module is only ever
  // loaded through a dynamic import with ssr disabled.
  const [tier] = useState(detectDeviceTier);
  const [dpr, setDpr] = useState(() =>
    Math.min(window.devicePixelRatio, MAX_DPR[tier]),
  );

  const handleCreated = useCallback(
    ({ gl }: { gl: { domElement: HTMLCanvasElement } }) => {
      gl.domElement.addEventListener(
        "webglcontextlost",
        (event) => {
          // Without preventDefault the context can never be restored. We still
          // fall back to the static poster rather than attempting a rebuild:
          // a half-restored scene looks worse than a clean gradient.
          event.preventDefault();
          onContextLost();
        },
        { once: true },
      );
    },
    [onContextLost],
  );

  return (
    <Canvas
      dpr={dpr}
      frameloop={active ? "always" : "never"}
      // react-three-fiber writes `pointer-events: auto` INLINE on its root div,
      // which beats the `pointer-events-none` class on the fixed wrapper in
      // CinematicMount — inline styles win over classes regardless of source
      // order. The result was an invisible, full-viewport click shield: this
      // canvas is `fixed inset-0` and never unmounts, it only fades to
      // `opacity: 0`, and an element at zero opacity still hit-tests. Every
      // control in the footer — the newsletter field, Subscribe, all four link
      // columns — was silently dead, because the footer is the one landmark on
      // the page that sits under the canvas rather than above it.
      //
      // This `style` merges into that same root div and puts the declaration
      // back. The scene is decorative and has no interaction of its own, so it
      // must never take a pointer event anywhere on the page.
      style={{ pointerEvents: "none" }}
      // Position and FOV are overwritten on the first frame by the camera rig
      // in Cinematic.tsx. These match CAM.boyPos / CAM.boyLook — the framing
      // shot 1 now holds — so the very first painted frame is already correct
      // rather than a default view that snaps.
      //
      // `far` has to clear the whole flight: the curve ends around 15 units out
      // and the mark assembles there. The default 2000 would work but wastes
      // depth precision on empty space.
      camera={{ position: [0.62, 0.95, 3.6], fov: 45, near: 0.1, far: 60 }}
      gl={{
        // The figure and the paper rocket have long straight silhouette edges,
        // which is exactly what aliasing is most visible on. Unlike the old
        // points-only scene — where MSAA bought nothing because every primitive
        // was a shader-drawn disc — it earns its cost here.
        antialias: true,
        powerPreference: "high-performance",
        // The page behind must show through. This scene is not a background; it
        // sits on the white page with the headline in front of it.
        alpha: true,
      }}
      onCreated={handleCreated}
    >
      {/* Drops resolution before the frame rate does. The starting tier is a
          guess from device hints; this is the measurement that corrects it. */}
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(1, d - 0.25))}
      />

      <Cinematic tier={tier} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
