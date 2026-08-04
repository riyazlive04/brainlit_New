/**
 * Device capability detection.
 *
 * Full 3D ships to every device by product decision, so the scene has to scale
 * itself instead of being switched off. These heuristics pick a starting
 * particle budget; `PerformanceMonitor` then adjusts resolution at runtime if
 * the starting guess was still too generous.
 */

export type DeviceTier = "high" | "mid" | "low";

/** Starting particle counts per tier. */
export const PARTICLE_BUDGET: Record<DeviceTier, number> = {
  high: 15000,
  mid: 8000,
  low: 4000,
};

/** Upper bound on device pixel ratio. */
export const MAX_DPR: Record<DeviceTier, number> = {
  high: 2,
  mid: 1.5,
  low: 1.25,
};

/**
 * Does this browser actually give us a WebGL context?
 *
 * Not the same question as "does this browser support WebGL". Contexts are
 * refused for reasons unrelated to capability: too many live contexts, a
 * blocklisted driver, battery saver, or a hardened privacy setting. Every one
 * of those must land on the static fallback rather than a blank hero.
 */
let webglSupport: boolean | null = null;

export function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;

  // Cached because this doubles as a `useSyncExternalStore` snapshot, which is
  // called on every render and must be both cheap and referentially stable.
  // Probing for a context on each call would also churn the context budget.
  if (webglSupport !== null) return webglSupport;

  webglSupport = probeWebGL();
  return webglSupport;
}

function probeWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");

    if (!gl) return false;

    // Release it immediately. Browsers cap simultaneous contexts (often ~16),
    // and leaking the probe context can starve the real one.
    const lose = (gl as WebGLRenderingContext).getExtension(
      "WEBGL_lose_context",
    );
    lose?.loseContext();

    return true;
  } catch {
    return false;
  }
}

type NavigatorWithMemory = Navigator & { deviceMemory?: number };

export function detectDeviceTier(): DeviceTier {
  if (typeof window === "undefined") return "mid";

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as NavigatorWithMemory).deviceMemory ?? 4;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const width = window.innerWidth;

  // deviceMemory is Chromium-only and rounded down to a power of two, so treat
  // it as a floor signal rather than a precise figure.
  if (cores <= 4 || memory <= 2) return "low";

  // A touch device with a small viewport is almost certainly a phone. Even a
  // high-core Android phone throttles hard under sustained GPU load, so it is
  // capped a tier below what its specs suggest.
  if (coarsePointer && width < 900) {
    return cores >= 8 && memory >= 6 ? "mid" : "low";
  }

  if (cores >= 8 && memory >= 8) return "high";
  return "mid";
}
