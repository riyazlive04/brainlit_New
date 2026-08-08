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
  PROP_DISC_OPACITY,
  PROP_NOSE_LIFT,
  PROP_NOSE_REACH,
  PROP_RADIUS_FRACTION,
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
 * So a real one is built here and placed over the fused one. The DISC is what
 * does the work — a propeller at speed is a translucent blur, which is what
 * aviation footage actually shows, and it has the useful side effect of hiding
 * the static geometry underneath it. The blades behind the disc are there for
 * the frames where it is large enough that a bare disc would read as a plate.
 *
 * If you later split the propeller into its own node in Blender, delete this
 * and rotate that node instead — the constants below are named for what they
 * mean, not for this workaround.
 * ─────────────────────────────────────────────────────────────────────────────
 */
function Propeller({ radius, spinning }: { radius: number; spinning: boolean }) {
  const spinRef = useRef<THREE.Group>(null);

  const parts = useMemo(() => {
    /** Flattened so the blade has a chord, not a square section. */
    const blade = new THREE.CapsuleGeometry(radius * 0.085, radius * 1.5, 6, 14);
    const hub = new THREE.SphereGeometry(radius * 0.16, 20, 14);
    const disc = new THREE.CircleGeometry(radius * 1.04, 44);

    const metal = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#3b3f46"),
      roughness: 0.38,
      metalness: 0.8,
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
      color: new THREE.Color("#d8dbe0"),
      transparent: true,
      opacity: PROP_DISC_OPACITY,
      side: THREE.DoubleSide,
      // Written into the depth buffer it would punch a hole in the fuselage
      // behind it at every angle where the two overlap.
      depthWrite: false,
    });

    return { blade, hub, disc, metal, blur };
  }, [radius]);

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
          const a = (i / PROP_BLADES) * Math.PI * 2;
          return (
            <mesh
              key={i}
              geometry={parts.blade}
              material={parts.metal}
              rotation={[0, 0, a]}
              position={[
                Math.sin(a) * radius * 0.52,
                Math.cos(a) * radius * 0.52,
                0,
              ]}
              // Thin front to back: a blade is a wing section, not a rod.
              scale={[1, 1, 0.3]}
            />
          );
        })}
      </group>

      {/* In front of the blades so it reads as the volume they sweep. */}
      <mesh
        geometry={parts.disc}
        material={parts.blur}
        position={[0, 0, radius * 0.06]}
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
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());

    // Span is the widest axis across the direction of travel. The fuselage runs
    // along Z here, so that leaves X.
    const span = Math.max(size.x, 1e-4);

    return {
      scale: AEROPLANE_SPAN / span,
      // Centred on all three axes: it banks and rolls about its own middle.
      offset: new THREE.Vector3(-centre.x, -centre.y, -centre.z),

      /**
       * Where the nose is, MEASURED rather than typed in.
       *
       * In the space this returns, the model has already been centred, so the
       * nose sits at half the fuselage length along +Z. Measuring it means the
       * propeller stays on the nose if the model is ever re-exported at a
       * different scale or with different proportions — which, with an
       * image-to-3D pipeline, it will be.
       */
      nose: new THREE.Vector3(
        0,
        size.y * PROP_NOSE_LIFT,
        size.z * (0.5 + PROP_NOSE_REACH),
      ),
      propRadius: span * PROP_RADIUS_FRACTION,
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
          <Propeller radius={fit.propRadius} spinning={!reducedMotion} />
        </group>
      </group>
    </group>
  );
}

export default AeroplaneModel;
