"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollState";
import { Boy } from "./Boy";
import { Rocket } from "./Rocket";
import { Plane } from "./Plane";
import { Embers } from "./Embers";
import {
  EYE,
  FLIGHT_CURVE,
  MARK_ANCHOR,
  flightT,
} from "./lib/flightPath";
import {
  DOLLY_FRACTION,
  MARK_SETTLE,
  REDUCED_MOTION_PROGRESS,
  SHOTS,
  shotProgress,
} from "./lib/shots";
import { damp, lerp, range, smootherstep } from "./lib/ease";
import type { DeviceTier } from "./lib/deviceTier";

/**
 * The hero cinematic: five shots, driven entirely by scroll position.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE CAMERA IS COMPUTED, NOT DAMPED.
 *
 * Every other moving thing on this site is smoothed with `damp` toward a target.
 * The camera deliberately is not, and the reason is the promise in shots.ts: the
 * frame must be a pure function of scroll position.
 *
 * A damped camera converges on the right answer over a few hundred milliseconds.
 * That is invisible while scrolling and very visible on arrival — refresh
 * halfway through the sequence, or follow a link to an anchor below it, and you
 * watch the camera fly in from wherever it happened to initialise. Computing
 * position directly from `progress` means the first frame after any navigation
 * is already correct.
 *
 * Smoothness comes from `smootherstep` on the interpolation instead, which costs
 * nothing and cannot lag. The ONLY damped value here is pointer parallax, which
 * has no correct scroll position and is transient by nature.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Camera stations. Positions and look targets in world space.
 *
 * Tuned against real captures at 1440×900, not by arithmetic. The first pass
 * put the camera at z=5.85 on the reasoning that a 1.5m figure at that distance
 * fills about a third of the frame — it rendered at a fifth, because the boy
 * stands 1.7 units off the view axis and everything off-axis is further away
 * than the z distance suggests.
 *
 * Two constraints fight here and both are load-bearing:
 *   · he has to be large enough to read as a child rather than a marker pin
 *   · he has to stay clear of the headline, which owns the left half up to
 *     roughly 720px on a desktop viewport
 * Moving the camera closer satisfies the first and breaks the second, because a
 * nearer camera pushes an off-axis subject further toward the edge. The look
 * target therefore moves right as the camera moves in, which is what keeps him
 * at ~75% of the width instead of sliding off it.
 *
 * If you change any of these, re-shoot rather than re-reason. /lab/cinematic
 * exists for exactly this.
 */
const CAM = {
  /**
   * Shot 1 HOLDS on these. There is no opening push-in any more — see the note
   * in the shot 1 branch. They are also what the canvas is initialised with, so
   * the very first painted frame is already the held framing.
   */
  boyPos: new THREE.Vector3(0.62, 0.95, 3.6),
  boyLook: new THREE.Vector3(0.62, 0.72, 0),
  /** Shot 2 lifts and opens up the space the rocket is about to occupy. */
  throwPos: new THREE.Vector3(0.68, 1.35, 3.5),
  throwLook: new THREE.Vector3(0.98, 1.6, 0),
} as const;

/**
 * A note on why the camera sits low and close.
 *
 * The character's appeal is almost entirely in the face — that is what the
 * reference art is selling, and it is what makes him read as a child rather than
 * as a small adult. At the previous framing he was 240px tall on a 900px
 * viewport, which put the face at about 60px: present, but not doing any work.
 *
 * The camera is also slightly BELOW his eyeline, looking up. A child shot from
 * adult eye height reads as small and observed; shot from just below, he reads
 * as the subject. It costs nothing and it is the difference between a mascot and
 * a protagonist.
 */

/** Small drift on the closing shot, so the fly-past has parallax to read against. */
const CLOSE_DRIFT = new THREE.Vector3(0.35, -0.25, 0.9);

const BASE_FOV = 45;

/**
 * How far the FOV opens during the dolly to the boy's eyeline.
 *
 * This is the whole trick of shot 3. A hard cut is wrong under scroll — the
 * viewer is dragging the camera, so an instant jump reads as a rendering bug
 * rather than as an edit. But a slow dolly into someone's head is worse: it is
 * three seconds of travelling through a character's skull.
 *
 * So the move is fast and the FOV punches open and closed across it. The
 * distortion covers the travel the way a whip pan covers a cut in film, and
 * because it is keyed to scroll it stays coherent if someone scrubs it one
 * notch at a time.
 */
const DOLLY_FOV_PUNCH = 21;

/**
 * Field of view during the burn. A long lens.
 *
 * Shot 4 is watched from the boy's eyeline, and from there the rocket is a 20cm
 * object seven metres away — three pixels. That was survivable while the ember
 * cloud bloomed around it and filled the frame, but the embers now belong to
 * shot 5, and what was left was an empty sky with a speck in it.
 *
 * Zooming rather than moving is the honest fix. The camera cannot approach the
 * rocket without abandoning the POV the previous shot just established, so it
 * stays where his eyes are and the lens does the work — exactly what a
 * cinematographer reaches for when the subject is far away and the observer
 * cannot follow. At 12° the rocket is roughly four times larger and the burn is
 * something you can actually watch happen.
 *
 * Shot 5 then widens back to BASE_FOV while the camera simultaneously pulls to
 * the mark. A zoom against a dolly is the vertigo shot, and here it is doing
 * real work: the embers appear to burst outward as the lens opens.
 */
const BURN_FOV = 12;

type Props = {
  tier: DeviceTier;
  reducedMotion: boolean;
};

export function Cinematic({ tier, reducedMotion }: Props) {
  const { camera, size } = useThree();
  const handRef = useRef<THREE.Object3D>(null);
  const parallax = useRef({ x: 0, y: 0 });

  // Scratch vectors. Allocating a Vector3 inside useFrame is 60 allocations a
  // second per vector, which the GC eventually charges for as a dropped frame.
  const scratch = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      look: new THREE.Vector3(),
      rocket: new THREE.Vector3(),
      markCam: new THREE.Vector3(),
    }),
    [],
  );

  /**
   * A phone is not a letterbox.
   *
   * The composition puts the boy right of centre so the headline can have the
   * left half of a desktop viewport. On a narrow screen there is no left half —
   * the layout stacks, the copy is above, and a subject held off to one side is
   * simply half out of frame. Below the md breakpoint the rig recentres on him
   * and moves in, because at the desktop distance he would be a thumbnail.
   */
  const narrow = size.width < 768;
  const lookBiasX = narrow ? 1.68 : 0;
  const subjectDistance = narrow ? 0.72 : 1;
  const markDistance = narrow ? 1.42 : 1;
  /**
   * Raising the look axis pushes the subject DOWN the frame.
   *
   * On a phone the copy stacks and fills the upper two thirds of the viewport.
   * A centred figure would sit directly behind the headline, and unlike the
   * philosophy screen the hero has no scrim to lift the type off him. Dropping
   * him into the space under the CTAs keeps both readable without a scrim.
   */
  const lookBiasY = narrow ? 0.5 : 0;

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);

    // Reduced motion holds a static composition of the final shot: the mark,
    // formed and lit, with no camera movement at all. WCAG 2.3.3.
    const p = reducedMotion ? REDUCED_MOTION_PROGRESS : scrollState.cinematic;

    const { pos, look, rocket, markCam } = scratch;

    // Where the rocket is right now — several shots track it.
    FLIGHT_CURVE.getPoint(flightT(p), rocket);

    let fov = BASE_FOV;

    if (p < SHOTS.throw.start) {
      /**
       * ── Shot 1 · the boy ────────────────────────────────────────────────
       *
       * HELD. The camera does not move at all until he throws.
       *
       * It used to push in over this shot, from z=4.3 to z=3.6 — described in
       * the rig as "opens wide and pushes in very slightly". On paper that is a
       * gentle reveal. In the browser it is not: 0.7 units is a fifth of the
       * distance, so he grows by about that much and slides toward centre over
       * the first ~570px of scrolling, and what it reads as is the boy
       * advancing on you while you try to read the headline. Removed on that
       * basis.
       *
       * Restore by lerping into CAM.boyPos from a wider position here — the
       * shot is one branch and nothing else depends on it moving.
       */
      pos.copy(CAM.boyPos);
      look.copy(CAM.boyLook);
    } else if (p < SHOTS.eyes.start) {
      // ── Shot 2 · the throw ──────────────────────────────────────────────
      const t = smootherstep(shotProgress(p, "throw"));
      pos.lerpVectors(CAM.boyPos, CAM.throwPos, t);
      look.lerpVectors(CAM.boyLook, CAM.throwLook, t);

      // Once it is out of his hand the camera starts to care about it more than
      // about him. Blended in over the back half of the shot so the handover to
      // the POV in shot 3 is already underway when the dolly starts.
      const chase = smootherstep(Math.max(0, (t - 0.45) / 0.55));
      look.lerp(rocket, chase * 0.7);
    } else if (p < SHOTS.mark.start) {
      // ── Shots 3 and 4 · his eyes, and the burn ──────────────────────────
      // One branch, because they are one continuous camera: the dolly lands at
      // his eyeline early in shot 3 and does not move again until shot 5.
      const t = shotProgress(p, "eyes");
      const dolly = smootherstep(Math.min(1, t / DOLLY_FRACTION));

      pos.lerpVectors(CAM.throwPos, EYE, dolly);
      // Look at the rocket throughout. During the travel this is what stops the
      // move reading as a teleport: the subject stays locked in frame while
      // everything around it swings.
      look.copy(rocket);

      // The whip that covers the travel, then the long lens that lets us watch
      // the paper catch. During shot 3 the burn term is zero, so these two do
      // not fight.
      const zoom = smootherstep(range(shotProgress(p, "burn"), 0, 0.5));
      fov = lerp(
        BASE_FOV + Math.sin(dolly * Math.PI) * DOLLY_FOV_PUNCH,
        BURN_FOV,
        zoom,
      );
    } else {
      /**
       * ── Shot 5 · the fly-past ──────────────────────────────────────────
       *
       * The camera does not move, and does not track.
       *
       * It used to travel to frame the assembling logo. That beat is gone, and
       * what replaced it needs the opposite treatment: the aeroplane is flying
       * straight at the viewer, so the strongest thing the camera can do is
       * hold still on his eyeline and let it come. A camera that chases an
       * object approaching it produces a swing through 180° as the object
       * passes — and the lookAt goes singular at the moment it does.
       *
       * So it holds, aimed back down the flight path where the plane comes
       * from, and widens out of the burn's long lens. The plane grows from a
       * speck to filling the frame and passes overhead, entirely because it is
       * moving and the lens is opening.
       */
      const t = smootherstep(Math.min(1, shotProgress(p, "mark") / MARK_SETTLE));

      // A small drift back and down: enough parallax that the shot is not
      // frozen, not enough to become a camera move competing with the plane.
      markCam.copy(EYE).add(CLOSE_DRIFT);
      pos.lerpVectors(EYE, markCam, t);
      look.copy(MARK_ANCHOR);

      fov = lerp(BURN_FOV, BASE_FOV, t);
    }

    // --- framing for narrow viewports ---------------------------------------
    // Applied to the subject shots only. You cannot pull back from inside
    // someone's head, so the POV shots are left alone.
    if (narrow && p < SHOTS.eyes.start) {
      pos.x += lookBiasX;
      look.x += lookBiasX;
      pos.y += lookBiasY;
      look.y += lookBiasY;
      pos.sub(look).multiplyScalar(subjectDistance).add(look);
    }

    // --- pointer parallax ---------------------------------------------------
    // The one damped value here, and the one with no correct scroll position.
    // Small: this is a camera with a story to tell, not a toy to wobble.
    parallax.current.x = damp(parallax.current.x, scrollState.pointerX, 3, dt);
    parallax.current.y = damp(parallax.current.y, scrollState.pointerY, 3, dt);
    pos.x += parallax.current.x * 0.09;
    pos.y += parallax.current.y * 0.06;

    camera.position.copy(pos);
    camera.lookAt(look);

    const perspective = camera as THREE.PerspectiveCamera;
    if (Math.abs(perspective.fov - fov) > 0.01) {
      perspective.fov = fov;
      perspective.updateProjectionMatrix();
    }
  });

  return (
    <>
      {/* ── Lighting ───────────────────────────────────────────────────────
          Rebalanced when the character moved from unlit flat colour to shaded
          materials. The old rig was a very strong ambient plus a key, which is
          fine for unlit work and useless for shaded: a large uniform ambient
          term washes out exactly the form shading the materials exist to
          produce, and the figure goes back to looking flat.

          A hemisphere light does the ambient job properly. Instead of one
          uniform value it gives warm-white from above and a cool page-coloured
          bounce from below, which is physically what happens to a character
          standing on a white page — and that vertical gradient alone does most
          of the work of making a head read as a sphere. */}
      <hemisphereLight args={["#ffffff", "#c9d4e6", 1.35]} />
      <ambientLight intensity={0.32} />
      {/* Key, high and front-left, matching the reference's lighting direction. */}
      <directionalLight position={[-3.2, 5.5, 4.5]} intensity={1.9} />
      {/* Fill from the opposite side, weak — enough to keep the shadow side from
          going muddy without flattening the form back out. */}
      <directionalLight position={[4, 1.5, -3]} intensity={0.45} />

      {/* The figure is the expensive half of this scene and the only part that
          needs a downloaded asset.

          `tier` is passed rather than used to gate him out entirely, which is
          what it used to do. Low-tier devices — most phones, and exactly the
          visitors on Indian mobile data this site is mostly for — now still get
          a character; they get the procedural one, which downloads nothing and
          has no skinning cost. The tier decides WHICH boy, not WHETHER. See the
          note on MODEL_TIERS in Boy.tsx. */}
      <Boy reducedMotion={reducedMotion} tier={tier} handRef={handRef} />
      <Rocket tier={tier} reducedMotion={reducedMotion} handRef={handRef} />
      {/* What the paper becomes. Scales up out of the fire as the rocket is
          consumed, then runs at the camera and past it during shot 5 while the
          mark assembles behind it. */}
      <Plane reducedMotion={reducedMotion} />
      {/* Sparks off the burning paper. The logo assembly that used to close the
          sequence has been removed — see Embers.tsx. */}
      <Embers tier={tier} reducedMotion={reducedMotion} />
    </>
  );
}
