"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import {
  AEROPLANE_MODEL_ORIENTATION,
  AEROPLANE_MODEL_URL,
  AEROPLANE_SPAN,
  MODEL_USES_DRACO,
  PROP_BLADES,
  PROP_BLADE_CHORD,
  PROP_BLADE_PITCH,
  PROP_BLADE_TAPER,
  PROP_BLADE_THICKNESS,
  PROP_COLOUR_FALLBACK,
  PROP_COLOUR_SAMPLES,
  PROP_SWEEP_DEPTH,
  PROP_SWEEP_QUANTILE,
  PROP_DISC_OPACITY,
  PROP_NOSE_REACH,
  PROP_NOSE_SLICE,
  PROP_SPIN_RATE,
} from "./lib/characterModel";

/**
 * The aeroplane, loaded from `public/aeroplane.glb`.
 *
 * Sibling of CartoonPlane on the same terms the other two models keep with
 * their procedural counterparts: Plane.tsx owns where it is, which way it
 * points, how it banks and how big it is; this owns geometry and nothing else.
 *
 * It is fitted by WINGSPAN, not by height or by longest axis. A plane's span is
 * what the eye measures it by and what the fly-past was framed against — fit it
 * by fuselage length instead and a long-nosed model reads as a toy while a
 * stubby one fills the frame.
 */

/**
 * Everything about the aircraft that the propeller needs, read off the mesh.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS IS MEASURED AND NOT CONFIGURED
 *
 * The two numbers that decide whether a bolted-on propeller looks like part of
 * the aeroplane are WHERE THE CRANKSHAFT IS and HOW FAR THE BLADES REACH. Both
 * were constants, and both were wrong: the hub sat at the bounding-box centre,
 * which this aircraft's fixed landing gear drags a quarter of its height below
 * the engine, and the blades were sized off the wingspan by a fraction that had
 * never been checked against the propeller already modelled at the nose.
 *
 * A constant cannot be right here, because it is a claim about geometry that
 * this file does not own. Tripo3D re-exports at different scales and different
 * proportions; the moment one arrives, a tuned number is a propeller floating
 * in front of a nose. So: three quantities, all derived, all in the model's own
 * space, all as fractions of its own size.
 *
 *   hub          the average of the vertices in the forward-most
 *                PROP_NOSE_SLICE of the fuselage — the spinner's tip, and so
 *                the thrust axis
 *   sweepRadius  a high quantile of how far the forward PROP_SWEEP_DEPTH of the
 *                fuselage stands off that axis — where the model's own blades
 *                end, and therefore where these must end too
 *   uv           the texture coordinates of those same tip vertices, so the
 *                blades can be painted in the spinner's own metal
 *
 * Two passes over ~36k vertices, once, inside a `useMemo`. Positions are plain
 * floats by the time three.js has the geometry, so neither the meshopt
 * compression nor the quantised shorts this file arrives in are an obstacle —
 * `fromBufferAttribute` de-normalises on the way out.
 * ─────────────────────────────────────────────────────────────────────────────
 */
function surveyNose(scene: THREE.Object3D) {
  scene.updateWorldMatrix(true, true);

  /**
   * Every mesh's transform folded down into the SCENE's space, not the world's.
   *
   * `scene` is mounted inside this component's own scaling and centring groups,
   * so its world matrix is not the identity by the time this runs. Measuring in
   * world space would fold that scale into the answer and then apply it a
   * second time on the way back out.
   */
  const toScene = new THREE.Matrix4().copy(scene.matrixWorld).invert();
  const parts: {
    position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
    uv: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | null;
    matrix: THREE.Matrix4;
  }[] = [];

  scene.traverse((node) => {
    const mesh = node as THREE.Mesh;
    const position = mesh.isMesh ? mesh.geometry?.getAttribute("position") : null;
    if (!position) return;
    parts.push({
      position,
      uv: mesh.geometry.getAttribute("uv") ?? null,
      matrix: new THREE.Matrix4().multiplyMatrices(toScene, mesh.matrixWorld),
    });
  });

  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  for (const part of parts) {
    for (let i = 0; i < part.position.count; i++) {
      box.expandByPoint(v.fromBufferAttribute(part.position, i).applyMatrix4(part.matrix));
    }
  }

  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const hub = centre.clone();
  const uv: number[] = [];
  let sweepRadius = 0;

  if (parts.length && size.z > 0) {
    // The nose is at +Z: Plane.tsx flies the craft's +Z down the flight
    // tangent, and this export's nose already points that way. See
    // AEROPLANE_MODEL_ORIENTATION for how that was established.
    const sweepFloor = box.max.z - size.z * PROP_SWEEP_DEPTH;
    const tipFloor = box.max.z - size.z * PROP_NOSE_SLICE;
    const sweep: number[] = [];
    let tipX = 0;
    let tipY = 0;
    let tips = 0;

    for (const part of parts) {
      for (let i = 0; i < part.position.count; i++) {
        v.fromBufferAttribute(part.position, i).applyMatrix4(part.matrix);
        if (v.z < sweepFloor) continue;
        sweep.push(v.x, v.y);
        if (v.z < tipFloor) continue;
        tipX += v.x;
        tipY += v.y;
        tips++;
        if (part.uv) uv.push(part.uv.getX(i), part.uv.getY(i));
      }
    }

    if (tips) {
      hub.set(tipX / tips, tipY / tips, box.max.z);

      // Distances from the thrust axis, sorted, then the quantile. Sorting a
      // few thousand numbers once is not worth a selection algorithm.
      const radii: number[] = [];
      for (let i = 0; i < sweep.length; i += 2) {
        radii.push(Math.hypot(sweep[i] - hub.x, sweep[i + 1] - hub.y));
      }
      radii.sort((a, b) => a - b);
      sweepRadius = radii[Math.min(radii.length - 1, Math.floor(radii.length * PROP_SWEEP_QUANTILE))] ?? 0;
    }
  }

  return { box, size, centre, hub, sweepRadius, uv };
}

/**
 * The blade colour, read off the aircraft's own base texture.
 *
 * Sampled at the nose vertices' UVs — the spinner — so the propeller is made of
 * whatever metal this export is skinned in. Nearest-texel, at full resolution:
 * each sample is blitted one pixel at a time into a strip N wide and 1 tall,
 * and the strip is read back in a single call. Downscaling the whole 2048²
 * atlas instead would be one drawImage, but the spinner is a handful of texels
 * on it and everything around it is orange fuselage — the average would come
 * back as the aeroplane rather than the engine.
 *
 * Returns null rather than a guess whenever it cannot see: no texture, no DOM,
 * a canvas the browser will not let us read. The caller has a constant for it.
 */
function sampleSpinnerColour(scene: THREE.Object3D, uv: number[]): THREE.Color | null {
  if (typeof document === "undefined" || uv.length < 2) return null;

  const maps: THREE.Texture[] = [];
  scene.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      const map = (material as THREE.MeshStandardMaterial)?.map;
      if (map?.image) maps.push(map);
    }
  });

  const map = maps[0];
  if (!map) return null;
  const image = map.image as CanvasImageSource & { width?: number; naturalWidth?: number; height?: number; naturalHeight?: number };
  const w = image.naturalWidth || image.width || 0;
  const h = image.naturalHeight || image.height || 0;
  if (!w || !h) return null;

  try {
    const count = Math.min(PROP_COLOUR_SAMPLES, Math.floor(uv.length / 2));
    const stride = Math.max(1, Math.floor(uv.length / 2 / count));
    const canvas = document.createElement("canvas");
    canvas.width = count;
    canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    for (let i = 0; i < count; i++) {
      const u = uv[i * stride * 2];
      // glTF puts the UV origin at the image's TOP left, which is why the
      // loader clears flipY. Read the flag rather than assuming it: a texture
      // that arrives flipped would otherwise be sampled on the far side of the
      // atlas, and it would still return a plausible colour.
      const t = map.flipY ? 1 - uv[i * stride * 2 + 1] : uv[i * stride * 2 + 1];
      const x = Math.min(w - 1, Math.max(0, Math.round(u * w)));
      const y = Math.min(h - 1, Math.max(0, Math.round(t * h)));
      ctx.drawImage(image, x, y, 1, 1, i, 0, 1, 1);
    }

    const data = ctx.getImageData(0, 0, count, 1).data;
    let r = 0;
    let g = 0;
    let b = 0;
    for (let i = 0; i < count; i++) {
      r += data[i * 4];
      g += data[i * 4 + 1];
      b += data[i * 4 + 2];
    }
    // Texels are sRGB. Handing them to three as working-space values would
    // wash the blades out by roughly a stop.
    return new THREE.Color().setRGB(
      r / count / 255,
      g / count / 255,
      b / count / 255,
      THREE.SRGBColorSpace,
    );
  } catch {
    return null;
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS FILE BUILDS A PROPELLER
 *
 * `public/aeroplane.glb` is ONE node, ONE mesh, ONE material and zero animation
 * clips — Tripo3D welds an image-to-3D export into a single object. The
 * propeller is modelled, but it is modelled as part of the fuselage, so there
 * is no node to turn. `spinPropeller` never had any effect on the loaded
 * aircraft: it is a prop on CartoonPlane, and CartoonPlane is not what flies
 * when the GLB is present.
 *
 * A dead propeller is the single loudest tell that an aircraft is a prop rather
 * than a machine. The eye checks it before it checks anything else.
 *
 * So a real one is built here and turned in front of the fused one. The BLADES
 * do the work; the disc is a hint of air behind them, and no more than that.
 * The original plan had it the other way round — the disc thick enough to hide
 * the dead geometry — and that was measured and abandoned: see the note on
 * PROP_DISC_OPACITY for what each opacity actually looks like.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS IS A COMPROMISE, AND HERE IS WHAT IT COSTS. The model's own propeller is
 * still there and still dead. At the closest approach — where the aircraft
 * covers most of the frame — a viewer who stops scrolling sees six blades on a
 * three-blade engine: three turning, three not. They are the same length, the
 * same colour and the same material now, so it reads as a six-blade prop rather
 * than as an attachment, which is the best this approach can do.
 *
 * THE FIX IS IN BLENDER, AND IT IS SMALL:
 *
 *   1. open public/aeroplane.glb, edit mode on the single mesh
 *   2. select the spinner dome and the three blades — everything forward of the
 *      cowling face, which is the front 10% of the fuselage's length
 *   3. P → Separate by selection, and cap the two open boundaries
 *   4. name the new object so it contains "prop", parent it to the airframe,
 *      and leave its origin ON the crankshaft: measured, that is the model's
 *      bounding-box centre plus 0.240 of its height in Y, at the very front in Z
 *
 * Then delete this whole component, look the node up by name, and turn it. A
 * union-find over the mesh's 51,982 triangles finds exactly ONE connected
 * component, so the separation cannot be done here at runtime — cutting a
 * closed surface open leaves a hole in the aeroplane.
 * ─────────────────────────────────────────────────────────────────────────────
 */
function Propeller({
  radius,
  colour,
  spinning,
}: {
  radius: number;
  colour: THREE.Color;
  spinning: boolean;
}) {
  const spinRef = useRef<THREE.Group>(null);

  const parts = useMemo(() => {
    /**
     * A tapered blade whose TIP IS EXACTLY AT `radius`, which the previous one
     * was not, and by a margin that put its tips level with the wheel spats.
     *
     * A capsule takes its HEIGHT argument as the length of the middle section
     * ONLY — the two hemispherical caps are added to it. Each blade was then
     * pushed a further 0.52 of the radius out from the hub. So the arithmetic
     * ran (1.5 + 2×0.085)/2 + 0.52 = 1.355, and a "radius" of 0.15 of span drew
     * a disc of 0.203. Off by a third, invisibly, inside two constants that
     * both looked reasonable on their own.
     *
     * A cylinder translated so its base sits ON the hub has no such term: the
     * tip is at `radius` because the geometry says so. It also tapers, which a
     * capsule cannot, and which is most of what makes a blade read as a wing
     * rather than a rod.
     */
    const blade = new THREE.CylinderGeometry(
      radius * PROP_BLADE_CHORD * PROP_BLADE_TAPER,
      radius * PROP_BLADE_CHORD,
      radius,
      8,
      1,
      false,
    );
    blade.translate(0, radius / 2, 0);
    // Thin front to back. The chord stays in the disc's plane, where a
    // propeller's chord belongs; the pitch that twists it out of that plane is
    // applied per blade below.
    blade.scale(1, 1, PROP_BLADE_THICKNESS);

    const hub = new THREE.SphereGeometry(radius * PROP_BLADE_CHORD * 1.5, 16, 12);
    const disc = new THREE.CircleGeometry(radius, 44);

    /**
     * Painted metal, not bare metal — metalness 0.8 was the other half of why
     * these blades read as a separate object.
     *
     * A fully metallic material has no diffuse term, so it renders as whatever
     * it reflects, which in a scene lit this softly is a dark smear. The
     * aircraft's own blades are painted, come out of its texture as a pale warm
     * grey, and sit at the low end of its metalness map. Matching that is what
     * puts the two sets of blades in the same material family, which matters
     * more than usual here because both are on screen at once.
     */
    const metal = new THREE.MeshStandardMaterial({
      color: colour,
      roughness: 0.55,
      metalness: 0.15,
    });

    /**
     * Basic, NOT Standard, and that is load-bearing twice over.
     *
     * PlaneBody collects MeshStandardMaterials to carry the burn's heat. A blur
     * disc that glowed would be a bright plate stuck to the nose through the
     * whole birth. It also has no business responding to light: it represents
     * motion, not a surface.
     */
    const blur = new THREE.MeshBasicMaterial({
      // The disc is the volume the blades sweep, so it is the blades' colour.
      // It was a fixed pale grey, which over a warm aircraft read as a plate.
      color: colour,
      transparent: true,
      opacity: PROP_DISC_OPACITY,
      side: THREE.DoubleSide,
      // Written into the depth buffer it would punch a hole in the fuselage
      // behind it at every angle where the two overlap.
      depthWrite: false,
    });

    return { blade, hub, disc, metal, blur };
  }, [radius, colour]);

  useEffect(() => {
    const owned = parts;
    return () => {
      owned.blade.dispose();
      owned.hub.dispose();
      owned.disc.dispose();
      owned.metal.dispose();
      owned.blur.dispose();
    };
  }, [parts]);

  /**
   * The ONE time-based motion in the entire cinematic, and the exemption is
   * deliberate.
   *
   * Everything else is a pure function of scroll because everything else
   * carries narrative position — where in the story you are. A propeller does
   * not. Tying it to scroll would mean it stops dead whenever the reader stops
   * scrolling, which is the one thing a running engine never does. Scaled by
   * `delta` so it turns at the same rate on a 60Hz and a 144Hz display.
   */
  useFrame((_, delta) => {
    if (spinning && spinRef.current) {
      spinRef.current.rotation.z += delta * PROP_SPIN_RATE;
    }
  });

  return (
    <group>
      <group ref={spinRef}>
        <mesh geometry={parts.hub} material={parts.metal} />
        {Array.from({ length: PROP_BLADES }, (_, i) => {
          /**
           * ROTATION ONLY — no position, and that is the fix, not a tidy-up.
           *
           * Each blade used to be rotated by `a` about Z and then ALSO pushed
           * out along (sin a, cos a). Rotating by `a` sends the blade's axis to
           * (−sin a, cos a). The two agree at a = 0 and nowhere else, so of the
           * three blades one was correct and the other two were offset 120°
           * away from the direction they pointed — a propeller that was not
           * radially symmetric, on an object whose whole job is to spin.
           *
           * The geometry now grows from its own origin along +Y, so placing a
           * blade is one rotation and nothing else. Pitch is applied about the
           * blade's own axis first: Euler XYZ composes as Rz·Ry·Rx, which puts
           * the twist in the blade's frame and the placement in the disc's.
           */
          const a = (i / PROP_BLADES) * Math.PI * 2;
          return (
            <mesh
              key={i}
              geometry={parts.blade}
              material={parts.metal}
              rotation={[0, PROP_BLADE_PITCH, a]}
            />
          );
        })}
      </group>

      {/**
       * BEHIND the blades and in front of the model's own, which is the only
       * place it can do its job.
       *
       * It used to sit in front of everything, on the reasoning that a blur
       * disc is the volume the blades sweep. True, but the blades in front of
       * it are the sharp ones this file draws, and a disc over them washes out
       * the propeller it is meant to sell — at any opacity high enough to veil
       * the dead geometry underneath, it veiled the live geometry too.
       *
       * The fused propeller in the mesh is a little further back still (see
       * PROP_NOSE_REACH), so this lands between the two: it softens the static
       * blades and leaves the turning ones alone.
       */}
      <mesh
        geometry={parts.disc}
        material={parts.blur}
        position={[0, 0, -radius * 0.06]}
      />
    </group>
  );
}

export function AeroplaneModel({
  reducedMotion = false,
  onReady,
}: {
  reducedMotion?: boolean;
  /**
   * Fired once the aircraft is really in the tree.
   *
   * PlaneBody collects materials by traversal, and it cannot do that until this
   * subtree exists. On a cold cache it does not exist when PlaneBody mounts —
   * see the note there. Must be a stable reference from the caller.
   */
  onReady?: () => void;
}) {
  const { scene } = useGLTF(AEROPLANE_MODEL_URL, MODEL_USES_DRACO);

  const fit = useMemo(() => {
    const { box, size, centre, hub, sweepRadius, uv } = surveyNose(scene);

    // Span is the widest axis across the direction of travel. The fuselage runs
    // along Z here, so that leaves X.
    const span = Math.max(size.x, 1e-4);

    return {
      scale: AEROPLANE_SPAN / span,
      // Centred on all three axes: it banks and rolls about its own middle.
      offset: new THREE.Vector3(-centre.x, -centre.y, -centre.z),

      /**
       * The crankshaft, in the centred space the propeller is mounted in.
       *
       * X and Y come from the average of the spinner's own vertices, so the
       * disc turns about the axis the engine turns about however the model is
       * proportioned. Measured here: 0.240 of the model's height above its
       * centre, which is where a constant 0.0 had been claiming the engine was.
       * Z is the measured front of the fuselage plus a little reach, which puts
       * the disc clear of the fused propeller it turns in front of.
       */
      nose: new THREE.Vector3(
        hub.x - centre.x,
        hub.y - centre.y,
        box.max.z - centre.z + size.z * PROP_NOSE_REACH,
      ),
      /**
       * Blade length, and therefore the disc's radius: exactly as far as the
       * model's own blades reach. A quantile rather than the extreme, so the
       * tips land a shade inside the widest vertex rather than on it — 0.149 of
       * span against a true maximum of 0.153.
       *
       * Falls back to the old wingspan fraction only if the survey found no
       * geometry forward of the sweep line at all, which would mean the mesh is
       * not shaped like an aeroplane and nothing here is going to help.
       */
      propRadius: sweepRadius > 0 ? sweepRadius : span * 0.15,
      // `Color(string)` already reads the hex as sRGB, so both branches land in
      // the same space — converting the fallback again would lighten it.
      colour: sampleSpinnerColour(scene, uv) ?? new THREE.Color(PROP_COLOUR_FALLBACK),
    };
  }, [scene]);

  useEffect(() => {
    scene.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    });
  }, [scene]);

  /**
   * Announced in an effect, not during render, and AFTER the pass above.
   *
   * Effects run child-first, so the propeller's own materials are already
   * mounted by the time this fires — one collection pass upstream picks up the
   * aircraft and its propeller together.
   */
  useEffect(() => {
    onReady?.();
  }, [onReady, scene]);

  return (
    <group rotation={AEROPLANE_MODEL_ORIENTATION}>
      <group scale={fit.scale}>
        <group position={fit.offset}>
          <primitive object={scene} />
        </group>

        {/* Sibling of the offset group, not a child of it: the offset centres
            the mesh, and the nose is already expressed in that centred space. */}
        <group position={fit.nose}>
          <Propeller
            radius={fit.propRadius}
            colour={fit.colour}
            spinning={!reducedMotion}
          />
        </group>
      </group>
    </group>
  );
}

export default AeroplaneModel;
