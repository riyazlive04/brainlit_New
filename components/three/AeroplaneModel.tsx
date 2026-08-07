"use client";

import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import {
  AEROPLANE_MODEL_ORIENTATION,
  AEROPLANE_MODEL_URL,
  AEROPLANE_SPAN,
  MODEL_USES_DRACO,
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
export function AeroplaneModel() {
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

  return (
    <group rotation={AEROPLANE_MODEL_ORIENTATION}>
      <group scale={fit.scale}>
        <group position={fit.offset}>
          <primitive object={scene} />
        </group>
      </group>
    </group>
  );
}

export default AeroplaneModel;
