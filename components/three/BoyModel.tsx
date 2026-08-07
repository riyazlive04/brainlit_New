"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { BOY_HEIGHT } from "./lib/flightPath";
import {
  CHARACTER_MODEL_URL,
  HAND_FALLBACK,
  HAND_NAMES,
  MODEL_USES_DRACO,
  MODEL_YAW_OFFSET,
  THROW_ARM_NAMES,
  THROW_AXIS,
  THROW_LIMIT,
  THROW_SCALE,
  findNode,
  fitToHeight,
} from "./lib/characterModel";
import { armAngle, bodyLean } from "./lib/throwPose";

/**
 * The character, loaded from `public/boy.glb`.
 *
 * Sibling of CartoonBoy rather than a replacement for it. CartoonBoy is what
 * renders while this is downloading and what renders if it never arrives — see
 * Boy.tsx — so the two have to be interchangeable from the outside: same
 * placement, same `throwRef`, same hand for the rocket to ride.
 *
 * See lib/characterModel.ts for what the file has to satisfy. Nothing in this
 * component is specific to a particular rig; everything it needs is either
 * measured off the mesh or looked up by name with a fallback.
 */

type Props = {
  /** 0..1 through the throw, read every frame. Never a prop that re-renders. */
  throwRef: RefObject<number>;
  /** Receives an empty at the throwing hand, for the rocket to ride. */
  handRef?: RefObject<THREE.Object3D | null>;
};

/**
 * Orientation of the empty at the hand.
 *
 * A quarter turn so that "up" for a held object points out along the hand's
 * forward axis, which is where a thrown object actually leaves from. TUNE THIS
 * AGAINST THE REAL RIG: every exporter has its own idea of which way a hand
 * bone points, and the symptom of getting it wrong is a paper rocket held
 * sideways rather than anything more obvious.
 */
const HAND_EMPTY_ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0];

export function BoyModel({ throwRef, handRef }: Props) {
  const { scene, animations } = useGLTF(CHARACTER_MODEL_URL, MODEL_USES_DRACO);

  /**
   * Measured once. `scene` is the module-level cache drei hands out, so this
   * deliberately does NOT mutate it — the scale goes on an outer group and the
   * offset on an inner one. See `fitToHeight`.
   */
  const fit = useMemo(() => fitToHeight(scene, BOY_HEIGHT), [scene]);

  const armRef = useRef<THREE.Object3D | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const throwActionRef = useRef<THREE.AnimationAction | null>(null);
  const leanRef = useRef<THREE.Group>(null);

  /** Rest pose of the arm bone, so the swing is applied RELATIVE to the rig. */
  const armRestRef = useRef(new THREE.Quaternion());
  const swingAxis = useMemo(() => new THREE.Vector3(...THROW_AXIS).normalize(), []);
  const swing = useMemo(() => new THREE.Quaternion(), []);

  /**
   * Does this file bring anything that can be posed?
   *
   * The model currently in `public/` does not: Tripo3D exports a single static
   * mesh, no skeleton, no clips. That is normal for image-to-3D and it decides
   * two things below — whether the throw articulates or leans, and whether the
   * rocket is parented to a wrist or to a fixed point on the body.
   */
  const handBone = useMemo(() => findNode(scene, HAND_NAMES), [scene]);

  useEffect(() => {
    scene.traverse((node) => {
      // Shadows are off in this scene, but a model exported for a turntable
      // often arrives with them on, which costs a shadow pass for nothing.
      const mesh = node as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });

    armRef.current = findNode(scene, THROW_ARM_NAMES);
    if (armRef.current) armRestRef.current.copy(armRef.current.quaternion);
  }, [scene]);

  /**
   * A "throw" clip, if the model brings one, SCRUBBED rather than played.
   *
   * The whole sequence is a pure function of scroll position — see lib/shots.ts
   * — so an AnimationAction here is only ever a way to sample a pose at a given
   * time. `mixer.setTime` does exactly that. Calling `.play()` and letting it
   * run would put the one thing in the hero that cannot be resolved from the
   * scroll position, and scrubbing backwards would fight it.
   */
  useEffect(() => {
    const clip = animations.find((candidate) => /throw/i.test(candidate.name));
    if (!clip) return;

    const mixer = new THREE.AnimationMixer(scene);
    const action = mixer.clipAction(clip);
    action.play();
    // Held at whichever frame we sample, rather than snapping back to the first.
    action.clampWhenFinished = true;
    action.setLoop(THREE.LoopOnce, 1);

    mixerRef.current = mixer;
    throwActionRef.current = action;

    return () => {
      mixer.stopAllAction();
      mixer.uncacheClip(clip);
      mixerRef.current = null;
      throwActionRef.current = null;
    };
  }, [animations, scene]);

  /**
   * The empty at the hand.
   *
   * Added to the hand bone imperatively because the bone is inside a loaded
   * subtree, not something JSX can nest into. Removed on unmount so a hot
   * reload does not leave a stack of empties parented to his fist.
   */
  useEffect(() => {
    if (!handRef || !handBone) return;

    const empty = new THREE.Object3D();
    empty.rotation.set(...HAND_EMPTY_ROTATION);
    handBone.add(empty);
    handRef.current = empty;

    return () => {
      handBone.remove(empty);
      if (handRef.current === empty) handRef.current = null;
    };
  }, [handBone, handRef]);

  useFrame(() => {
    const t = Math.max(0, Math.min(1, throwRef.current));

    // The model's own motion wins when it has one.
    const action = throwActionRef.current;
    if (action && mixerRef.current) {
      mixerRef.current.setTime(action.getClip().duration * t);
      return;
    }

    // Otherwise swing the arm on the same curve the procedural boy uses.
    const arm = armRef.current;
    if (arm) {
      // About the rig's own shoulder axis, and scaled to what one joint can
      // hold — see THROW_AXIS / THROW_SCALE. Composed onto the rest pose rather
      // than assigned, so a rig that does not start at identity is respected.
      const angle = Math.max(
        THROW_LIMIT.forward,
        Math.min(THROW_LIMIT.back, armAngle(t) * THROW_SCALE),
      );
      swing.setFromAxisAngle(swingAxis, angle);
      arm.quaternion.copy(armRestRef.current).multiply(swing);
      return;
    }

    // Nothing to pose. Lean the whole body instead — see `bodyLean`.
    if (leanRef.current) leanRef.current.rotation.x = bodyLean(t);
  });

  return (
    /* The yaw correction wraps everything, INCLUDING the hand fallback, so that
       offset can be written in the intuitive frame — facing +Z, his hands at
       ±X — rather than in whatever frame the exporter happened to use. */
    <group rotation={[0, MODEL_YAW_OFFSET, 0]}>
      {/* Leans from the ankles, so the whole figure pivots on the floor rather
          than about its own middle, which reads as toppling. */}
      <group ref={leanRef}>
        <group scale={fit.scale}>
          <group position={fit.offset}>
            <primitive object={scene} />
          </group>
        </group>

        {/* No wrist to hold it? Then a point on the body that at least moves
            with him. Rendered rather than attached, so React owns the ref and
            it is torn down cleanly. */}
        {!handBone && (
          <object3D
            ref={handRef}
            position={[
              HAND_FALLBACK.x * BOY_HEIGHT,
              HAND_FALLBACK.y * BOY_HEIGHT,
              HAND_FALLBACK.z * BOY_HEIGHT,
            ]}
            rotation={HAND_EMPTY_ROTATION}
          />
        )}
      </group>
    </group>
  );
}

export default BoyModel;
