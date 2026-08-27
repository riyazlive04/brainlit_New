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

type NavigatorWithConnection = Navigator & {
  connection?: { effectiveType?: string; saveData?: boolean };
};

/**
 * Connections on which 2.5MB of character models is not worth attempting.
 *
 * `3g` is in the list and is the one that matters. Chromium reports it for
 * anything between roughly 400kbps and 700kbps with 275-2000ms of round trip -
 * which is a rural tower at a busy hour, not an unusable connection. Measured
 * on exactly that profile, the homepage was still downloading after sixty
 * seconds and the models were most of what was left.
 */
const SLOW_CONNECTIONS = ["slow-2g", "2g", "3g"];

/**
 * A poor connection is a low-tier device, whatever the silicon says.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TIER USED TO BE A QUESTION ABOUT THE MACHINE ONLY - cores, memory, pointer,
 * viewport - and that misses the case this exists to catch. A current phone in
 * a weak-signal area classifies `high`, downloads boy.glb, aeroplane.glb and
 * rocket.glb, and shows the visitor a hero that is still arriving a minute
 * later. Its processor was never the constraint.
 *
 * `low` is the right answer rather than a new tier because the procedural
 * character is not a degraded version of the scene - it is the same
 * composition and the same throw, drawn from geometry that is already in the
 * JavaScript bundle. See MODEL_TIERS in modelAssets.ts. The visitor on the bad
 * connection gets a hero that works; they do not get a placeholder.
 *
 * `saveData` is honoured for its own sake. A visitor who has turned on Data
 * Saver has said something explicit about what they want to spend, and 2.5MB
 * of decoration is the clearest possible case for listening.
 *
 * CHROMIUM ONLY. Safari and Firefox do not implement navigator.connection, so
 * this is a saving where it can be had rather than a guarantee - which is why
 * it sits alongside the hardware checks instead of replacing them.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function onSlowConnection(): boolean {
  const c = (navigator as NavigatorWithConnection).connection;
  if (!c) return false;
  return c.saveData === true || SLOW_CONNECTIONS.includes(c.effectiveType ?? "");
}

export function detectDeviceTier(): DeviceTier {
  if (typeof window === "undefined") return "mid";

  // Before any hardware question: the fastest processor on the market cannot
  // make a 2.5MB download finish sooner.
  if (onSlowConnection()) return "low";

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
