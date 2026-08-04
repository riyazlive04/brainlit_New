"use client";

import { useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { BrainParticles } from "./BrainParticles";
import type { FieldPattern } from "./lib/logoSampler";
import { detectDeviceTier, MAX_DPR, PARTICLE_BUDGET } from "./lib/deviceTier";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

export type ScenePlacement = {
  /** Layout of the background dot field. */
  pattern?: FieldPattern;
  /** World-space offset, letting the mark sit beside the copy instead of under it. */
  offsetX?: number;
  offsetY?: number;
  scale?: number;
};

type Props = ScenePlacement & {
  /** False when the 3D zone has scrolled out of view — pauses the frame loop. */
  active: boolean;
  onContextLost: () => void;
};

export function Scene({
  active,
  onContextLost,
  pattern,
  offsetX,
  offsetY,
  scale,
}: Props) {
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
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{
        // Points are round discs drawn in the fragment shader, so MSAA buys
        // almost nothing here and costs real fill rate on mobile.
        antialias: false,
        powerPreference: "high-performance",
        // The page behind must show through — this scene is not a background,
        // it sits on the white page.
        alpha: true,
      }}
      onCreated={handleCreated}
    >
      {/* Drops resolution before the frame rate does. The starting tier is a
          guess from device hints; this is the measurement that corrects it. */}
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(1, d - 0.25))}
      />

      <BrainParticles
        count={PARTICLE_BUDGET[tier]}
        reducedMotion={reducedMotion}
        pattern={pattern}
        offsetX={offsetX}
        offsetY={offsetY}
        scale={scale}
      />
    </Canvas>
  );
}
