"use client";

import { Suspense, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { scrollState } from "@/lib/scrollState";
import { CartoonBoy } from "./CartoonBoy";
import { BoyModel } from "./BoyModel";
import { ModelBoundary } from "./lib/ModelBoundary";
import { CHARACTER_MODEL_URL, useModelAvailable } from "./lib/characterModel";
import { BOY_FACING, BOY_FEET, BOY_HEIGHT } from "./lib/flightPath";
import { DOLLY_FRACTION, shotProgress } from "./lib/shots";
import type { DeviceTier } from "./lib/deviceTier";

/**
 * The boy, placed in the cinematic and driven by scroll.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TWO CHARACTERS, ONE PART.
 *
 *   · BoyModel   — `public/boy.glb`, the client's actual character.
 *   · CartoonBoy — built at runtime from three.js primitives, no download.
 *
 * CartoonBoy is not a placeholder to be deleted once the model lands. It is
 * what plays the part in three situations that all persist forever:
 *
 *   1. while the model is downloading — a hero that is empty for two seconds on
 *      a slow connection is worse than one that is stylised for two seconds;
 *   2. if the model fails to arrive, or arrives corrupt;
 *   3. on low-tier devices, where the model's bytes and skinning cost more than
 *      the whole rest of the scene.
 *
 * So the two must stay interchangeable. Everything that decides WHERE he is and
 * WHEN he throws lives here, above both of them, and neither may own any of it.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** CartoonBoy is authored 2.0 units tall; the rig frames against BOY_HEIGHT. */
const PROCEDURAL_SCALE = BOY_HEIGHT / 2.0;

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
 */
const MODEL_TIERS: readonly DeviceTier[] = ["high", "mid"];

type Props = {
  reducedMotion: boolean;
  tier: DeviceTier;
  /**
   * Receives an empty at the throwing fist.
   *
   * The rocket reads this every frame to ride the hand until release, rather
   * than being re-parented at the moment of release — re-parenting mid-animation
   * costs a React re-render at the exact moment the frame budget is tightest,
   * and the frame where the parent swaps is the frame where it visibly jumps.
   */
  handRef: RefObject<THREE.Object3D | null>;
};

export function Boy({ reducedMotion, tier, handRef }: Props) {
  const rootRef = useRef<THREE.Group>(null);
  const throwRef = useRef(0);

  const model = useModelAvailable(CHARACTER_MODEL_URL);
  const useModel = MODEL_TIERS.includes(tier) && model === "present";

  useFrame(() => {
    const root = rootRef.current;
    if (!root) return;

    if (reducedMotion) {
      // The reduced-motion still is the finished fly-past, high above him. He
      // is out of that frame entirely, so there is nothing to pose.
      root.visible = false;
      return;
    }

    const p = scrollState.cinematic;

    /**
     * He disappears as the camera becomes him.
     *
     * Shot 3 travels to his eyeline, which means the camera passes through his
     * chest and ends up inside his skull. Hiding him partway through the travel
     * solves the clipping and is also simply correct: from shot 3 onward the
     * viewer IS him, and you do not see yourself from behind your own eyes. The
     * FOV punch covers the moment.
     */
    root.visible = shotProgress(p, "eyes") < DOLLY_FRACTION * 0.55;

    throwRef.current = shotProgress(p, "throw");
  });

  /**
   * The stand-in, and the Suspense fallback, and the error fallback. One
   * element for all three so there is no way for them to drift apart.
   *
   * `idle` is off: idle motion is time-based, and this sequence is strictly
   * positional — a breathing loop would be the one thing in it that does not
   * resolve from scroll alone. See lib/shots.ts.
   */
  const procedural = (
    <CartoonBoy
      scale={PROCEDURAL_SCALE}
      idle={false}
      blink={!reducedMotion}
      throwRef={throwRef}
      handRef={handRef}
    />
  );

  return (
    <group ref={rootRef} position={BOY_FEET} rotation={[0, BOY_FACING, 0]}>
      {useModel ? (
        <ModelBoundary label="Boy" fallback={procedural}>
          <Suspense fallback={procedural}>
            <BoyModel throwRef={throwRef} handRef={handRef} />
          </Suspense>
        </ModelBoundary>
      ) : (
        procedural
      )}
    </group>
  );
}
