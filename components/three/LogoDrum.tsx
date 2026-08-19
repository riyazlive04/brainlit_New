"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  CYLINDER_DEFAULTS,
  facingOpacity,
  layout,
  makePlateMaterial,
  placeholderTexture,
  type LogoCylinderLogo,
} from "@/lib/logoCylinder";

/**
 * The React Three Fiber form of LogoCylinder.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IT SHARES THE MATHS, NOT A COPY OF IT. Every calculation that decides whether
 * this thing works — the luminance key, the facing fade, the repeat, the radius
 * from plate count, the tilt lift — lives in lib/logoCylinder.ts and is
 * imported here. Two implementations of a drum is fine. Two implementations of
 * `radius = (count × width) / (0.72 × 2π)` is how one of them silently stops
 * matching the other.
 *
 * WHICH ONE TO USE. The class is self-contained and portable — any HTML page,
 * no React. This is the one to reach for inside an R3F app that already has a
 * canvas and a frameloop worth sharing. In THIS repo the section uses the
 * class, because the hero cinematic already owns a `<Canvas>` and the class
 * gives explicit control over when its own loop runs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

type DrumProps = {
  logos: LogoCylinderLogo[];
  color?: string;
  keyWhiteBackground?: boolean;
  spinSpeed?: number;
  repeat?: number;
  plateWidth?: number;
  aspect?: number;
  tilt?: number;
  logosInView?: number;
  radius?: number | "auto";
  maxDpr?: number;
};

function Drum(props: Required<Omit<DrumProps, "maxDpr">>) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef(0);
  const world = useMemo(() => new THREE.Vector3(), []);
  const { camera, viewport } = useThree();

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  const plates = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return Array.from({ length: props.logos.length * props.repeat }, (_, i) => {
      const logo = props.logos[i % props.logos.length];
      const texture = loader.load(
        logo.src,
        (loaded) => {
          loaded.colorSpace = THREE.SRGBColorSpace;
        },
        undefined,
        () => {
          material.uniforms.uMap.value = placeholderTexture(logo.label);
        },
      );
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = makePlateMaterial(texture, props.color, props.keyWhiteBackground);
      return { texture, material };
    });
  }, [props.logos, props.repeat, props.color, props.keyWhiteBackground]);

  const values = useMemo(
    () =>
      layout({
        logoCount: props.logos.length,
        repeat: props.repeat,
        plateWidth: props.plateWidth,
        aspect: props.aspect,
        tilt: props.tilt,
        logosInView: props.logosInView,
        radius: props.radius,
        fovDeg: (camera as THREE.PerspectiveCamera).fov,
        viewportAspect: viewport.aspect,
      }),
    [props, camera, viewport.aspect],
  );

  useEffect(() => {
    camera.position.set(0, 0, values.cameraZ);
    camera.lookAt(0, 0, 0);
  }, [camera, values.cameraZ]);

  // Everything created here is created by this component, so everything here
  // is disposed by it.
  useEffect(() => {
    const owned = plates;
    const ownedGeometry = geometry;
    return () => {
      for (const plate of owned) {
        plate.material.dispose();
        plate.texture.dispose();
      }
      ownedGeometry.dispose();
    };
  }, [plates, geometry]);

  useFrame((_, delta) => {
    const node = group.current;
    if (!node) return;

    spin.current += props.spinSpeed * Math.min(delta, 0.05);
    node.rotation.y = spin.current;
    node.rotation.z = Math.sin(spin.current * 0.5) * 0.02;

    node.updateWorldMatrix(true, true);
    node.children.forEach((child) => {
      child.getWorldPosition(world);
      const material = (child as THREE.Mesh).material as THREE.ShaderMaterial;
      material.uniforms.uOpacity.value = facingOpacity(world.z, values.radius);
    });
  });

  return (
    <group ref={group} rotation-x={props.tilt} position-y={values.groupLift}>
      {plates.map((plate, i) => {
        const angle = i * values.step;
        return (
          <mesh
            key={i}
            geometry={geometry}
            material={plate.material}
            position={[
              Math.sin(angle) * values.radius,
              0,
              Math.cos(angle) * values.radius,
            ]}
            rotation-y={angle}
            scale={[props.plateWidth, values.plateHeight, 1]}
          />
        );
      })}
    </group>
  );
}

export function LogoDrum(props: DrumProps) {
  const merged = { ...CYLINDER_DEFAULTS, ...props };

  return (
    <Canvas
      // Decoration: a full-width canvas that swallows swipes is a real problem
      // on a phone, and there is nothing here to interact with.
      style={{ pointerEvents: "none" }}
      dpr={[1, merged.maxDpr]}
      camera={{ fov: 45, near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Drum
        logos={merged.logos}
        color={merged.color}
        keyWhiteBackground={merged.keyWhiteBackground}
        spinSpeed={merged.spinSpeed}
        repeat={merged.repeat}
        plateWidth={merged.plateWidth}
        aspect={merged.aspect}
        tilt={merged.tilt}
        logosInView={merged.logosInView}
        radius={merged.radius}
      />
    </Canvas>
  );
}
