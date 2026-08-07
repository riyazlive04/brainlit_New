"use client";

import { Canvas } from "@react-three/fiber";
import { CartoonBoy } from "@/components/three/CartoonBoy";

/**
 * The canvas half of the character inspector, split out so the page can import
 * it with `ssr: false`.
 *
 * three touches `window` at module scope, so anything importing it has to be
 * kept off the server render — the same reason CinematicScene is a separate
 * module from CinematicMount. Rendering it inline made the whole page fail to
 * hydrate, which shows up as a blank canvas and controls that do not respond.
 *
 * The lighting rig is COPIED from Cinematic.tsx rather than approximated. A
 * character tuned under a different rig looks wrong the moment it goes back into
 * the scene.
 */
export function BoyStage({
  framing,
  turn,
}: {
  framing: "body" | "head";
  turn: number;
}) {
  /**
   * He is 2.0 units tall with feet at y=0, so the head sits around y=1.4.
   *
   * The camera stays on the axis and the FIGURE is dropped instead, because an
   * R3F camera with no controls looks at the origin — raising it to head height
   * just tilts it down at the sneakers. Putting the subject at the origin is one
   * number and cannot be got wrong.
   */
  const view =
    framing === "head"
      ? { dolly: 1.5, lift: -1.4, fov: 30 }
      : { dolly: 4.6, lift: -1.0, fov: 32 };

  return (
    <Canvas
      // `key` forces a fresh camera when the framing changes; R3F treats the
      // camera prop as initial state only.
      key={framing}
      camera={{ position: [0, 0, view.dolly], fov: view.fov, near: 0.05, far: 40 }}
      gl={{ antialias: true }}
      dpr={[1, 2]}
    >
      <hemisphereLight args={["#ffffff", "#c9d4e6", 1.35]} />
      <ambientLight intensity={0.32} />
      <directionalLight position={[-3.2, 5.5, 4.5]} intensity={1.9} />
      <directionalLight position={[4, 1.5, -3]} intensity={0.45} />

      <CartoonBoy
        position={[0, view.lift, 0]}
        rotation={[0, turn, 0]}
        idle={false}
        blink={false}
      />
    </Canvas>
  );
}
