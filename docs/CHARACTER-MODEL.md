# The models

The hero cinematic uses three loaded models, on identical terms:

| File | Replaces | Fallback if missing |
|---|---|---|
| `public/boy.glb` | the character | `components/three/CartoonBoy.tsx` |
| `public/rocket.glb` | the paper rocket | the cone-and-fins in `Rocket.tsx` |
| `public/aeroplane.glb` | the aircraft it becomes | `components/three/CartoonPlane.tsx` |

**Drop any of them in and it is picked up on the next page load — no code
change.** Every fallback is permanent, not scaffolding: they cover the download
window, a failed or corrupt download, and (for the boy) low-tier devices.

The rocket has one requirement the character does not. It **burns** — shot 4
drives it from paper through flame to char — so `Rocket.tsx` collects every
material in the file and tints them together. A colour map survives that, since
the tint multiplies it. A model whose colour lives entirely in an emissive
texture will not read as burning.

---

## Current models, and what they still need

All three came from **Tripo3D** and all three arrived at ~42 MB, in every case
because of **~1.45 million triangles** — not the textures, which are under
0.5 MB per model. After the pipeline below:

| | before | after | ratio |
|---|---|---|---|
| `boy.glb` | 41.3 MB, 1,426,309 tris | **995 KB** | 0.045 |
| `rocket.glb` | 41.8 MB, 1,463,390 tris | **575 KB** | 0.03 |
| `aeroplane.glb` | 43.1 MB, 1,485,218 tris | **1.01 MB** | 0.035 |

All are visually identical at the size they ship at. Repeat this for any new
model:

```bash
npx @gltf-transform/cli weld     in.glb  a.glb
npx @gltf-transform/cli simplify a.glb   b.glb --ratio 0.045 --error 0.0015
npx @gltf-transform/cli meshopt  b.glb   public/boy.glb
```

Meshopt, not Draco, deliberately — see the note on compression below. Ratios
differ by subject: a face carries detail a folded sheet does not.

### Known issues with the current files

**None of the three has a rig.** One node, one mesh, no skeleton, no clips.
For the rocket and the aeroplane that costs nothing — they are rigid bodies and
the code flies them. For the boy:

- The throw does not articulate. `bodyLean` in `lib/throwPose.ts` leans his
  whole body through the wind-up and follow-through instead. It is a stopgap and
  reads as one; the eye accepts a weight shift far better than a statue, but it
  is not a throw.
- There is no wrist to hold the rocket. `HAND_FALLBACK` in
  `lib/characterModel.ts` pins it to a measured point on his body.

**To fix both, the model needs rigging.** The cheapest route is
[Mixamo](https://www.mixamo.com) — upload the GLB (or an FBX/OBJ of it), let it
auto-rig, and download with a throwing animation. It names bones
`mixamorig:RightArm` / `mixamorig:RightHand`, which is exactly what this code
already looks for, so a rigged export drops in and both the arm swing and the
held rocket start working with no code change. Delete `HAND_FALLBACK` and
`bodyLean` at that point.

---

## What to hand to a modeller or an image-to-3D service

The source artwork is the client's turnaround, `boy_turnaround_reference.png`
(front, side, back, three-quarter). That is a 2D reference — it cannot be loaded
as a character. Someone has to produce the model from it, either by hand in
Blender / Maya / Cinema 4D / Character Creator, or by running the turnaround
through an image-to-3D service.

### Required

| | |
|---|---|
| **Format** | `.glb` — binary glTF, single file, textures embedded |
| **Up axis** | +Y |
| **Facing** | +Z. Getting this wrong shows as the back of his head in shot 1 |
| **Scale / origin** | Anything. The code measures the mesh and normalises it |

Any export scale and any origin are fine — a model authored in centimetres, or
floating above its own origin, still lands with its feet on the ground at the
right height. Do not spend time "fixing" that by hand.

### Strongly wanted

**A throwing animation clip**, with `throw` somewhere in its name.

Note how it is used: the clip is **scrubbed by scroll position, never played**.
The visitor controls the playhead by scrolling, and can go backwards. So it must
read correctly as a still frame at *every* point, and it must not rely on
momentum or overshoot that only works at a particular speed.

Without a clip, the code swings a bone called one of `RightArm`,
`mixamorig:RightArm`, `arm_r`, `arm.R`, `upperarm_r`, `UpperArm.R`, `Right_Arm`,
`shoulder_r` or `RightShoulder` on its own curve — a decent throw, but not the
artist's.

**A right-hand bone or node**, named one of `RightHand`, `mixamorig:RightHand`,
`hand_r`, `hand.R`, `Right_Hand`, `wrist_r`. The paper rocket is parented to it
and rides his hand until he lets go. Without it, the rocket waits in mid-air at
the release point.

Name matching ignores case, spaces, underscores, dots and colons, so
`RightArm`, `mixamorig:RightArm` and `right_arm` are all the same. If the rig
uses something else entirely, add it to `THROW_ARM_NAMES` / `HAND_NAMES` in
`components/three/lib/characterModel.ts` — that is a one-line change.

### Budget

This is a marketing page, and a large share of its traffic is on Indian mobile
data. **Aim for under ~1.5 MB.** The previous model was 810 KB and was removed
partly on that basis. Keep textures at 1K or less; he is never more than about a
sixth of the screen.

Do **not** Draco-compress unless you have to. drei fetches the Draco decoder
from a Google CDN, and a hero that cannot render until a third-party script
arrives breaks whenever that CDN is blocked. If it must be compressed, set
`MODEL_USES_DRACO = true` in `characterModel.ts` **and** host the decoder
locally.

---

## After the file lands

Two things to check, both of which need eyes rather than a test:

1. **Which way he faces.** Open `/lab/cinematic?p=0.05`.
2. **How the rocket sits in his hand.** If it is held sideways or through his
   palm, adjust `HAND_EMPTY_ROTATION` in `components/three/BoyModel.tsx`. Every
   exporter has its own idea of which way a hand bone points, so expect to touch
   this once.

`/lab/cinematic` scrubs the whole sequence to any frame, which is the fastest
way to check both.

## What is already handled

- Fit: measured and scaled to `BOY_HEIGHT`, centred over its own feet, stood on
  the ground.
- Placement and facing: `BOY_FEET` and `BOY_FACING` in `lib/flightPath.ts`,
  shared with the procedural boy so swapping cannot change the composition.
- Device tiers: low-tier devices keep the procedural boy and never download the
  model. See `MODEL_TIERS` in `components/three/Boy.tsx`.
- Missing, blocked or corrupt file: falls back silently to the procedural boy.
- Reduced motion: he is not in the reduced-motion still, so he is hidden.
