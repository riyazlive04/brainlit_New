/**
 * Which model files exist, how they are loaded, and who is allowed to load them.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS MODULE MUST NOT IMPORT `three`, AND THAT IS ITS WHOLE REASON TO EXIST.
 *
 * These constants used to live in characterModel.ts, which does import three —
 * so anything that merely wanted to know the boy's URL dragged the entire
 * library in with it. That is fine inside the Canvas, where three is loading
 * anyway. It is not fine in CinematicMount, which is statically imported by the
 * homepage and therefore decides what lands in the eager bundle: importing
 * three there would put ~234KB of parse work in front of the hero text, which
 * is exactly what the idle gate in that file exists to prevent.
 *
 * So the plain facts about the assets live here, three-free, and
 * characterModel.ts re-exports them so existing call sites are unaffected.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { DeviceTier } from "./deviceTier";

/** Where the model is served from. */
export const CHARACTER_MODEL_URL = "/boy.glb";

/**
 * Draco compression.
 *
 * OFF, because drei fetches the Draco decoder from a Google CDN, and a hero
 * that cannot render until a third-party script arrives is a hero that breaks
 * whenever that CDN is blocked — which on a site aimed at schools and parents
 * is not rare. If the model must be Draco-compressed, set this true AND host
 * the decoder yourself via `useGLTF.setDecoderPath('/draco/')`.
 *
 * IT IS ALSO A CACHE KEY. drei keys its loader cache on the loader
 * configuration as well as the URL, so every `useGLTF` and every
 * `useGLTF.preload` for the same file has to pass the same value or they warm
 * and read different entries and the file is fetched twice.
 */
export const MODEL_USES_DRACO = false;

/**
 * Tiers that attempt the download.
 *
 * The model is the only asset in the hero and by far the largest thing on the
 * page. `detectDeviceTier` classifies most phones and any machine with four
 * cores or less as low, and those get the procedural character — same
 * composition, same throw, none of the bytes and none of the skinning.
 *
 * DO NOT WIDEN THIS without re-running Lighthouse on a throttled mid-range
 * Android. It is the gate that keeps a character model off the devices that
 * cannot afford one.
 *
 * LIVES HERE RATHER THAN IN Boy.tsx, where it was, because the preload in
 * CinematicMount has to consult it too. An unconditional preload downloads
 * 841KB to a phone that will render the procedural boy and never look at it —
 * the tier gate is worth nothing if the bytes arrive anyway.
 */
export const MODEL_TIERS: readonly DeviceTier[] = ["high", "mid"];
