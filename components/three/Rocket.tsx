"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollState";
import {
  FLIGHT_CURVE,
  HAND_RELEASE,
  RELEASE_PROGRESS,
  flightT,
  onFlightCurveChanged,
  sampleTrail,
  setReleasePoint,
} from "./lib/flightPath";
import {
  MARK_SETTLE,
  REDUCED_MOTION_PROGRESS,
  shotProgress,
} from "./lib/shots";
import { trailVertexShader, trailFragmentShader } from "./shaders/trail";
import { ROCKET_MODEL_URL, useModelAvailable } from "./lib/characterModel";
import { ModelBoundary } from "./lib/ModelBoundary";
import { RocketModel } from "./RocketModel";
import { BRAND } from "@/lib/brand";
import type { DeviceTier } from "./lib/deviceTier";

/**
 * The paper rocket, and the dotted trail it leaves.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TWO ROCKETS, ONE PART — the same arrangement as Boy.tsx.
 *
 * `public/rocket.glb` is used when it is there. The geometry below is what
 * plays the part while it downloads, and if it never arrives.
 *
 * The procedural one is about forty triangles: a rolled cone with five radial
 * segments, flat shaded. The facets are not a performance compromise, they are
 * what makes it read as PAPER — a smooth cone reads as plastic, visible folds
 * read as something folded by hand, which is the whole point of the object.
 *
 * WHAT THIS FILE OWNS, whichever rocket is in it: where it is, which way it
 * points, how it rolls, and the burn. A model supplies geometry and nothing
 * else. That matters most for the burn — see `paint`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Trail dot counts by device tier. Taken out of the frame budget, not added to it. */
const TRAIL_DOTS: Record<DeviceTier, number> = {
  high: 900,
  mid: 600,
  low: 340,
};

const ROCKET_LENGTH = 0.2;
const ROCKET_RADIUS = 0.045;

/**
 * The three states the paper passes through in shot 4.
 *
 * Ordinary paper, then flame, then char. The middle one is `spark` from
 * lib/brand.ts, which is documented there as "the filament — the LIT moment"
 * and reserved for exactly this. It is the only place in the sequence the
 * brand's ignition yellow appears at full strength, and it is the frame the
 * whole film exists to arrive at.
 */
const PAPER_COLOR = new THREE.Color("#cdd6e6");
const FLAME_COLOR = new THREE.Color(BRAND.spark);
const CHAR_COLOR = new THREE.Color("#241a12");
const NO_GLOW = new THREE.Color("#000000");

/** The cone's own axis, before it is aimed along the curve. */
const LOCAL_UP = new THREE.Vector3(0, 1, 0);

/** Scratch colours for the burn, so it allocates nothing per frame. */
const BURN_TINT = new THREE.Color();
const BURN_GLOW = new THREE.Color();

type Props = {
  tier: DeviceTier;
  reducedMotion: boolean;
  /** An empty at the end of the throwing arm. The rocket rides it until release. */
  handRef: RefObject<THREE.Object3D | null>;
};

export function Rocket({ tier, reducedMotion, handRef }: Props) {
  const rocketRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.ShaderMaterial>(null);
  const { size, camera } = useThree();

  /**
   * Three fins, as thin double-sided quads around the base.
   *
   * Built into one geometry rather than three meshes: three sub-2KB draw calls
   * for something a centimetre across on screen is the kind of thing that is
   * invisible individually and adds up to a frame budget.
   */
  const finGeometry = useMemo(() => {
    const positions: number[] = [];
    const w = ROCKET_RADIUS * 1.55;
    const h = ROCKET_LENGTH * 0.42;

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const cx = Math.cos(angle);
      const cz = Math.sin(angle);

      // A right triangle: tall at the shaft, tapering out and down.
      const ax = cx * ROCKET_RADIUS * 0.6;
      const az = cz * ROCKET_RADIUS * 0.6;
      const bx = cx * w;
      const bz = cz * w;

      positions.push(
        ax, -ROCKET_LENGTH * 0.5, az,
        ax, -ROCKET_LENGTH * 0.5 + h, az,
        bx, -ROCKET_LENGTH * 0.5, bz,
      );
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  /**
   * Bumped when the flight curve's start moves, so the trail is resampled.
   *
   * The trail is several hundred points uploaded once. When the release point
   * is corrected the curve changes shape near t=0, and a trail built before
   * that would draw the old flight — a dotted line that no longer leaves his
   * hand. It happens once, during shot 1, long before any of it is visible.
   */
  const [curveVersion, setCurveVersion] = useState(0);
  useEffect(
    () => onFlightCurveChanged(() => setCurveVersion((n) => n + 1)),
    [],
  );

  const trailGeometry = useMemo(() => {
    const count = TRAIL_DOTS[tier];
    const { position, t } = sampleTrail(count);

    const seed = new Float32Array(count);
    // Deterministic, so the trail is identical on every load and between
    // server-rendered poster and live scene.
    for (let i = 0; i < count; i++) seed[i] = ((i * 9301 + 49297) % 233280) / 233280;

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(position, 3));
    g.setAttribute("aT", new THREE.BufferAttribute(t, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));

    // The curve spans roughly 15 units. Left to compute its own bounds the
    // trail would be culled the moment the camera looked along it.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 5, -2), 14);
    return g;
  }, [tier, curveVersion]);

  // Resampling allocates a new buffer; the old one holds GPU memory until it is
  // told not to.
  useEffect(() => () => trailGeometry.dispose(), [trailGeometry]);

  const trailUniforms = useMemo(
    () => ({
      uHead: { value: 0 },
      uSize: { value: 6 },
      uPixelRatio: { value: 1 },
      uFade: { value: 1 },
      uColor: { value: new THREE.Color(BRAND.indigo) },
    }),
    [],
  );

  const paperMaterial = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        color: new THREE.Color("#cdd6e6"),
        // Rolled paper is a surface with no inside. Without DoubleSide the cone
        // vanishes whenever the camera catches its open base, which during the
        // POV shots is most of the flight.
        side: THREE.DoubleSide,
        flatShading: true,
      }),
    [],
  );

  /**
   * Materials the burn has to drive.
   *
   * The procedural rocket's own, plus whatever `rocket.glb` brought if it
   * loaded. Held in state rather than a ref because the model reports its
   * materials on mount, and the burn must start driving them from that frame.
   *
   * Colour is applied as a TINT. On the procedural mesh the base is flat paper
   * grey so the tint is the colour; on a textured model it multiplies the map,
   * which is what makes a printed paper plane go orange and then black rather
   * than losing its print the instant it catches.
   */
  const [modelMaterials, setModelMaterials] = useState<THREE.MeshStandardMaterial[]>([]);
  const handleMaterials = useCallback(
    (materials: THREE.MeshStandardMaterial[]) => setModelMaterials(materials),
    [],
  );

  const model = useModelAvailable(ROCKET_MODEL_URL);
  const useModel = model === "present";

  /** Paints every material the rocket is currently made of. */
  const paint = useCallback(
    (color: THREE.Color, glow: THREE.Color) => {
      paperMaterial.color.copy(color);
      paperMaterial.emissive.copy(glow);
      for (const material of modelMaterials) {
        material.color.copy(color);
        material.emissive.copy(glow);
      }
    },
    [paperMaterial, modelMaterials],
  );

  /** The hand the curve's start is currently calibrated against. */
  const calibratedTo = useRef<THREE.Object3D | null>(null);

  const release = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);
  const point = useMemo(() => new THREE.Vector3(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);

  /** The folded-paper rocket: stand-in, fallback, and low-cost default. */
  const procedural = (
    <>
      <mesh material={paperMaterial}>
        <coneGeometry args={[ROCKET_RADIUS, ROCKET_LENGTH, 5, 1, true]} />
      </mesh>
      <mesh material={paperMaterial} geometry={finGeometry} />
    </>
  );

  useFrame(() => {
    const rocket = rocketRef.current;
    if (!rocket) return;

    const p = reducedMotion ? REDUCED_MOTION_PROGRESS : scrollState.cinematic;
    const t = flightT(p);

    /**
     * Teach the flight curve where the throw actually begins.
     *
     * Done here — unconditionally, not inside the "still in his hand" branch
     * below — because the hand's world position is knowable on every frame,
     * and the branch is not reached on every page life. Browsers restore
     * scroll position on refresh, and the lab scrubber and any deep link can
     * open the page already past the release. Calibrating only on the way
     * through left those loads flying a curve that started a metre from his
     * hand, which is the very drift this is here to prevent.
     *
     * Keyed on the hand's IDENTITY, so it re-runs when the loaded character
     * replaces the procedural stand-in mid-scroll and takes the rocket with
     * it. `setReleasePoint` is a no-op when nothing moved.
     *
     * NOTE FOR WHEN THE BOY IS RIGGED. This samples the hand at its CURRENT
     * pose, which is exact today only because nothing articulates: `bodyLean`
     * is all that moves him and it is ~0 at the release instant. With a real
     * arm swing the hand sweeps through an arc, and this must instead sample
     * it with the throw scrubbed to RELEASE_PROGRESS.
     */
    const held = handRef.current;
    if (held) {
      /**
       * TWO conditions, and both are load-bearing.
       *
       * `fresh` — this hand has never been measured. Must run whatever the
       * scroll position is, because the page can open anywhere: browsers
       * restore scroll on refresh, deep links land mid-sequence, and the lab
       * scrubber opens on whatever `?p=` says. Gating this on being before the
       * release is what left those loads flying a curve that started a metre
       * behind his head.
       *
       * `moved` — the hand has carried the rocket away from where the curve
       * currently starts. Only tracked BEFORE the release, because after it the
       * hand keeps moving and has nothing more to say about where the throw
       * began. Tracking it up to that instant means the curve starts where the
       * hand is on the last frame before he lets go, which is the definition of
       * the release point, and stays true once a rig makes the hand sweep a
       * real arc.
       *
       * Thresholded rather than run every frame: each recalibration rebuilds
       * the curve's length table and the trail's vertex buffer. Cheap here
       * because before the release the trail is drawing nothing.
       */
      const fresh = calibratedTo.current !== held;

      if (fresh || p < RELEASE_PROGRESS) {
        held.getWorldPosition(release);
        const moved = release.distanceToSquared(FLIGHT_CURVE.points[0]) > 0.0009;

        if (fresh || moved) {
          calibratedTo.current = held;
          setReleasePoint(release);
        }
      }
    }

    // --- trail -------------------------------------------------------------
    const trail = trailRef.current;
    if (trail) {
      trail.uniforms.uHead.value = t;
      // The trail hands over to the mark rather than lingering behind it, and
      // is gone by the time the mark settles — a dotted line still hanging in
      // the sky under a finished logo reads as a leftover, not a flight path.
      trail.uniforms.uFade.value =
        1 - Math.min(1, shotProgress(p, "mark") / MARK_SETTLE);

      // Point size must derive from viewport height and FOV, or dots would be a
      // different physical size on a laptop and a phone. Same derivation as
      // BrainParticles — see the note there.
      const perspective = camera as THREE.PerspectiveCamera;
      const fovRadians = ((perspective.fov ?? 45) * Math.PI) / 180;
      trail.uniforms.uSize.value =
        0.009 * (size.height / (2 * Math.tan(fovRadians / 2)));
      trail.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    }

    // --- in the hand -------------------------------------------------------
    if (p < RELEASE_PROGRESS) {
      const hand = handRef.current;
      if (hand) {
        hand.getWorldPosition(rocket.position);
        hand.getWorldQuaternion(rocket.quaternion);
      } else {
        // No hand to ride. This is the low-tier path, where the figure is not
        // rendered at all — the rocket simply waits at the release point and the
        // sequence becomes "a paper rocket flies up and becomes the mark".
        // A shorter story, but a whole one.
        rocket.position.copy(HAND_RELEASE);
      }
      // Reset, not just show. Scrubbing backwards past the burn has to undo it —
      // otherwise the boy is left holding a charred nub scaled to nothing.
      paint(PAPER_COLOR, NO_GLOW);
      rocket.scale.setScalar(1);
      rocket.visible = true;
      return;
    }

    // --- in flight ---------------------------------------------------------
    FLIGHT_CURVE.getPoint(t, point);
    rocket.position.copy(point);

    // Aim the nose down the curve. A thrown object that stays axis-aligned is
    // the single clearest tell that something is animated rather than moving.
    FLIGHT_CURVE.getTangent(t, tangent);
    quat.setFromUnitVectors(LOCAL_UP, tangent.normalize());
    rocket.quaternion.copy(quat);

    // Paper is light and tumbles. A slow roll about its own axis, keyed to
    // distance travelled rather than to the clock, so it stays positional.
    rocket.rotateOnAxis(LOCAL_UP, t * 9.2);

    // --- the burn ----------------------------------------------------------
    // Catch, flare, char, gone — with the ember cloud in Mark.tsx taking over
    // partway through the char so the two overlap rather than hand off cleanly.
    // A clean handoff is visible; an overlap is a transformation.
    const burning = shotProgress(p, "burn");

    if (burning <= 0) {
      paint(PAPER_COLOR, NO_GLOW);
      rocket.scale.setScalar(1);
      rocket.visible = true;
      return;
    }

    if (burning < 0.3) {
      // Catching. Fast, and the glow leads the colour — paper goes bright
      // before it goes yellow.
      const u = burning / 0.3;
      paint(
        BURN_TINT.copy(PAPER_COLOR).lerp(FLAME_COLOR, u),
        BURN_GLOW.copy(NO_GLOW).lerp(FLAME_COLOR, u * 0.9),
      );
    } else {
      // Charring. The glow dies faster than the colour, which is what makes it
      // read as burning out rather than as a light being switched off.
      const u = (burning - 0.3) / 0.7;
      paint(
        BURN_TINT.copy(FLAME_COLOR).lerp(CHAR_COLOR, u * u),
        BURN_GLOW.copy(FLAME_COLOR).lerp(NO_GLOW, Math.min(1, u * 2.2)),
      );
    }

    // It consumes itself, finishing exactly on the shot boundary — the frame
    // before the embers appear. Ending any earlier leaves a gap with nothing on
    // screen; any later and the logo starts arriving over a rocket that is
    // still alight, which is the thing this sequencing exists to prevent.
    const consumed = Math.max(0, Math.min(1, (burning - 0.55) / 0.45));
    rocket.scale.setScalar(1 - consumed);
    rocket.visible = consumed < 0.995;
  });

  return (
    <>
      <group ref={rocketRef}>
        {/* The procedural rocket is both the stand-in while `rocket.glb`
            downloads and the permanent fallback if it never arrives — the same
            arrangement as CartoonBoy and BoyModel. See Boy.tsx. */}
        {useModel ? (
          <ModelBoundary label="Rocket" fallback={procedural}>
            <Suspense fallback={procedural}>
              {/* Longer than the procedural cone because a folded PLANE reads
                  smaller than a dart of the same length — most of a plane is
                  wing. 0.26 against a 1.5m boy is a 26cm sheet, which is what a
                  child actually folds. */}
              <RocketModel length={ROCKET_LENGTH * 1.3} onMaterials={handleMaterials} />
            </Suspense>
          </ModelBoundary>
        ) : (
          procedural
        )}
      </group>

      <points geometry={trailGeometry}>
        <shaderMaterial
          ref={trailRef}
          vertexShader={trailVertexShader}
          fragmentShader={trailFragmentShader}
          uniforms={trailUniforms}
          transparent
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>
    </>
  );
}
