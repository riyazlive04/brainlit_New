"""
Give the boy a throwing arm.

He arrived from Tripo3D as a single static mesh: no skeleton, no weights, so
nothing on him can move independently of anything else. This builds the minimum
rig the hero needs — a root and one shoulder joint — and writes it into the GLB,
so three.js loads a real SkinnedMesh and the existing code (which already looks
up `mixamorig:RightArm`) drives it with no change.

WHY THIS IS NOT A GENERAL AUTO-RIGGER, and should not be mistaken for one:
his arms are pressed against his sides and fused into the hoodie, so there is no
surface boundary to separate arm from torso. Weights are therefore assigned by
GEOMETRY — distance from an arm axis — with a wide feather, rather than by the
mesh's own topology. That is good enough for a shoulder swinging through a
modest arc and is not good enough for a full 220-degree throw.
"""
import json, struct, sys
import numpy as np

SRC, DST = sys.argv[1], sys.argv[2]

# ── read ────────────────────────────────────────────────────────────────────
raw = open(SRC, "rb").read()
off, gltf, bin_off = 12, None, None
while off < len(raw):
    clen, ctype = struct.unpack("<II", raw[off:off + 8])
    if ctype == 0x4E4F534A:
        gltf = json.loads(raw[off + 8:off + 8 + clen])
    elif ctype == 0x004E4942:
        bin_off, bin_len = off + 8, clen
    off += 8 + clen
blob = bytearray(raw[bin_off:bin_off + bin_len])

prim = gltf["meshes"][0]["primitives"][0]

def read(acc_i, dtype, comps):
    """Respects byteStride. These attributes are INTERLEAVED — position,
    normal and uv share one bufferView at 32 bytes a vertex — so reading them
    as a tight array silently returns a blend of all three, which is how the
    first attempt put his shoulder outside his own bounding box."""
    a = gltf["accessors"][acc_i]
    bv = gltf["bufferViews"][a["bufferView"]]
    itemsize = np.dtype(dtype).itemsize
    stride = bv.get("byteStride") or comps * itemsize
    start = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
    rows = np.frombuffer(blob, dtype=np.uint8, count=a["count"] * stride,
                         offset=start).reshape(a["count"], stride)
    return rows[:, :comps * itemsize].copy().view(dtype).reshape(-1, comps)

pos = read(prim["attributes"]["POSITION"], np.float32, 3)
n = len(pos)

# ── where is the arm? ───────────────────────────────────────────────────────
# He is 1.0 tall, feet at the bbox floor. The shoulder axis is Z (measured: the
# Z extent is the wide one), and the throwing hand is the +Z side.
ymin, ymax = pos[:, 1].min(), pos[:, 1].max()
h = ymax - ymin
def yf(v): return ymin + h * v          # fraction of height -> model Y

zc = (pos[:, 2].min() + pos[:, 2].max()) / 2

# Shoulder: top of the arm, inboard of the arm's outer surface.
shoulder_y = yf(0.775)
band = pos[(pos[:, 1] > yf(0.74)) & (pos[:, 1] < yf(0.81))]
shoulder_z = zc + (band[:, 2].max() - zc) * 0.55
shoulder_x = float(np.median(band[:, 0]))
SHOULDER = np.array([shoulder_x, shoulder_y, shoulder_z], dtype=np.float64)

# Hand: the far tip on the +Z side at hand height, measured not guessed.
hband = pos[(pos[:, 1] > yf(0.28)) & (pos[:, 1] < yf(0.40))]
HAND = hband[np.argmax(hband[:, 2])].astype(np.float64)

axis = HAND - SHOULDER
arm_len = np.linalg.norm(axis)
axis /= arm_len
print(f"shoulder {SHOULDER.round(3)}  hand {HAND.round(3)}  arm length {arm_len:.3f}")

# ── weights ─────────────────────────────────────────────────────────────────
# t  = how far down the arm a vertex projects (0 at shoulder, 1 at hand)
# r  = how far it sits off the arm axis
d = pos.astype(np.float64) - SHOULDER
t = d @ axis
r = np.linalg.norm(d - np.outer(t, axis), axis=1)

def smoothstep(a, b, x):
    u = np.clip((x - a) / (b - a), 0.0, 1.0)
    return u * u * (3 - 2 * u)

# Along the arm: nothing above the shoulder, full weight past the first third.
# The feather is deliberately wide — it is the only thing standing between a
# rotating arm and a torn hoodie, because there is no seam here to cut along.
along = smoothstep(-0.02 * arm_len, 0.42 * arm_len, t)

# Across: fall off outside a sleeve-sized radius so the chest is not dragged in.
across = 1.0 - smoothstep(0.055 * arm_len, 0.115 * arm_len, r)

# ...WIDENED, not removed, down the far end of the arm.
#
# The narrow gate exists to stop the shoulder claiming the chest. At the hand it
# does active harm: fingers splay wider than the upper arm is thick, so they
# fall outside the radius, keep a weight of zero, and stay behind while the arm
# swings — fingers stretching away from the wrist like toffee.
#
# Removing the gate entirely down there is worse still, and was the next thing
# tried:  is a projection onto an axis that CONTINUES PAST THE HAND, and what
# lies further along it is his leg. The whole leg came with the arm.
#
# So the gate widens to hand size, and a second one closes off everything beyond
# the fingertips.
far = smoothstep(0.62 * arm_len, 0.85 * arm_len, t)
across_far = 1.0 - smoothstep(0.16 * arm_len, 0.26 * arm_len, r)
across = np.maximum(across, far * across_far)

# Nothing past the hand belongs to the arm — the axis runs on, the arm does not.
beyond = 1.0 - smoothstep(1.02 * arm_len, 1.22 * arm_len, t)

# And never claim anything on the far side of the body.
side = smoothstep(zc + 0.02, zc + 0.06, pos[:, 2].astype(np.float64))

w_arm = np.clip(along * across * side * beyond, 0.0, 1.0).astype(np.float32)
print(f"vertices moved by the arm bone: {(w_arm > 0.5).sum()} full, "
      f"{((w_arm > 0.02) & (w_arm <= 0.5)).sum()} feathered, of {n}")

joints = np.zeros((n, 4), dtype=np.uint8)
joints[:, 0] = 1                                    # bone 1 = the arm
weights = np.zeros((n, 4), dtype=np.float32)
weights[:, 0] = w_arm
weights[:, 1] = 1.0 - w_arm                         # bone 0 = root, holds the rest
joints[:, 1] = 0

# ── append buffers ──────────────────────────────────────────────────────────
def add(data: bytes, target=None):
    while len(blob) % 4:
        blob.append(0)
    start = len(blob)
    blob.extend(data)
    gltf["bufferViews"].append({"buffer": 0, "byteOffset": start,
                                "byteLength": len(data),
                                **({"target": target} if target else {})})
    return len(gltf["bufferViews"]) - 1

def accessor(bv, comp, typ, count, **extra):
    gltf["accessors"].append({"bufferView": bv, "componentType": comp,
                              "count": count, "type": typ, **extra})
    return len(gltf["accessors"]) - 1

j_acc = accessor(add(joints.tobytes(), 34962), 5121, "VEC4", n)
w_acc = accessor(add(weights.tobytes(), 34962), 5126, "VEC4", n)
prim["attributes"]["JOINTS_0"] = j_acc
prim["attributes"]["WEIGHTS_0"] = w_acc

# Inverse bind matrices: bones are pure translations, so the inverse is the
# negated translation. Column-major, as glTF requires.
def ibm(p):
    m = np.eye(4, dtype=np.float32)
    m[3, 0:3] = -np.array(p, dtype=np.float32)
    return m.T.flatten(order="F")

ibms = np.concatenate([ibm([0, 0, 0]), ibm(SHOULDER), ibm(HAND)]).astype(np.float32)
ibm_acc = accessor(add(ibms.tobytes()), 5126, "MAT4", 3)

# ── skeleton ────────────────────────────────────────────────────────────────
mesh_node = 0
root_i = len(gltf["nodes"])
gltf["nodes"].append({"name": "Root", "children": [root_i + 1]})
gltf["nodes"].append({"name": "mixamorig:RightArm",
                      "translation": [float(x) for x in SHOULDER],
                      "children": [root_i + 2]})
# A hand bone carries NO weights — the hand mesh is already moved by the arm.
# It exists so the rocket has a wrist to be parented to, and because it is a
# child of the arm it now travels with the swing instead of sitting at his hip.
# Local to its parent, hence the subtraction.
gltf["nodes"].append({"name": "mixamorig:RightHand",
                      "translation": [float(x) for x in (HAND - SHOULDER)]})

gltf["skins"] = [{"inverseBindMatrices": ibm_acc,
                  "joints": [root_i, root_i + 1, root_i + 2],
                  "skeleton": root_i}]
gltf["nodes"][mesh_node]["skin"] = 0
gltf["scenes"][0]["nodes"] = [mesh_node, root_i]

# ── write ───────────────────────────────────────────────────────────────────
gltf["buffers"][0]["byteLength"] = len(blob)
js = json.dumps(gltf, separators=(",", ":")).encode()
while len(js) % 4:
    js += b" "
while len(blob) % 4:
    blob.append(0)

out = struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(blob))
out += struct.pack("<II", len(js), 0x4E4F534A) + js
out += struct.pack("<II", len(blob), 0x004E4942) + bytes(blob)
open(DST, "wb").write(out)
print(f"wrote {DST}  {len(out)/1e6:.2f} MB")
