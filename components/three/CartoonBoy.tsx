"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { armAngle, armSwing } from "./lib/throwPose";

/**
 * A stylised cartoon boy, built entirely from Three.js primitives.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NO EXTERNAL ASSET. This replaces an 810KB rigged GLB that was generated in
 * Blender. Everything here — skull, hair, eyes, clothing, sneakers — is
 * generated at runtime from Sphere, Capsule, Cone, Lathe, Extrude, Torus,
 * Cylinder and Box geometry.
 *
 * The GLB bought skinned deformation, which this cannot do. What it costs in
 * exchange is nothing: no fetch, no loader, no 404, no asset that can drift out
 * of step with the code positioning it, and the proportions are edited by
 * changing a number rather than by re-running a build script.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PROPORTIONS are the whole character, and these are MEASURED OFF THE CLIENT'S
 * TURNAROUND rather than chosen:
 *
 *      hair above skull   10%
 *      head               18%
 *      torso              27%
 *      legs               34%
 *      shoes               6%
 *      neck             barely there
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HE IS NOT A CHIBI. This build used to put head + hair at 45% of total height,
 * on the strength of an earlier reference, and every other measurement followed
 * from it: stubby limbs, enormous sneakers, oversized hands. Against the
 * supplied turnaround — a slim, long-limbed stylised child of about five heads
 * — that read as a different character wearing the right clothes, and no amount
 * of restyling the hoodie could close the gap.
 *
 * The head is therefore authored at `headR` and RENDERED at `headScale`, so the
 * whole face keeps its own internal tuning while the figure around it grows.
 * Change `headScale` and everything facial follows; change the skeleton below
 * and the body does.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * WHAT DOES NOT WORK, learned the expensive way and worth not relearning:
 *
 *   · A sphere cap for hair. Its rim is a horizontal circle, and a horizontal
 *     line across a face is never right. See the note in `Hair`.
 *   · Extra spheres in the SAME material to suggest cheeks, a chin or a jaw.
 *     They do not blend, they intersect, and the intersection is a hard crease
 *     that reads as a modelling error. Shape the one mesh instead.
 *   · Placing anything that must touch the head by picking x, y and z. Above
 *     the brow the skull falls away fast, so a part that sits on the skin at
 *     its bottom edge is in mid-air at its top. Solve for the surface.
 *   · Cap shells parked "out of the way" that are wider than the angle they are
 *     parked at. The rim comes back round and draws a line where nothing should
 *     be. See LID_CAP.
 *
 * WARDROBE follows the character turnaround supplied by the client: royal blue
 * hoodie carrying the BrainLIT mark, near-black slim jeans, white low-top
 * trainers. The reference is a 2D turnaround, not a model — there is no GLB to
 * load and nothing to import. It is a design target, and this file is the
 * implementation of it.
 *
 * PERFORMANCE
 *   · Nineteen materials, created once, shared by every mesh that uses them.
 *   · Every geometry memoised; nothing rebuilt on re-render.
 *   · Hair spikes, bangs, fingers, laces, mark rays and eyelashes are
 *     InstancedMesh.
 *   · 64 draw calls:
 *       head 3 · hair 4 · brows 2 · eyes 12 · ears 4 · nose 1 · mouth 3
 *       neck 1 · hoodie 7 · chest mark 5 · arms + hands 8 · legs 5 · shoes 9
 *     Counted as RENDERED meshes, not source declarations — most parts are
 *     written once and mirrored, which is how a count taken from the source
 *     comes out low.
 *
 * ORIENTATION  Facing +Z, up is +Y, feet at y = 0. Total height 2.0 units.
 */

/* ══════════════════════════════════════════════════════════════ palette ══ */

/**
 * Taken from the character turnaround supplied by the client, not invented:
 * royal blue hoodie with the BrainLIT mark on the chest, near-black slim jeans,
 * plain white low-top trainers, warm brown spiked hair, brown eyes.
 *
 * The hoodie blue sits deliberately close to the brand's own indigo
 * (--color-indigo, #3f5ba6) without being it — the mark on his chest has to
 * read AGAINST the garment, and a logo in brand colours on a brand-coloured
 * hoodie is a logo you cannot see.
 */
const COLORS = {
  hair: "#5C3A21",
  hairShade: "#482C18",
  skin: "#F3C49B",
  skinShade: "#DCA87C",
  hoodie: "#2340C8",
  hoodieShade: "#1A31A0",
  pants: "#1E1E24",
  shoe: "#F7F7F9",
  sole: "#FFFFFF",
  shoeSeam: "#DCDDE3",
  blush: "#F0A183",
  eyeBrown: "#4A2C17",
  pupil: "#140D07",
  white: "#FFFFFF",
  mouth: "#7E3A34",
  tongue: "#D4726A",
  /** The mark: left hemisphere, right hemisphere, base, filament spark. */
  markCyan: "#7ACEEB",
  markViolet: "#A971D8",
  /** Light, not the brand's indigo — the bulb base has to read against a royal
   *  blue hoodie, and indigo on that is one dark shape on another. */
  markBase: "#C3CEEA",
  markSpark: "#FBBF45",
} as const;

type M = {
  skin: THREE.MeshPhysicalMaterial;
  skinShade: THREE.MeshPhysicalMaterial;
  hair: THREE.MeshPhysicalMaterial;
  hoodie: THREE.MeshPhysicalMaterial;
  hoodieShade: THREE.MeshPhysicalMaterial;
  pants: THREE.MeshPhysicalMaterial;
  shoe: THREE.MeshPhysicalMaterial;
  sole: THREE.MeshPhysicalMaterial;
  shoeSeam: THREE.MeshPhysicalMaterial;
  sclera: THREE.MeshPhysicalMaterial;
  iris: THREE.MeshPhysicalMaterial;
  pupil: THREE.MeshPhysicalMaterial;
  gloss: THREE.MeshPhysicalMaterial;
  mouth: THREE.MeshPhysicalMaterial;
  tongue: THREE.MeshPhysicalMaterial;
  markCyan: THREE.MeshPhysicalMaterial;
  markViolet: THREE.MeshPhysicalMaterial;
  markBase: THREE.MeshPhysicalMaterial;
  markSpark: THREE.MeshPhysicalMaterial;
  blush: THREE.MeshBasicMaterial;
};

/* ════════════════════════════════════════════════════════════ skeleton ══ */

const H = {
  total: 2.0,
  /** Sole to the top of the trainer. */
  shoeTop: 0.115,
  /** Hip line, where the legs meet. */
  legTop: 0.8,
  /** Bottom of the hoodie. */
  hemY: 0.86,
  /** Shoulder line. */
  torsoTop: 1.39,
  /** Under the chin. */
  neckTop: 1.435,
  /** Skull centre. */
  head: 1.616,
  /**
   * Skull radius AS AUTHORED. Every facial measurement in this file is written
   * against this number and none of them should be touched to resize the head.
   */
  headR: 0.32,
  /**
   * What the head actually renders at.
   *
   * 0.56 puts the skull at 18% of total height and the chin at 71.7%, both
   * straight off the turnaround. The face was tuned at full size, where its
   * mistakes were visible; shrinking it at the last moment keeps that tuning
   * and costs nothing.
   */
  headScale: 0.56,
} as const;

/* ══════════════════════════════════════════════════════════════ parts ═══ */

type P = { m: M };

/**
 * Where the hair stops on the forehead, in head-local Y.
 *
 * Everything about the face is downstream of this one number. The brows sit at
 * BROW_Y and the eyes are centred near y = 0.035, so any hair reaching below
 * about 0.22 starts eating the face — which is exactly what the previous build
 * did, and it is the single reason he looked like he was crying.
 */
const HAIRLINE_Y = 0.215;
const BROW_Y = 0.163;

function Hair({ m, swayRef }: P & { swayRef: RefObject<THREE.Group | null> }) {
  /**
   * Hair is 54% of the head's height and wider than the skull.
   *
   * ───────────────────────────────────────────────────────────────────────────
   * THE HAIRLINE IS THE WHOLE THING, AND IT IS NOT A HORIZONTAL CIRCLE.
   *
   * A sphere cap — SphereGeometry with a `thetaLength` — ends in a flat ring at
   * one constant height. That is what this used to be, cut a little past the
   * equator, and the result was a dark band ruled straight across the middle of
   * both eyes: brows swallowed entirely, the top two thirds of each eyeball
   * behind hair, and the iris showing underneath as a blue smear. At hero size
   * it read as tears.
   *
   * Real hair sits LOW at the sides and back and HIGH across the forehead. That
   * needs two surfaces, not one:
   *
   *   · SHELL — a sphere with an azimuthal wedge cut out of the front
   *     (`phiStart`/`phiLength`). It covers the nape, the back of the skull and
   *     down past the ears, and simply is not there where the face is.
   *   · CAP — a shallow crown closing the top, stopping at HAIRLINE_Y.
   *
   * The two overlap over the crown, so there is no gap; where they part company
   * at the temples the fringe covers the join.
   * ───────────────────────────────────────────────────────────────────────────
   *
   * In three's SphereGeometry the front of the head (+Z) is at phi = π/2, so the
   * kept range starts a little past the front on one side and wraps round to a
   * little before it on the other.
   */
  const shell = useMemo(
    () =>
      new THREE.SphereGeometry(
        H.headR * 1.04,
        36,
        24,
        // Front-centre + 47°, running 266° round the back. Widen the cut and
        // the sides thin to two dark strips at the very edge of the silhouette;
        // narrow it and the hair starts creeping over the outer eye corner.
        Math.PI * 0.761,
        Math.PI * 1.478,
        0,
        // Stops level with the ear. He is rendered in three-quarter in the
        // cinematic (see BOY_FACING), where the cut edge in front of the ear is
        // a straight vertical line — at 0.6π that line ran all the way to the
        // jaw and read as a helmet strap rather than a haircut.
        Math.PI * 0.56,
      ),
    [],
  );

  /** Crown, closing the top. Ends at the hairline. */
  const cap = useMemo(() => {
    const r = H.headR * 1.055;
    // acos(HAIRLINE_Y / r) as a fraction of π — the polar angle whose ring sits
    // exactly on the hairline, so the number above stays the source of truth.
    const theta = Math.acos(Math.min(1, HAIRLINE_Y / r));
    return new THREE.SphereGeometry(r, 36, 20, 0, Math.PI * 2, 0, theta);
  }, []);

  /**
   * Bangs: seven lobes threaded ALONG the hairline, instanced.
   *
   * This was one big flattened sphere over the forehead, and a big sphere
   * cannot follow a small one — the head curves away sharply above the brow, so
   * whatever height made it sit on the skin at the bottom left it hanging in
   * mid-air at the top. It rendered as a dark slab laid across his forehead
   * like a croissant.
   *
   * Each lobe is placed by SOLVING for the skull surface at its own height and
   * azimuth instead of being eyeballed in Cartesian space, so every one of them
   * touches. Varying how far each hangs is what turns the cap's rim — a perfect
   * circle — into an uneven edge, which is the only thing separating hair from
   * a swimming cap.
   */
  const bangs = useMemo(() => {
    const g = new THREE.SphereGeometry(1, 14, 10);
    const mesh = new THREE.InstancedMesh(g, undefined, 7);
    const dummy = new THREE.Object3D();

    /** Azimuth from dead ahead, how far the lobe hangs, its size. */
    const lobes: Array<[number, number, number]> = [
      [-0.9, 0.0, 0.05],
      [-0.62, 0.014, 0.056],
      [-0.32, 0.004, 0.052],
      [-0.03, 0.018, 0.058],
      [0.28, 0.002, 0.053],
      [0.58, 0.016, 0.055],
      [0.88, 0.0, 0.05],
    ];

    // Just inside the skull, so each lobe protrudes by rather less than its own
    // radius rather than sitting on the head like a bobble.
    const R = H.headR * 0.965;

    lobes.forEach(([azimuth, drop, r], i) => {
      const y = HAIRLINE_Y + 0.012 - drop;
      // Radius of the circle of latitude at this height.
      const ring = Math.sqrt(Math.max(0.0001, R * R - y * y));

      dummy.position.set(
        ring * Math.sin(azimuth),
        y,
        // 0.94 matches the skull's front-to-back squash.
        ring * Math.cos(azimuth) * 0.94,
      );
      dummy.rotation.set(0, azimuth, 0);
      dummy.scale.set(r * 1.55, r * 0.72, r * 0.8);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, []);

  /**
   * Spikes, instanced.
   *
   * Eleven strands as individual meshes would be eleven draw calls for
   * something the eye reads as one shape. Instanced it is one, and the strands
   * can still be individually placed and angled — they all lean back, which is
   * what makes the hair read as styled rather than electrocuted.
   *
   * SHORTER AND FATTER than the first pass, where they were half a unit long on
   * a head 0.32 across — longer than the skull's radius, radiating in every
   * direction. That is not spiky hair, it is a sea urchin, and it was most of
   * what made the silhouette read as unkempt at hero size.
   */
  const spikes = useMemo(() => {
    /**
     * Scattered over the crown by SPHERICAL COORDINATES, not by hand.
     *
     * Eleven hand-placed strands is the wrong tool for this. The turnaround's
     * hair is a dense mop — dozens of overlapping tufts filling a mass half as
     * tall again as the skull — and what reads as hair is the DENSITY, not the
     * individual spike. Eleven of anything spread over a whole head reads as
     * eleven of something.
     *
     * Deterministic: a golden-angle spiral, no randomness, so the character is
     * identical on every render and between server and client.
     */
    const GOLDEN = Math.PI * (3 - Math.sqrt(5));
    const CANDIDATES = 42;
    const R = H.headR * 0.9;

    const up = new THREE.Vector3(0, 1, 0);
    const back = new THREE.Vector3(0, 0.24, -1).normalize();
    const site = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const dummy = new THREE.Object3D();

    /**
     * MATRICES FIRST, mesh second.
     *
     * An InstancedMesh starts with every matrix at IDENTITY, and a cone with an
     * identity matrix is radius 1 — three times the width of the whole head.
     * Allocating the mesh up front and then skipping the tufts that land on his
     * face left those instances unwritten, and what rendered was a giant brown
     * lampshade. Never allocate before the count is known.
     */
    const matrices: THREE.Matrix4[] = [];

    for (let i = 0; i < CANDIDATES; i++) {
      const t = i / (CANDIDATES - 1);
      // Spiralling out from the crown towards the hairline.
      const polar = 0.1 + t * 1.05;
      const azimuth = i * GOLDEN;

      site.set(
        Math.sin(polar) * Math.sin(azimuth),
        Math.cos(polar),
        Math.sin(polar) * Math.cos(azimuth),
      );

      // Anything low on the front of the head is his face, not his hair.
      if (site.z > 0.2 && site.y < 0.62) continue;

      // Longest on top, shorter towards the sides, so the mass has a shape.
      const len = 0.36 - t * 0.14;

      // Out along its own normal, then leaned back — which is what makes the
      // style read as swept up and back rather than as a hedgehog.
      dir.copy(site).addScaledVector(back, 0.42).normalize();

      dummy.position.copy(site).multiplyScalar(R).addScaledVector(dir, len * 0.34);
      dummy.quaternion.setFromUnitVectors(up, dir);
      dummy.scale.set(0.075, len, 0.075);
      dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());
    }

    const g = new THREE.ConeGeometry(1, 1, 6);
    const mesh = new THREE.InstancedMesh(g, undefined, matrices.length);
    matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, []);

  return (
    <group ref={swayRef}>
      <mesh geometry={shell} material={m.hair} position={[0, 0.015, -0.02]} scale={[1.02, 1, 1.0]} />
      <mesh geometry={cap} material={m.hair} position={[0, 0.01, -0.01]} scale={[1.02, 1, 1.01]} />
      <primitive object={bangs} material={m.hair} />
      <primitive object={spikes} material={m.hair} />
    </group>
  );
}

function Eyebrows({ m }: P) {
  /**
   * Thick, dark, and raised at the inner end.
   *
   * That inner lift is the entire expression. Level brows read as blank; lifted
   * inner ends read as the slightly worried, thoughtful look the reference has,
   * and it is two numbers.
   */
  const brow = useMemo(() => new THREE.CapsuleGeometry(0.017, 0.078, 8, 14), []);

  return (
    <>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          geometry={brow}
          material={m.hair}
          // Sits between the top of the eye and the hairline, and has to clear
          // BOTH.
          //
          // Too low and it merges with the lash line into one heavy dark band
          // across the face. Too high and the hair eats it, which is what used
          // to happen: at 0.205 it was inside the hair shell entirely and only
          // its outer tips showed, as two brown slivers by the temples.
          // Half-sunk into the skull rather than resting on it. Only the front
          // of the capsule shows, which reads as a brow drawn on a face; proud
          // of the surface it reads as a bar stuck to one.
          position={[s * 0.138, BROW_Y, 0.248]}
          rotation={[Math.PI / 2, 0, s * (Math.PI / 2 - 0.26)]}
          scale={[1, 1, 0.55]}
        />
      ))}
    </>
  );
}

/**
 * The eyelid, as three numbers.
 *
 * A shell cap has a rim, and wherever that rim crosses the open eye it draws a
 * line. The previous values put a 99° cap pointing down-and-back, which sounds
 * like "out of the way" and was not: a cap that wide reaches most of the way
 * round the eyeball, and its rim came back over the front, printing a jagged
 * brown crack under each eye in every frame he was not blinking.
 *
 * So the cap is narrower than the angle it is parked at. Open, its pole points
 * up and back, far enough that neither the rim nor the shell touches the front
 * of the eye or the lash line above it. Shut, the pole swings to dead ahead and
 * the cap covers the eye completely.
 */
const LID_CAP = Math.PI * 0.34;
const LID_OPEN = -Math.PI * 0.42;
const LID_SHUT = Math.PI * 0.5;

function Eyes({
  m,
  lidRef,
  gazeRef,
}: P & {
  lidRef: RefObject<THREE.Group | null>;
  gazeRef: RefObject<THREE.Group | null>;
}) {
  /**
   * Very large — each eye is about a third of the head's width — and slightly
   * protruding, which is what gives a chibi face its glassy, wet look.
   */
  const sclera = useMemo(() => new THREE.SphereGeometry(0.096, 30, 24), []);
  const iris = useMemo(() => new THREE.SphereGeometry(0.062, 26, 20), []);
  const pupil = useMemo(() => new THREE.SphereGeometry(0.031, 20, 16), []);
  /**
   * Catchlight. A THIRD of its former size: at 0.02 on an iris of 0.062 it was
   * a white ball parked on the eye rather than a glint in it, and it read as a
   * cataract.
   */
  const spec = useMemo(() => new THREE.SphereGeometry(0.0135, 14, 12), []);

  /**
   * Upper lid, in skin. A hemisphere shell slightly larger than the eyeball, so
   * it sweeps down over it rather than intersecting it.
   *
   * Blinking by squashing the eyeball is the easy way and it looks wrong: the
   * iris squashes with it. A lid closing over an undeformed eye is what
   * actually happens and what reads correctly.
   */
  const lid = useMemo(
    () =>
      new THREE.SphereGeometry(0.112, 26, 18, 0, Math.PI * 2, 0, LID_CAP),
    [],
  );

  /**
   * Lash line: a THIN dark arc giving the eye a top edge.
   *
   * Was a 75° cap, which covered nearly half the eyeball and, sitting directly
   * under an over-low brow, turned the upper face into a solid dark mass. A
   * lash line should be a line.
   *
   * Narrowed again, to 25°. At 43° it was still a thick dark crescent sitting
   * an inch under the eyebrow, so the face carried TWO heavy dark bars over
   * each eye and the eyebrow stopped being the thing that gives him an
   * expression.
   */
  const lash = useMemo(
    () =>
      new THREE.SphereGeometry(0.1, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.14),
    [],
  );

  return (
    <>
      {[-1, 1].map((s) => (
        // z=0.216, not 0.235. They protruded a centimetre past the face
        // silhouette, which reads as bulging rather than as the intended
        // slight proud-set.
        // Yawed outward to follow the curve of the face. Both eyeballs pointing
        // dead ahead from a rounded head is what makes a cartoon face look
        // faintly cross-eyed — the whites bunch up on the inner side.
        <group key={s} position={[s * 0.132, 0.035, 0.216]} rotation={[0, s * 0.14, 0]}>
          <mesh geometry={sclera} material={m.sclera} scale={[1, 1.06, 0.7]} />

          {/* Iris, pupil and highlight ride the gaze group so they can look
              around inside the sclera without the eyeball moving. */}
          <group ref={s === -1 ? gazeRef : undefined}>
            <mesh geometry={iris} material={m.iris} position={[0, 0, 0.052]} scale={[1, 1, 0.46]} />
            <mesh geometry={pupil} material={m.pupil} position={[0, 0, 0.072]} scale={[1, 1, 0.42]} />
            <mesh
              geometry={spec}
              material={m.gloss}
              position={[-0.03, 0.036, 0.09]}
              scale={[1, 1, 0.5]}
            />
          </group>

          <mesh geometry={lash} material={m.hair} position={[0, 0.004, 0]} scale={[1, 1.02, 0.74]} />

          {/* One ref drives both lids; they blink together by definition. */}
          <group ref={s === -1 ? lidRef : undefined} rotation={[LID_OPEN, 0, 0]}>
            <mesh geometry={lid} material={m.skin} scale={[1, 1, 0.76]} />
          </group>
        </group>
      ))}
    </>
  );
}

function Ears({ m }: P) {
  const ear = useMemo(() => new THREE.SphereGeometry(0.078, 20, 16), []);
  const inner = useMemo(() => new THREE.SphereGeometry(0.045, 16, 12), []);

  return (
    <>
      {/* Set LOW and slightly forward, so they clear the hair.
          The turnaround has prominent ears; with the hair shell reaching the
          ear line they were covered entirely, and a chibi head with no ears
          reads as a helmet. */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * H.headR * 0.965, -0.062, 0.005]}>
          <mesh geometry={ear} material={m.skin} scale={[0.45, 1.15, 0.82]} />
          <mesh
            geometry={inner}
            material={m.skinShade}
            position={[s * 0.018, 0, 0.012]}
            scale={[0.4, 1, 0.7]}
          />
        </group>
      ))}
    </>
  );
}

function Nose({ m }: P) {
  /**
   * Skin-SHADE, not skin.
   *
   * A skin-coloured nose on a skin-coloured face is invisible without a shadow
   * to define it, and at this size and lighting there is no shadow. A half-tone
   * darker is what a cel painter would do and it costs nothing.
   */
  const nose = useMemo(() => new THREE.SphereGeometry(0.032, 18, 14), []);
  return (
    <mesh
      geometry={nose}
      material={m.skinShade}
      position={[0, -0.055, 0.285]}
      scale={[1, 0.82, 0.75]}
    />
  );
}

function Mouth({ m }: P) {
  /**
   * A smile, as an arc of torus.
   *
   * It was a flattened dark ellipse, which at any size above thumbnail is a
   * maroon smear in the middle of the face — no lips, no expression, and on a
   * page selling a children's programme, a child who looks unhappy.
   *
   * An arc costs the same one draw call. The tube is thin, the sweep is short,
   * and the ends tuck under the cheeks because the face curves away from a flat
   * ring — which is what makes it read as drawn on rather than stuck on.
   */
  /**
   * OPEN, per the turnaround, where it was a closed line.
   *
   * ───────────────────────────────────────────────────────────────────────────
   * BUILT FROM PATCHES OF THE SKULL'S OWN SPHERE, exactly like the blush, and
   * for exactly the same reason.
   *
   * The obvious build — a squashed sphere for the cavity with a teeth shell in
   * front — cannot be placed. Above the mouth the face is nearly 0.04 further
   * forward than below it, so any flat-ish shape either sinks its top edge into
   * the chin or floats its bottom edge off it. The first attempt sank, and what
   * survived was a small pink smudge that read as pursed lips.
   *
   * Concentric caps are parallel to the skin everywhere, so the opening lies
   * ON the face at every point of its outline. Stacking radius is what puts
   * teeth in front of the cavity — not z offsets, which do not mean anything on
   * a curved surface.
   * ───────────────────────────────────────────────────────────────────────────
   */
  const patch = (radius: number, half: number) =>
    new THREE.SphereGeometry(radius, 24, 16, 0, Math.PI * 2, 0, half);

  const cavity = useMemo(() => patch(H.headR * 1.002, 0.135), []);
  const teeth = useMemo(() => patch(H.headR * 1.008, 0.128), []);
  const tongue = useMemo(() => patch(H.headR * 1.006, 0.085), []);

  /**
   * Angle of the mouth below straight-ahead, and the tilt that aims a cap's
   * pole there. Everything below is expressed against these two so the mouth
   * moves as one.
   */
  const DROP = 0.4;
  const aim = (extra = 0) => Math.PI / 2 + DROP + extra;

  return (
    <>
      {/* The caps share the skull's squash, which is what keeps them lying on
          the skin rather than cutting through it. */}
      {/* A cap's local Y IS its pole, which is to say its RADIUS. Squashing a
          cap in Y to make it a thin band does not make a band — it shortens the
          radius and posts the whole thing inside the head, which is where the
          teeth went on the first attempt. Local Z is the axis that lies along
          the surface once `aim` has tipped the pole forward, so vertical
          squash is the THIRD component here, never the second. */}
      <group scale={[1, 1.02, 0.94]}>
        <mesh geometry={cavity} material={m.mouth} rotation={[aim(), 0, 0]} scale={[1.5, 1, 0.72]} />
        <mesh
          geometry={tongue}
          material={m.tongue}
          rotation={[aim(0.042), 0, 0]}
          scale={[1.35, 1, 0.6]}
        />
        {/* Upper teeth: a wide, shallow band across the top of the opening. */}
        <mesh
          geometry={teeth}
          material={m.sclera}
          rotation={[aim(-0.045), 0, 0]}
          scale={[1.42, 1, 0.26]}
        />
      </group>
    </>
  );
}

function Head({
  m,
  headRef,
  lidRef,
  gazeRef,
  hairRef,
}: P & {
  headRef: RefObject<THREE.Group | null>;
  lidRef: RefObject<THREE.Group | null>;
  gazeRef: RefObject<THREE.Group | null>;
  hairRef: RefObject<THREE.Group | null>;
}) {
  /**
   * Skull.
   *
   * ONE mesh, slightly flattened front to back and a little heavier below the
   * eyeline. It used to be a sphere plus two cheek spheres plus a chin sphere,
   * all in the same material — and separate spheres in one colour do not blend
   * into a head, they intersect it. Each contributed a visible seam: a hard
   * elliptical crease on each cheek and a pad under the mouth, none of which
   * read as anatomy and all of which read as a modelling mistake.
   *
   * Cheek mass now comes from the scale of the skull itself, which cannot seam
   * against anything because there is nothing to seam against.
   */
  const skull = useMemo(() => new THREE.SphereGeometry(H.headR, 44, 34), []);

  /**
   * Cheek blush: a PATCH OF THE SKULL'S OWN SPHERE, a hair's breadth outside it.
   *
   * A flat disc was the obvious thing and it does not work — a plane laid on a
   * curved surface is half inside it, and what shows is the intersection: two
   * hard crescents, like bites taken out of his cheeks. A cap cut from the same
   * sphere is parallel to the skin everywhere, so it cannot clip.
   *
   * It shares the skull's squash by living under the same scaled group.
   */
  const blush = useMemo(
    () =>
      new THREE.SphereGeometry(
        H.headR * 1.004,
        20,
        14,
        0,
        Math.PI * 2,
        0,
        // Cap half-angle. The patch is centred on the cap's own +Y pole, which
        // the rotations below aim at the cheek.
        0.2,
      ),
    [],
  );

  return (
    <group ref={headRef} position={[0, H.head, 0]} scale={H.headScale}>
      {/* Skull and blush share one squash, which is what keeps the patch lying
          exactly on the skin. */}
      <group scale={[1, 1.02, 0.94]}>
        <mesh geometry={skull} material={m.skin} />
        {[-1, 1].map((s) => (
          // Yaw round to the cheek, then tip the cap's pole forward and down.
          <group key={s} rotation={[0, s * 0.66, 0]}>
            <mesh geometry={blush} material={m.blush} rotation={[Math.PI / 2 + 0.34, 0, 0]} />
          </group>
        ))}
      </group>

      <Hair m={m} swayRef={hairRef} />
      <Eyebrows m={m} />
      <Eyes m={m} lidRef={lidRef} gazeRef={gazeRef} />
      <Ears m={m} />
      <Nose m={m} />
      <Mouth m={m} />
    </group>
  );
}

function Neck({ m }: P) {
  /** Very short and thick — on this build it is barely more than a collar. */
  const neck = useMemo(() => new THREE.CylinderGeometry(0.052, 0.062, 0.09, 22), []);
  return <mesh geometry={neck} material={m.skinShade} position={[0, H.neckTop - 0.035, 0]} />;
}

/**
 * The BrainLIT mark, printed on the chest.
 *
 * It replaces a white cartoon blob with two dots that was legible as nothing at
 * all. This is the actual brand device reduced to the only three things that
 * survive at the size it ships: TWO HEMISPHERES in the brand's cyan and violet,
 * a bulb base beneath them, and the filament spark above.
 *
 * Deliberately NOT a texture of /brainlit-mark.svg. The whole point of this
 * character is that it costs zero transferred bytes, and a fetch plus decode
 * plus an sRGB texture upload to render something twenty pixels across on a
 * phone is a bad trade. Every part here is flattened hard in Z so it reads as
 * PRINTED on the fabric rather than pinned to it.
 */
function ChestMark({ m }: P) {
  const hemisphere = useMemo(() => new THREE.SphereGeometry(0.036, 18, 14), []);
  const base = useMemo(() => new THREE.CylinderGeometry(0.019, 0.026, 0.022, 14), []);
  const spark = useMemo(() => new THREE.SphereGeometry(0.011, 12, 10), []);

  /**
   * The chest is a CYLINDER, so its surface pulls back as x grows.
   *
   * Every piece therefore solves for its own z. Laid on one flat plane the mark
   * either sinks into the middle of the torso or floats off it at the edges,
   * and the first pass did the former: nothing showed but two yellow specks
   * where the outermost rays happened to clear the fabric.
   */
  const CHEST_R = 0.149;
  const surface = (x: number) => Math.sqrt(Math.max(0.0001, CHEST_R * CHEST_R - x * x)) + 0.004;

  /** Rays around the bulb, instanced — the "lit" in BrainLIT. */
  const rays = useMemo(() => {
    const g = new THREE.CapsuleGeometry(1, 1, 4, 6);
    const mesh = new THREE.InstancedMesh(g, undefined, 5);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < 5; i++) {
      // Fanned across the top half only; rays under a bulb make no sense.
      const a = -Math.PI * 0.42 + (i / 4) * Math.PI * 0.84;
      const x = Math.sin(a) * 0.072;
      dummy.position.set(x, 0.04 + Math.cos(a) * 0.058, surface(x));
      dummy.rotation.set(0, 0, -a);
      dummy.scale.set(0.004, 0.0075, 0.004);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, []);

  return (
    <group position={[0, 1.16, 0]}>
      <mesh
        geometry={hemisphere}
        material={m.markCyan}
        position={[-0.026, 0.018, surface(0.026)]}
        scale={[1, 1.12, 0.22]}
      />
      <mesh
        geometry={hemisphere}
        material={m.markViolet}
        position={[0.026, 0.018, surface(0.026)]}
        scale={[1, 1.12, 0.22]}
      />
      <mesh
        geometry={base}
        material={m.markBase}
        position={[0, -0.028, surface(0)]}
        scale={[1, 1, 0.28]}
      />
      <mesh
        geometry={spark}
        material={m.markSpark}
        position={[0, 0.074, surface(0) + 0.002]}
        scale={[1, 1, 0.4]}
      />
      <primitive object={rays} material={m.markSpark} />
    </group>
  );
}

function Torso({ m, breathRef }: P & { breathRef: RefObject<THREE.Group | null> }) {
  /**
   * A HOODIE, per the supplied turnaround, where it was a short-sleeved tee.
   *
   * Four things make a hoodie read as a hoodie rather than as a blue jumper,
   * and all four are in the reference:
   *
   *   1. the HOOD bunched behind the neck — the only one visible in silhouette,
   *      and therefore the one that matters most at hero size;
   *   2. a KANGAROO POCKET across the belly;
   *   3. RIBBING at the hem and the cuffs;
   *   4. LONG SLEEVES (see `Arms`) — the single biggest change, because bare
   *      forearms under a hooded top read as a mistake.
   *
   * Still boxy, not tapered. It hangs almost straight from the shoulders; a
   * tapered body reads as fitted sportswear.
   */
  /**
   * NARROWER than the first pass at these proportions.
   *
   * At radius 0.18 the torso swallowed the arms: the sleeves sat entirely
   * inside the body's silhouette, so he read as a blue barrel with hands
   * appearing at the bottom of it. A hoodie is loose, but the arms have to hang
   * OUTSIDE it or there is no figure, only a shape.
   */
  const body = useMemo(() => new THREE.CylinderGeometry(0.148, 0.156, 0.53, 30), []);
  const shoulders = useMemo(() => new THREE.SphereGeometry(0.155, 28, 20), []);
  const hem = useMemo(() => new THREE.CylinderGeometry(0.158, 0.155, 0.04, 30), []);

  /**
   * The hood, down. A squashed sphere behind the neck plus a rolled collar
   * running round the front — the roll is what stops it reading as a hump.
   */
  const hood = useMemo(() => new THREE.SphereGeometry(0.125, 24, 18), []);
  const collar = useMemo(() => new THREE.TorusGeometry(0.076, 0.022, 12, 26), []);

  /** Kangaroo pocket: a wide shallow shell with its opening edge on top. */
  const pocket = useMemo(() => new THREE.SphereGeometry(0.1, 24, 16), []);
  const pocketLip = useMemo(
    () => new THREE.TorusGeometry(0.082, 0.007, 8, 24, Math.PI * 0.62),
    [],
  );

  const midY = (H.hemY + H.torsoTop) / 2;

  return (
    <group ref={breathRef}>
      <mesh geometry={body} material={m.hoodie} position={[0, midY, 0]} />
      <mesh
        geometry={shoulders}
        material={m.hoodie}
        position={[0, H.torsoTop - 0.03, 0]}
        scale={[1, 0.55, 1]}
      />
      <mesh geometry={hem} material={m.hoodieShade} position={[0, H.hemY, 0]} />

      {/* Hood. Pushed back far enough to clear the jaw — a hood placed by eye
          ends up inside the chin. */}
      <mesh
        geometry={hood}
        material={m.hoodie}
        position={[0, H.torsoTop + 0.01, -0.088]}
        rotation={[-0.32, 0, 0]}
        scale={[1.15, 0.72, 0.9]}
      />
      <mesh
        geometry={collar}
        material={m.hoodieShade}
        position={[0, H.torsoTop + 0.018, -0.008]}
        rotation={[Math.PI / 2 - 0.22, 0, 0]}
      />

      {/* Pocket. It has to stand PROUD of the torso — a pouch flush with the
          body is not a pouch, and placed against the old radius the whole thing
          was inside the cylinder and invisible. */}
      <mesh
        geometry={pocket}
        material={m.hoodieShade}
        position={[0, 0.985, 0.096]}
        scale={[1.2, 0.62, 0.72]}
      />
      <mesh
        geometry={pocketLip}
        material={m.hoodie}
        position={[0, 1.022, 0.106]}
        rotation={[0.16, 0, -Math.PI / 2 - Math.PI * 0.31]}
        scale={[1.12, 0.72, 1]}
      />

      <ChestMark m={m} />
    </group>
  );
}

/**
 * One hand: oversized palm and four instanced fingers.
 *
 * Rendered as a CHILD of its arm rather than as a sibling, which is the one
 * place this departs from the requested flat hierarchy. It has to be: the arm
 * rotates through a throw, and a hand positioned in body space would stay
 * behind while the arm swung away from it. Fingers are instanced per hand for
 * the same reason — one InstancedMesh cannot follow two different parents.
 */
function Hand({ m, side }: P & { side: -1 | 1 }) {
  const palm = useMemo(() => new THREE.SphereGeometry(0.068, 22, 18), []);

  const fingers = useMemo(() => {
    const g = new THREE.CapsuleGeometry(1, 1, 6, 10);
    const mesh = new THREE.InstancedMesh(g, undefined, 4);
    const dummy = new THREE.Object3D();

    /**
     * Fingers CURLED and close together, not splayed.
     *
     * Straight fingers fanned out from a flat palm read as a flipper — at body
     * scale the hands were the one part of him that still looked like leaves
     * stuck on the ends of his arms. A hand at rest is a loose fist, and the
     * curl is what makes it read as a hand rather than a shape.
     */
    for (let k = 0; k < 3; k++) {
      dummy.position.set((k - 1) * 0.028, -0.062, 0.016);
      // Relaxed, not clenched. On the chibi build the hands were a head's width
      // across and a loose fist was the only thing that read; at the
      // turnaround's proportions they are small enough for fingers to show, and
      // the reference hangs them open at his sides.
      dummy.rotation.set(0.42, 0, 0);
      dummy.scale.set(0.017, 0.04, 0.017);
      dummy.updateMatrix();
      mesh.setMatrixAt(k, dummy.matrix);
    }
    // Thumb, set across the palm.
    dummy.position.set(side * -0.044, -0.03, 0.03);
    dummy.rotation.set(0.4, 0, side * 0.95);
    dummy.scale.set(0.019, 0.032, 0.019);
    dummy.updateMatrix();
    mesh.setMatrixAt(3, dummy.matrix);

    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, [side]);

  // Authored at the old scale and simply shrunk, so the finger layout above
  // stays in the proportions it was tuned in.
  return (
    <group position={[0, -0.64, 0.004]} scale={0.62}>
      <mesh geometry={palm} material={m.skin} scale={[0.8, 0.95, 0.78]} />
      <primitive object={fingers} material={m.skin} />
    </group>
  );
}

function Arms({
  m,
  throwArmRef,
  handRef,
}: P & {
  throwArmRef?: RefObject<THREE.Group | null>;
  handRef?: RefObject<THREE.Object3D | null>;
}) {
  /**
   * FULL-LENGTH sleeves, ending in a ribbed cuff at the wrist.
   *
   * It was a short sleeve plus a bare skin forearm, which was right for the tee
   * and is wrong for a hoodie — the reference has cuffs at the wrists and the
   * only skin below the shoulder is the hand.
   *
   * One capsule for the whole arm rather than upper arm plus forearm: there is
   * no elbow to articulate here, and a second capsule only adds a seam that
   * shows every time the throw swings the arm.
   */
  const sleeve = useMemo(() => new THREE.CapsuleGeometry(0.058, 0.52, 8, 18), []);
  const cuff = useMemo(() => new THREE.CylinderGeometry(0.058, 0.05, 0.032, 20), []);

  return (
    <>
      {([-1, 1] as const).map((s) => (
        <group
          key={s}
          // The right arm gets a ref so it can be swung through a throw.
          ref={s === 1 ? throwArmRef : undefined}
          // Hung close to the body and only slightly splayed, per the
          // turnaround. The wide 0.26 angle belonged to the chibi build, where
          // stubby arms had to be pushed out to clear a very wide torso.
          position={[s * 0.152, H.torsoTop - 0.055, 0]}
          rotation={[0.08, 0, s * 0.1]}
        >
          {/* The cuff has to sit at the WRIST, well below the hoodie's hem.
              Landing it level with the hem merged the two cuffs and the hem
              into one continuous horizontal band, which read as a peplum. */}
          <mesh geometry={sleeve} material={m.hoodie} position={[0, -0.268, 0]} />
          <mesh geometry={cuff} material={m.hoodieShade} position={[0, -0.585, 0]} />
          <Hand m={m} side={s} />

          {/* An empty at the fist, for anything the character holds. Rotated a
              quarter turn so that "up" for a held object points out of the
              hand along the forearm's forward axis, which is where a thrown
              object actually leaves from. */}
          {s === 1 && (
            <object3D ref={handRef} position={[0, -0.67, 0.015]} rotation={[-Math.PI / 2, 0, 0]} />
          )}
        </group>
      ))}
    </>
  );
}

function Legs({ m }: P) {
  /**
   * Slim fit, with a soft crease at the knee.
   *
   * The crease is a SHORT arc facing front. It used to be a 198° torus, most of
   * which was nowhere near the front of the leg — the parts that showed were
   * the two ends, sticking out sideways past the trouser as a pair of dark tabs
   * on the outside of each knee. A crease you can see from behind is not a
   * crease.
   */
  /**
   * Long and slim, per the turnaround: hip to trainer is 34% of total height,
   * where the chibi build gave the legs 23% and made him look like a toddler in
   * a hoodie. The capsule spans H.legTop down to the top of the shoe, so both
   * ends move with the skeleton rather than with a hand-tuned number.
   */
  const LEG_SPAN = H.legTop - H.shoeTop;
  const LEG_R = 0.058;
  const leg = useMemo(
    () => new THREE.CapsuleGeometry(LEG_R, LEG_SPAN - LEG_R * 2, 8, 20),
    [LEG_SPAN],
  );
  const hips = useMemo(() => new THREE.SphereGeometry(0.13, 24, 18), []);
  const knee = useMemo(
    () => new THREE.TorusGeometry(0.042, 0.007, 8, 16, Math.PI * 0.5),
    [],
  );

  const legY = (H.legTop + H.shoeTop) / 2;

  return (
    <>
      <mesh geometry={hips} material={m.pants} position={[0, H.legTop - 0.02, 0]} scale={[1, 0.62, 0.92]} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh geometry={leg} material={m.pants} position={[s * 0.072, legY, 0]} />
          <mesh
            geometry={knee}
            material={m.pants}
            // Sunk into the leg, so only the front of the tube breaks the
            // surface. The arc's midpoint is turned to the bottom, which puts
            // the crease under the kneecap where a trouser actually creases.
            position={[s * 0.072, legY + 0.02, 0.028]}
            rotation={[0, 0, -Math.PI * 0.75]}
          />
        </group>
      ))}
    </>
  );
}

/**
 * Where each shoe stands, relative to the body.
 *
 * A CONSTANT because the laces are instanced and therefore cannot live inside
 * the per-shoe group — they are a sibling, and have to add this offset back by
 * hand. Two attempts at placing them failed on exactly that: positions worked
 * out against the shoe's geometry, then written in body space, land 0.018
 * short and end up inside the shoe.
 */
const SHOE = { x: 0.092, z: 0.018 } as const;

/**
 * The whole shoe is authored in its own space and shrunk once, here.
 *
 * The trainer was built for the chibi build, where it had to be enormous or the
 * figure balanced on pins. At the turnaround's proportions it is an ordinary
 * low-top, and re-tuning eight interlocking radii by hand to say so would be
 * eight chances to bury the laces again. One scale factor cannot get the
 * relationships wrong. World x = SHOE.x * SHOE_SCALE, which is what the legs
 * stand at.
 */
const SHOE_SCALE = 0.78;

function Shoes({ m }: P) {
  /**
   * Big cartoon sneakers, layered: sole, upper, rounded toe, tongue, laces.
   *
   * Chunky footwear is most of what stops a chibi figure looking like it is
   * balancing on pins, and the white sole against the grey upper is what gives
   * it a readable silhouette from below.
   */
  const sole = useMemo(() => new THREE.CapsuleGeometry(0.078, 0.11, 8, 20), []);
  const upper = useMemo(() => new THREE.SphereGeometry(0.088, 22, 18), []);
  const toe = useMemo(() => new THREE.SphereGeometry(0.078, 22, 18), []);
  const tongue = useMemo(() => new THREE.BoxGeometry(0.075, 0.055, 0.03), []);

  /**
   * Lace bars, instanced.
   *
   * SHORT. A capsule of radius r and length l is l + 2r long, so the old
   * `scale.y = 0.052` made a bar 0.156 across — wider than the shoe it was
   * lying on. Both ends came out through the sides, and what the eye saw was
   * not laces but six red spikes growing out of his trainers.
   */
  const laces = useMemo(() => {
    const g = new THREE.CapsuleGeometry(1, 1, 5, 8);
    const mesh = new THREE.InstancedMesh(g, undefined, 4);
    const dummy = new THREE.Object3D();
    /**
     * Height up the instep, and how far forward the shoe's surface is there.
     *
     * Short enough to fit ACROSS the shoe, and high enough to clear the ROUNDED
     * TOE as well as the upper. Placing them by the upper alone put them inside
     * the toe cap instead, which is just as invisible as being inside the shoe.
     */
    const bars: Array<[number, number]> = [
      [0.152, 0.074],
      [0.178, 0.064],
    ];
    let i = 0;

    for (const s of [-1, 1]) {
      for (const [y, z] of bars) {
        dummy.position.set(s * SHOE.x, y, z + SHOE.z);
        dummy.rotation.set(0, 0, Math.PI / 2);
        dummy.scale.set(0.0075, 0.019, 0.0075);
        dummy.updateMatrix();
        mesh.setMatrixAt(i++, dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, []);

  return (
    <group scale={SHOE_SCALE}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * SHOE.x, 0, SHOE.z]}>
          <mesh
            geometry={sole}
            material={m.sole}
            position={[0, 0.048, 0.01]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1, 1, 0.52]}
          />
          <mesh geometry={upper} material={m.shoe} position={[0, 0.115, -0.012]} scale={[0.92, 0.82, 1.1]} />
          <mesh geometry={toe} material={m.shoe} position={[0, 0.09, 0.078]} scale={[0.94, 0.72, 0.9]} />
          <mesh geometry={tongue} material={m.shoe} position={[0, 0.162, 0.048]} rotation={[0.35, 0, 0]} />
        </group>
      ))}
      {/* The turnaround's trainers are plain white, so the laces are a shade
          off-white rather than the red they were. On an all-white shoe they are
          the only thing giving the instep an edge. */}
      <primitive object={laces} material={m.shoeSeam} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════ component ══ */

export type CartoonBoyProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  blink?: boolean;
  /** Breathing, sway and bounce. Turn OFF when a parent drives the transform. */
  idle?: boolean;
  /**
   * Optional throw, 0..1, read every frame.
   *
   * A REF rather than a number prop, deliberately. A prop changing sixty times
   * a second re-renders the whole character sixty times a second to animate a
   * value React never reads. The ref is written by whoever owns the timeline
   * and read inside `useFrame`.
   */
  throwRef?: RefObject<number>;
  /** Receives an empty at the right fist, for anything the character holds. */
  handRef?: RefObject<THREE.Object3D | null>;
};

export function CartoonBoy({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  blink = true,
  idle = true,
  throwRef,
  handRef,
}: CartoonBoyProps) {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const breathRef = useRef<THREE.Group>(null);
  const hairRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Group>(null);
  const gazeRef = useRef<THREE.Group>(null);
  const throwArmRef = useRef<THREE.Group>(null);

  /** Seconds until the next blink, and how far through the current one we are. */
  const blinkState = useRef({ next: 1.6, progress: 1 });

  const m = useMemo<M>(() => {
    /**
     * Skin: high roughness, a whisper of clearcoat.
     *
     * The clearcoat is doing the job a subsurface term would — it puts a soft
     * secondary sheen on the cheeks and nose that keeps skin from reading as
     * matte plastic, without the cost of real transmission on a large mesh.
     */
    const skin = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(COLORS.skin),
      roughness: 0.65,
      metalness: 0,
      clearcoat: 0.2,
      clearcoatRoughness: 0.5,
      sheen: 0.35,
      sheenColor: new THREE.Color("#ff9d7a"),
    });

    const cloth = (color: string, rough = 0.7) =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        roughness: rough,
        metalness: 0,
        sheen: 0.25,
      });

    return {
      skin,
      skinShade: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(COLORS.skinShade),
        roughness: 0.68,
        metalness: 0,
        clearcoat: 0.15,
      }),
      hair: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(COLORS.hair),
        roughness: 0.45,
        metalness: 0.05,
        clearcoat: 0.35,
        clearcoatRoughness: 0.4,
      }),
      /**
       * Fleece, not cotton. The hoodie in the reference is a matte, slightly
       * fuzzy garment, so it gets high roughness and a strong sheen — the sheen
       * is what gives brushed fabric its soft edge light, and without it a
       * saturated blue this dark renders as painted plastic.
       */
      hoodie: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(COLORS.hoodie),
        roughness: 0.88,
        metalness: 0,
        sheen: 0.6,
        sheenRoughness: 0.8,
        sheenColor: new THREE.Color("#8fa8ff"),
      }),
      hoodieShade: cloth(COLORS.hoodieShade, 0.9),
      pants: cloth(COLORS.pants, 0.82),
      shoe: cloth(COLORS.shoe, 0.45),
      sole: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(COLORS.sole),
        roughness: 0.5,
        metalness: 0,
        clearcoat: 0.35,
      }),
      shoeSeam: cloth(COLORS.shoeSeam, 0.6),
      sclera: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(COLORS.white),
        roughness: 0.16,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
      }),
      /**
       * The iris, and the only transmissive surface on the character.
       *
       * `transmission` plus `ior` is what makes an eye look wet rather than
       * painted — light refracts through the lens onto the pupil behind it.
       * It costs an extra render pass, which is why the sclera and the pupil
       * are ordinary opaque materials.
       *
       * Brown, per the turnaround. Transmission is lower than it was for the
       * blue: a dark iris scatters far less light than a pale one, and at 0.55
       * the brown washed out to a flat milky tan.
       */
      iris: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(COLORS.eyeBrown),
        transmission: 0.3,
        thickness: 0.06,
        ior: 1.4,
        roughness: 0.05,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        transparent: true,
      }),
      pupil: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(COLORS.pupil),
        roughness: 0.1,
        metalness: 0,
        clearcoat: 1,
      }),
      gloss: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(COLORS.white),
        roughness: 0.02,
        metalness: 0,
        clearcoat: 1,
      }),
      mouth: cloth(COLORS.mouth, 0.6),
      tongue: cloth(COLORS.tongue, 0.5),
      markCyan: cloth(COLORS.markCyan, 0.5),
      markViolet: cloth(COLORS.markViolet, 0.5),
      markBase: cloth(COLORS.markBase, 0.55),
      markSpark: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(COLORS.markSpark),
        roughness: 0.35,
        metalness: 0,
        // The filament is the one part of the mark that is meant to be lit.
        emissive: new THREE.Color(COLORS.markSpark),
        emissiveIntensity: 0.35,
      }),
      /**
       * Blush. Unlit and part-transparent on purpose: it is makeup on the skin,
       * so it must take the skin's shading rather than catching its own
       * highlight, and `depthWrite: false` keeps a disc lying flat on a curved
       * surface from fighting with it.
       */
      blush: new THREE.MeshBasicMaterial({
        color: new THREE.Color(COLORS.blush),
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    };
  }, []);

  // Materials hold compiled GPU programs; React dropping the object does not
  // release them.
  useEffect(() => {
    return () => {
      for (const material of Object.values(m)) material.dispose();
    };
  }, [m]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 1 / 20);

    if (idle) {
      // Breathing: the chest expands, it does not bob. Scaling the torso in Y
      // alone reads as a shrug; widening it slightly is what reads as a breath.
      if (breathRef.current) {
        const b = Math.sin(t * 1.5);
        breathRef.current.scale.set(1 + b * 0.012, 1 + b * 0.008, 1 + b * 0.012);
      }

      // Body bounce, and a head sway on a different period so the two never
      // lock into an obvious loop.
      if (rootRef.current) {
        rootRef.current.position.y = Math.sin(t * 1.5) * 0.008;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.62) * 0.13;
        headRef.current.rotation.z = Math.sin(t * 0.47) * 0.045;
        headRef.current.rotation.x = Math.sin(t * 0.83) * 0.03;
      }

      // Hair lags the head. A fraction of the sway, a beat behind, which is
      // what makes it read as attached rather than welded.
      if (hairRef.current) {
        hairRef.current.rotation.z = Math.sin(t * 0.62 - 0.7) * 0.05;
        hairRef.current.rotation.x = Math.sin(t * 0.83 - 0.5) * 0.03;
      }

      // Eyes drift, and settle. Sharp, small saccades rather than a smooth
      // sweep — real eyes jump between fixations.
      if (gazeRef.current) {
        const look = Math.sin(t * 0.37) + Math.sin(t * 0.91) * 0.4;
        gazeRef.current.position.x = Math.max(-0.022, Math.min(0.022, look * 0.02));
        gazeRef.current.position.y = Math.sin(t * 0.53) * 0.011;
      }
    }

    // Throw, when a timeline is driving one. Overrides the arm's rest pose.
    if (throwRef && throwArmRef.current) {
      const p = Math.max(0, Math.min(1, throwRef.current));
      throwArmRef.current.rotation.x = armAngle(p);
      throwArmRef.current.rotation.z = armSwing(p);
    }

    /**
     * Blink.
     *
     * Driven by a countdown rather than by a sine, because a sinusoidal blink
     * spends most of its time half-closed, which reads as drowsiness. A real
     * blink is shut for a fraction of a second and open the rest of the time.
     */
    if (blink && lidRef.current) {
      const s = blinkState.current;
      s.next -= dt;

      if (s.next <= 0) {
        s.progress = 0;
        // Irregular, so the viewer never anticipates it.
        s.next = 2.4 + Math.sin(t * 12.9) * 1.4 + 1.2;
      }

      if (s.progress < 1) {
        s.progress = Math.min(1, s.progress + dt * 7.5);
        // Down fast, up slower — the shape of a real blink.
        const shut = s.progress < 0.4
          ? s.progress / 0.4
          : 1 - (s.progress - 0.4) / 0.6;
        lidRef.current.rotation.x = LID_OPEN + shut * (LID_SHUT - LID_OPEN);
      } else {
        lidRef.current.rotation.x = LID_OPEN;
      }
    }
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group ref={rootRef}>
        <Head m={m} headRef={headRef} lidRef={lidRef} gazeRef={gazeRef} hairRef={hairRef} />
        <Neck m={m} />
        <Torso m={m} breathRef={breathRef} />
        {/* Hands render inside Arms so they follow a swinging arm — see the
            note on Hand. */}
        <Arms m={m} throwArmRef={throwArmRef} handRef={handRef} />
        <Legs m={m} />
        <Shoes m={m} />
      </group>
    </group>
  );
}

export default CartoonBoy;
