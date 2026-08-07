"use client";

import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import {
  MODEL_USES_DRACO,
  ROCKET_MODEL_ORIENTATION,
  ROCKET_MODEL_URL,
  fitToHeight,
} from "./lib/characterModel";

/**
 * The paper rocket, loaded from `public/rocket.glb`.
 *
 * Sibling of the procedural cone-and-fins in Rocket.tsx, on the same terms as
 * BoyModel is to CartoonBoy: the parent owns position, orientation, roll, scale
 * and the burn, and this owns nothing but the geometry.
 *
 * WHY IT HANDS ITS MATERIALS BACK
 *
 * The rocket is not just moved, it is CONSUMED — shot 4 drives it from paper to
 * flame to char and then scales it out of existence. The procedural version has
 * one material the parent can reach for directly. A loaded model has however
 * many the artist gave it, so it reports them upward on mount and the parent
 * drives all of them together. Without that the model would fly beautifully and
 * then refuse to burn, which is the beat the whole sequence turns on.
 */

type Props = {
  /** Longest dimension, in world units, to match the procedural rocket. */
  length: number;
  /** Receives every material in the file, for the burn to drive. */
  onMaterials: (materials: THREE.MeshStandardMaterial[]) => void;
};

export function RocketModel({ length, onMaterials }: Props) {
  const { scene } = useGLTF(ROCKET_MODEL_URL, MODEL_USES_DRACO);

  /**
   * Fitted on its LONGEST axis, not its height.
   *
   * `fitToHeight` normalises against Y, which is right for a character standing
   * up and wrong for a dart lying down — the model is 1.0 long and 0.46 tall, so
   * fitting by height would make it twice the intended size. Measuring the box
   * and dividing by its largest extent is the same idea applied to the axis that
   * actually means something here.
   */
  const fit = useMemo(() => {
    const base = fitToHeight(scene, 1);
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const longest = Math.max(size.x, size.y, size.z);

    return {
      scale: longest > 1e-4 ? length / longest : 1,
      // Centre it on all three axes: a rocket pivots about its middle, where a
      // character stands on its feet.
      offset: new THREE.Vector3(
        base.offset.x,
        -box.getCenter(new THREE.Vector3()).y,
        base.offset.z,
      ),
    };
  }, [scene, length]);

  useEffect(() => {
    const materials: THREE.MeshStandardMaterial[] = [];

    scene.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;

      mesh.castShadow = false;
      mesh.receiveShadow = false;

      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        // Only Standard/Physical carry the `emissive` the burn needs. Anything
        // else is left alone rather than crashing on a property it lacks.
        if ((material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          materials.push(material as THREE.MeshStandardMaterial);
        }
      }
    });

    onMaterials(materials);
    return () => onMaterials([]);
  }, [scene, onMaterials]);

  return (
    <group rotation={ROCKET_MODEL_ORIENTATION}>
      <group scale={fit.scale}>
        <group position={fit.offset}>
          <primitive object={scene} />
        </group>
      </group>
    </group>
  );
}

export default RocketModel;
