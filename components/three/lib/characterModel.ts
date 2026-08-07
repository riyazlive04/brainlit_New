import { useEffect, useState } from "react";
import * as THREE from "three";

/**
 * The contract between the hero cinematic and the character model file.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DROP `boy.glb` INTO `public/` AND IT IS PICKED UP. Nothing else needs editing.
 *
 * Until the file exists the site is unaffected: the loader fails, the boundary
 * catches it, and the procedural CartoonBoy keeps playing the part. That is not
 * a temporary scaffold — it is the permanent fallback for anyone whose download
 * of the model fails, and it must keep working.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * WHAT THE FILE HAS TO SATISFY
 *
 *   1. GLB (binary glTF), single file, textures embedded.
 *   2. Y up, and the character FACING +Z. glTF's own convention, and what every
 *      exporter produces by default — but image-to-3D services vary, so check.
 *      Facing the wrong way shows up immediately as the back of his head.
 *   3. Any scale and any origin. `fitToHeight` measures the mesh and normalises
 *      it, so a model authored in centimetres, or floating above its own origin,
 *      still lands with its feet on the ground at the right height.
 *   4. To ANIMATE THE THROW, one of:
 *        · an animation clip whose name contains "throw" — preferred, because it
 *          is the artist's own motion. It is SCRUBBED by scroll, never played,
 *          so the clip should read correctly as a still at every frame; or
 *        · a bone for the right upper arm named as in THROW_ARM_NAMES, which the
 *          same swing curve as the procedural boy is applied to.
 *      With neither he simply stands, and the rocket leaves from a fixed point.
 *   5. To have him HOLD the rocket, a bone or node for the right hand named as
 *      in HAND_NAMES. Without it the rocket waits at the release point instead
 *      of riding his hand.
 *
 * Mixamo, Blender's default rig, Character Creator and Ready Player Me naming
 * are all matched below. If the rig uses something else, add it to the lists —
 * matching ignores case, spaces, underscores, dots and colons, so "RightArm",
 * "mixamorig:RightArm" and "right_arm" are all the same string here.
 */

/**
 * Asset facts (URL, Draco flag, tier gate) live in modelAssets.ts, which does
 * NOT import three — so CinematicMount can preload the character without
 * pulling the whole library into the eager bundle. Re-exported so every
 * existing call site keeps working unchanged.
 */
export {
  CHARACTER_MODEL_URL,
  MODEL_USES_DRACO,
  MODEL_TIERS,
} from "./modelAssets";

/**
 * The paper rocket, same arrangement: drop `rocket.glb` into `public/` and it
 * replaces the procedural cone-and-fins in Rocket.tsx.
 *
 * It has ONE extra requirement the character does not. The rocket BURNS — its
 * material is driven from paper through flame to char over shot 4 — so whatever
 * materials the file brings get tinted and made to glow. A baked-in colour map
 * survives that (tint multiplies it), but a model whose colour lives entirely in
 * an emissive texture will not read as burning.
 */
export const ROCKET_MODEL_URL = "/rocket.glb";

/**
 * Rotation that points the model's nose along +Y.
 *
 * The rig aims +Y down the flight curve's tangent and rolls about it, so "which
 * way is forward" has to be settled before the model enters the rig. The file
 * from Tripo3D is a dart lying along Z with the point at −Z — measured, not
 * guessed: its cross-section runs from 0.114 wide at −Z to 0.813 at +Z, so the
 * narrow end is the nose. A quarter turn about X brings −Z up to +Y.
 */
export const ROCKET_MODEL_ORIENTATION: [number, number, number] = [
  Math.PI / 2,
  0,
  0,
];

/**
 * The aeroplane the paper becomes, replacing the procedural CartoonPlane.
 *
 * Same contract again, with one difference worth knowing: Plane.tsx aims the
 * craft's +Z down the flight tangent, and this file's fuselage already lies
 * along Z — so unlike the rocket it needs no axis swap, only possibly a half
 * turn if the nose came out pointing backwards.
 */
export const AEROPLANE_MODEL_URL = "/aeroplane.glb";

/**
 * NO rotation — the export's nose already points +Z, which is the way Plane.tsx
 * flies.
 *
 * This was a half turn, on the guess that the nose was at −Z. It was not: −Z is
 * the TAIL. The give-away is a vertical fin, which is tall and sits on the
 * centreline, and the −Z end carries 0.204 of height near the centreline
 * against the +Z end's 0.145. The result was an aeroplane flying tail-first for
 * the entire fly-past — which is hard to see head-on, and obvious the moment it
 * is watched from the side.
 *
 * A reminder that the cross-section-width test used for the paper rocket does
 * not transfer: a dart is narrow at one end and wide at the other, an aircraft
 * is roughly as wide at the tailplane as at the engine.
 */
export const AEROPLANE_MODEL_ORIENTATION: [number, number, number] = [0, 0, 0];

/**
 * Wingspan in world units.
 *
 * The shot was framed for CartoonPlane, whose ~3-unit span was scaled by 0.3.
 * Matching that number rather than the model's own proportions is what keeps
 * the fly-past composed as it was designed.
 */
export const AEROPLANE_SPAN = 0.9;

/**
 * The propeller that the model does not have.
 *
 * `aeroplane.glb` arrives as a single fused mesh with the propeller welded to
 * the fuselage, so AeroplaneModel builds one and places it over the top. See
 * the block comment there for why. Everything is expressed as a FRACTION of the
 * model's own measured size rather than in absolute units, so a re-export at a
 * different scale does not leave a propeller hanging in front of the nose.
 *
 * RADIUS_FRACTION is of the wingspan. Real single-engine aircraft sit between
 * 0.28 and 0.36 of span; 0.15 here is the radius, so 0.30 of span across.
 *
 * NOSE_REACH is how far past the measured front of the fuselage the disc sits,
 * as a fraction of fuselage length. Small and positive: far enough forward that
 * the fused geometry is behind it, close enough that it still looks attached.
 *
 * NOSE_LIFT is the height of the hub above the model's centre, as a fraction of
 * its height. Zero puts it on the centreline, which is right for most low-wing
 * models and wrong for a high-wing one — TUNE THIS FIRST if the disc looks like
 * it is floating off the chin.
 */
export const PROP_RADIUS_FRACTION = 0.15;
export const PROP_NOSE_REACH = 0.02;
export const PROP_NOSE_LIFT = 0.0;
export const PROP_BLADES = 3;

/**
 * Radians per second. Fast enough that no individual blade is ever readable,
 * which is the point: a propeller you can count the blades on reads as stopped.
 */
export const PROP_SPIN_RATE = 34;

/**
 * How solid the blur disc is.
 *
 * The whole illusion fails in both directions. Too transparent and the dead
 * geometry underneath shows through; too solid and the aircraft has a dinner
 * plate bolted to its nose.
 */
export const PROP_DISC_OPACITY = 0.22;


/**
 * Yaw correction, in radians, applied before BOY_FACING.
 *
 * −90°, because the file Tripo3D produced has him facing +X, not +Z. Nothing is
 * wrong with the model; image-to-3D services orient against the input image's
 * camera rather than any convention, so this is expected and is exactly the
 * "check which way he faces" step in docs/CHARACTER-MODEL.md.
 *
 * Corrected HERE rather than by baking a rotation into the file, so that the
 * composition — BOY_FACING, shared with the procedural boy — stays the one
 * place the character's angle to camera is decided.
 */
export const MODEL_YAW_OFFSET = -Math.PI / 2;

/**
 * Where the rocket sits when the model has no hand bone to parent it to.
 *
 * As FRACTIONS OF HIS HEIGHT, and MEASURED OFF THE MESH rather than judged by
 * eye: the fingertips are the widest point of the figure at hand height, so
 * scanning the vertices in the 30–40% height band for the extreme along the
 * shoulder axis finds them exactly. Eyeballing it from a render put the rocket
 * 0.06 of his height inside his own hip, because a three-quarter view
 * foreshortens the very axis being judged.
 *
 * A static mesh has no wrist to attach to, so this is the best available
 * answer — it is attached to the body, so it still moves with the throw lean,
 * and it is close enough that he reads as holding the rocket rather than
 * magnetising it. Pulled a little inboard of the fingertips and a little
 * forward, so the rocket sits in the grip rather than at the very edge.
 *
 * The Z is NOT free once X is chosen. He is turned away from camera by
 * BOY_FACING, so pushing the point further out along X also pushes it BEHIND
 * him — at the fingertips it ends up a centimetre behind his hip and the rocket
 * simply disappears. Z has to grow with X to keep it in front of the torso.
 *
 * DELETE THIS the day a rigged model arrives. It is a stopgap for an unrigged
 * export, not a design.
 */
export const HAND_FALLBACK = { x: -0.2, y: 0.334, z: 0.155 } as const;

/* ═══════════════════════════════════════════════════════════ availability ══ */

/**
 * Is the model actually there?
 *
 * ASKED BEFORE LOADING, rather than letting the loader throw and catching it.
 * Both end up rendering the procedural boy, so this is not about correctness —
 * it is about the difference between "no model configured yet" and "something
 * is broken", which a caught exception cannot express. Letting `useGLTF` 404
 * put a red error badge on the dev overlay on every single page load for as
 * long as the file was missing, which trains everyone to ignore it.
 *
 * The cost is one HEAD request, headers only, fired after the scene is already
 * mounted and while the procedural boy is on screen. The error boundary in
 * Boy.tsx stays as the second line of defence, for a file that exists but is
 * corrupt — a case this cannot detect and must not try to.
 *
 * Cached at module scope: the answer cannot change within a page life, and a
 * StrictMode double-mount must not double-request.
 */
type Availability = "probing" | "present" | "absent";

const probeCache = new Map<string, Promise<boolean>>();

function probe(url: string): Promise<boolean> {
  const cached = probeCache.get(url);
  if (cached) return cached;

  const request = fetch(url, { method: "HEAD" })
    .then((response) => response.ok)
    // Offline, blocked, or served by something that refuses HEAD. Treat every
    // one of them as absent; the fallback is a complete character, not a
    // degraded one, so there is nothing to be gained by trying harder.
    .catch(() => false);

  probeCache.set(url, request);
  return request;
}

export function useModelAvailable(url: string): Availability {
  const [state, setState] = useState<Availability>("probing");

  useEffect(() => {
    let live = true;
    probe(url).then((ok) => {
      if (live) setState(ok ? "present" : "absent");
    });
    return () => {
      live = false;
    };
  }, [url]);

  return state;
}

/* ══════════════════════════════════════════════════════════════════ rig ══ */

/**
 * Which way the shoulder swings, and how much of the throw it can take.
 *
 * AXIS: a bone rotates about whatever axis the rig was built along, and that is
 * not a convention — it is whatever the exporter did. This model's shoulders lie
 * on Z, so a throw rotates about Z; rotating about X would swing the arm out
 * sideways like a bird's wing.
 *
 * SCALE: `armAngle` describes a real throw, sweeping about 220 degrees from the
 * top of the wind-up to the end of the follow-through. No single joint with
 * linear blend skinning survives that — past roughly 60 degrees the shoulder
 * collapses in on itself and the sleeve tears away from the chest.
 *
 * This was 0.42 while the limits below were a hard clamp, chosen so the swing
 * never reached them. It does not have to be that cautious now that `softLimit`
 * bends the ends of the curve instead of cutting them: the scale can be set for
 * how the MIDDLE of the throw reads, and the limiter takes care of the extremes.
 * 0.55 gives a visibly faster whip through the release without ever presenting
 * the skinning with an angle it cannot hold.
 */
export const THROW_AXIS: [number, number, number] = [0, 0, 1];
export const THROW_SCALE = 0.55;

/**
 * Limits on the swing, as MAGNITUDES, and asymmetric on purpose.
 *
 * NOTE — these changed sign. They were `{ back: 0.8, forward: -0.3 }`, a pair
 * of bounds fed to Math.min/Math.max. They are now both positive because
 * `softLimit` takes a magnitude and preserves the sign of what it is given.
 * Anything reading THROW_LIMIT.forward expecting a negative number is wrong.
 *
 * Measured by rendering both ends. Backwards, the arm swings away from the body
 * into open space and holds its shape to about 45 degrees. Forwards it collapses
 * INTO the torso, where the feathered vertices belong to both the arm and the
 * chest at once, and linear blend skinning resolves that by stretching the limb
 * into a thin rod — visible at 45° as the forearm pulling out from under the
 * hoodie like a stick.
 *
 * So the wind-up gets room and the follow-through is cut short. Both are a
 * little wider than they were, because an asymptotic approach spends far less
 * time near the limit than a clamp spends sitting on it. That is the honest
 * ceiling for weights inferred from geometry on a mesh whose arms are fused to
 * its body. A rig with an elbow and painted weights has no such limit.
 */
export const THROW_LIMIT = { back: 0.82, forward: 0.36 } as const;

/**
 * The arm's SECOND axis, and why one is not enough.
 *
 * Rotation about a single axis is the tell that separates a rigged throw from a
 * puppet: the arm sweeps a perfect plane, the silhouette never changes shape,
 * and the eye reads a hinge. `armSwing` already describes the outward drift
 * that fixes it — the procedural boy has used it since the beginning — and
 * there is no reason the loaded model cannot have the same thing.
 *
 * Small on purpose. This is the axis that pulls the upper arm away from the rib
 * cage, which is exactly where the auto-generated weights are most confused
 * about which vertices belong to which bone, so it gets a tight limit and a
 * scale that keeps it under ten degrees at the peak. It is not meant to be
 * noticed on its own.
 */
export const THROW_DRIFT_AXIS: [number, number, number] = [1, 0, 0];
export const THROW_DRIFT_SCALE = 0.3;
export const THROW_DRIFT_LIMIT = 0.22;

/** Right upper arm, for the fallback swing. */
export const THROW_ARM_NAMES = [
  "mixamorig:RightArm",
  "RightArm",
  "arm_r",
  "arm.R",
  "upperarm_r",
  "UpperArm.R",
  "Right_Arm",
  "shoulder_r",
  "RightShoulder",
] as const;

/** Right hand, which the rocket is parented to. */
export const HAND_NAMES = [
  "mixamorig:RightHand",
  "RightHand",
  "hand_r",
  "hand.R",
  "Right_Hand",
  "wrist_r",
] as const;

/** Case, separators and rig prefixes are noise when matching node names. */
function normalise(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * First node in the tree whose name matches any candidate.
 *
 * Returns null rather than throwing. Every caller has something sensible to do
 * without the node, and a missing bone must never be the reason the hero fails
 * to render.
 */
export function findNode(
  root: THREE.Object3D,
  candidates: readonly string[],
): THREE.Object3D | null {
  const wanted = new Set(candidates.map(normalise));
  let found: THREE.Object3D | null = null;

  root.traverse((node) => {
    if (found || !node.name) return;
    if (wanted.has(normalise(node.name))) found = node;
  });

  return found;
}

/**
 * How to place an arbitrary model so it stands the right height, on the ground,
 * centred over its own feet.
 *
 * Returns numbers rather than mutating, because the transform has to be applied
 * as TWO nested groups: the offset inside, the scale outside. Doing both to one
 * object — which is the obvious way, and what the sample viewer in the client's
 * zip does — scales the offset as well, so the model lands a fraction of its
 * own height off the floor and the error grows with how wrong its export scale
 * was.
 */
export type ModelFit = {
  /** Uniform scale to reach the target height. */
  scale: number;
  /** Applied INSIDE the scaled group, in the model's own units. */
  offset: THREE.Vector3;
};

export function fitToHeight(
  object: THREE.Object3D,
  targetHeight: number,
): ModelFit {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());

  return {
    // Guarded: a model that failed to load its meshes measures zero, and
    // dividing by it puts an Infinity into the scene graph, which silently
    // corrupts every matrix downstream of it.
    scale: size.y > 1e-4 ? targetHeight / size.y : 1,
    offset: new THREE.Vector3(-centre.x, -box.min.y, -centre.z),
  };
}
