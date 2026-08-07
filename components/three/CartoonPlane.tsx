"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * A stylised cartoon aeroplane, built entirely from Three.js primitives.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NO EXTERNAL ASSET. Every surface is generated at runtime from Lathe, Extrude,
 * Capsule, Sphere, Cylinder, Cone, Torus and Box geometry. Nothing is fetched,
 * nothing can 404, and the aircraft is re-proportioned by editing a number
 * rather than by re-exporting a model.
 *
 * Shape therefore comes from segment counts rather than from sculpting, so
 * nothing here is low-poly: the fuselage is a 72-segment lathe, every aerofoil
 * is bevel-extruded from a curve-only outline, and every edge that would
 * otherwise read as programmer art is bevelled or capped.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * LIVERY — this is the thing the first version got wrong.
 *
 * The reference aeroplane is TWO-TONE: a cyan upper shell over an orange lower
 * body, with orange cowling, wings and tail. Built with a single orange body it
 * came out a uniform orange lozenge with no read at all. The cyan is not an
 * accent here, it is half the aircraft, and it is what makes the silhouette
 * legible against a light background.
 *
 * PERFORMANCE
 *   · Seven materials, created once, shared by every mesh.
 *   · Every geometry memoised; nothing rebuilt on re-render.
 *   · Repeated detail — rivets, engine cylinders, cowl vents, panel lines,
 *     gear struts, stabiliser tips — drawn with InstancedMesh.
 *   · 38 draw calls for the whole aircraft:
 *       body 4 · engine 6 · propeller 4 · cockpit 8 · wings 6 · tail 5 · gear 5
 *     Counted as RENDERED meshes, not as source declarations — `Wing` is
 *     written once and rendered twice, which is how a first pass came in at 44
 *     while the header claimed 39.
 *
 *   `transmission` on the canopy makes the renderer run a separate full-scene
 *   pass every frame. It is the only transmissive surface for that reason.
 *
 * ORIENTATION
 *   Nose toward +Z, wings along X, up is +Y — glTF convention, so this drops
 *   into any rig that previously aimed a loaded model.
 */

/* ══════════════════════════════════════════════════════════════ palette ══ */

const COLORS = {
  orange: "#F28A3A",
  cyan: "#59D9E8",
  white: "#F6F4F2",
  metal: "#BFC4C8",
  darkMetal: "#575757",
  rubber: "#2B2B2B",
  glass: "#C8FFFF",
} as const;

type PlaneMaterials = {
  orange: THREE.MeshPhysicalMaterial;
  cyan: THREE.MeshPhysicalMaterial;
  white: THREE.MeshPhysicalMaterial;
  metal: THREE.MeshPhysicalMaterial;
  darkMetal: THREE.MeshPhysicalMaterial;
  rubber: THREE.MeshPhysicalMaterial;
  glass: THREE.MeshPhysicalMaterial;
};

/**
 * Painted bodywork: low roughness plus clearcoat.
 *
 * Clearcoat is what separates a toy from a plastic blob — a second thin
 * specular layer over the base, which is physically what a lacquered model
 * aeroplane has and visually what gives the highlight its tight, wet edge.
 */
function paint(color: string) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness: 0.32,
    metalness: 0.08,
    clearcoat: 0.95,
    clearcoatRoughness: 0.14,
  });
}

/* ═════════════════════════════════════════════════════════════ geometry ══ */

/**
 * Rounded wing planform.
 *
 * A Shape swept with bevelled ExtrudeGeometry rather than a scaled box. A box
 * has six flat faces and twelve hard edges and no lighting hides that at this
 * scale; a bevelled extrusion has a soft roll-off on every edge, which is the
 * single biggest contributor to the moulded-plastic read.
 *
 * Every segment is a quadratic curve, so there is no straight run anywhere on
 * the leading edge and the tip is fully round.
 */
function wingShape(span: number, rootChord: number, tipChord: number) {
  const s = new THREE.Shape();
  const halfRoot = rootChord / 2;
  const halfTip = tipChord / 2;

  s.moveTo(0, -halfRoot);
  s.quadraticCurveTo(span * 0.55, -halfRoot * 0.94, span, -halfTip);
  s.quadraticCurveTo(span + tipChord * 0.62, 0, span, halfTip);
  s.quadraticCurveTo(span * 0.55, halfRoot * 0.88, 0, halfRoot);
  s.lineTo(0, -halfRoot);
  return s;
}

/** Bevelled extrusion settings shared by every aerofoil surface. */
function extrudeOptions(thickness: number, bevel: number) {
  return {
    depth: thickness,
    bevelEnabled: true,
    bevelSegments: 6,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: 26,
  };
}

/**
 * Fuselage profile, revolved.
 *
 * A body built from stacked cylinders has a visible step at every junction; a
 * revolved profile is one continuous surface by construction, and its
 * silhouette is edited by moving two numbers rather than by re-fitting three
 * primitives to each other.
 */
const FUSELAGE_PROFILE: Array<[number, number]> = [
  [0.0, -1.14],
  [0.04, -1.06],
  [0.075, -0.93],
  [0.108, -0.74],
  [0.142, -0.5],
  [0.176, -0.2],
  [0.2, 0.08],
  [0.214, 0.34],
  [0.218, 0.56],
  [0.213, 0.74],
  [0.204, 0.87],
  [0.196, 0.95],
  [0.0, 0.98],
];

function fuselagePoints() {
  return FUSELAGE_PROFILE.map(([r, y]) => new THREE.Vector2(r, y));
}

/** Places instances around a ring, facing outward. */
function ringInstances(
  mesh: THREE.InstancedMesh,
  entries: Array<{ z: number; radius: number; count: number; scale?: number }>,
) {
  const dummy = new THREE.Object3D();
  let i = 0;

  for (const { z, radius, count, scale = 1 } of entries) {
    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * radius, Math.sin(a) * radius, z);
      dummy.rotation.set(0, 0, a);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i++, dummy.matrix);
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

/* ══════════════════════════════════════════════════════════════ parts ═══ */

type PartProps = { m: PlaneMaterials };

function Body({ m }: PartProps) {
  const fuselage = useMemo(
    () => new THREE.LatheGeometry(fuselagePoints(), 72),
    [],
  );

  /**
   * The cyan upper shell.
   *
   * A second lathe over the top half only — `phiStart`/`phiLength` cut it to a
   * half revolution — sitting four millimetres proud of the body so it reads as
   * a painted panel with a lip rather than as z-fighting.
   */
  const shell = useMemo(() => {
    const pts = FUSELAGE_PROFILE.slice(1, -1).map(
      ([r, y]) => new THREE.Vector2(r + 0.005, y),
    );
    return new THREE.LatheGeometry(pts, 48, -Math.PI * 0.62, Math.PI * 1.24);
  }, []);

  /** Panel lines: shallow rings, instanced into one call. */
  const panels = useMemo(() => {
    const g = new THREE.TorusGeometry(1, 0.0075, 8, 56);
    const mesh = new THREE.InstancedMesh(g, undefined, 3);
    const dummy = new THREE.Object3D();

    [-0.46, 0.06, 0.56].forEach((z, i) => {
      const r = 0.219 - Math.abs(z) * 0.052;
      dummy.position.set(0, 0, z);
      dummy.scale.set(r, r, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, []);

  /**
   * Rivets — eighty-four of them, one draw call.
   *
   * As individual meshes this alone would more than double the aircraft's draw
   * calls. Instanced, the per-instance matrices are computed once at mount and
   * never touched again.
   */
  const rivets = useMemo(() => {
    const g = new THREE.SphereGeometry(0.0085, 8, 6);
    const mesh = new THREE.InstancedMesh(g, undefined, 84);
    return ringInstances(mesh, [
      { z: -0.66, radius: 0.185, count: 21 },
      { z: -0.22, radius: 0.208, count: 21 },
      { z: 0.26, radius: 0.216, count: 21 },
      { z: 0.66, radius: 0.206, count: 21 },
    ]);
  }, []);

  return (
    <group>
      {/* The lathe revolves around Y; a quarter turn puts the nose at +Z. */}
      <mesh geometry={fuselage} material={m.orange} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={shell} material={m.cyan} rotation={[Math.PI / 2, 0, 0]} />
      <primitive object={panels} material={m.darkMetal} />
      <primitive object={rivets} material={m.metal} />
    </group>
  );
}

function Engine({ m }: PartProps) {
  const cowl = useMemo(() => new THREE.CylinderGeometry(0.278, 0.248, 0.22, 56), []);
  const lip = useMemo(() => new THREE.TorusGeometry(0.268, 0.034, 16, 56), []);
  const interior = useMemo(() => new THREE.CylinderGeometry(0.24, 0.24, 0.04, 40), []);

  /** Seven radial cylinders. */
  const pots = useMemo(() => {
    const g = new THREE.CapsuleGeometry(0.038, 0.055, 6, 16);
    const mesh = new THREE.InstancedMesh(g, undefined, 7);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
      dummy.position.set(Math.cos(a) * 0.148, Math.sin(a) * 0.148, 0.03);
      dummy.rotation.set(Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, []);

  /** Cooling vents around the cowl, and the metallic blades behind them. */
  const vents = useMemo(() => {
    const g = new THREE.BoxGeometry(0.02, 0.056, 0.014);
    const mesh = new THREE.InstancedMesh(g, undefined, 20);
    return ringInstances(mesh, [{ z: -0.07, radius: 0.228, count: 20 }]);
  }, []);

  const blades = useMemo(() => {
    const g = new THREE.BoxGeometry(0.014, 0.2, 0.05);
    const mesh = new THREE.InstancedMesh(g, undefined, 12);
    return ringInstances(mesh, [{ z: 0.055, radius: 0.11, count: 12 }]);
  }, []);

  return (
    <group position={[0, 0, 1.03]}>
      <mesh geometry={cowl} material={m.orange} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={lip} material={m.orange} position={[0, 0, 0.11]} />
      <mesh geometry={interior} material={m.darkMetal} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]} />
      <primitive object={blades} material={m.metal} />
      <primitive object={pots} material={m.metal} />
      <primitive object={vents} material={m.darkMetal} />
    </group>
  );
}

/**
 * Two blades on a spinner, on their own node so the group can turn.
 *
 * Blades are flattened capsules rather than boxes: a real propeller blade has a
 * rounded leading edge and a tapered tip, and a squashed capsule gives both
 * without a custom profile.
 */
function Propeller({
  m,
  spinRef,
}: PartProps & { spinRef: RefObject<THREE.Group | null> }) {
  const blade = useMemo(() => new THREE.CapsuleGeometry(0.05, 0.46, 8, 22), []);
  const spinner = useMemo(() => new THREE.ConeGeometry(0.075, 0.2, 36), []);
  const hub = useMemo(() => new THREE.SphereGeometry(0.064, 26, 18), []);

  return (
    <group ref={spinRef} position={[0, 0, 1.16]}>
      <mesh
        geometry={spinner}
        material={m.metal}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 0.085]}
      />
      <mesh geometry={hub} material={m.darkMetal} />
      {[0, Math.PI].map((a, i) => (
        <mesh
          key={i}
          geometry={blade}
          material={m.metal}
          rotation={[0, 0, a]}
          position={[Math.sin(a) * 0.29, Math.cos(a) * 0.29, 0]}
          scale={[1, 1, 0.32]}
        />
      ))}
    </group>
  );
}

function Cockpit({ m }: PartProps) {
  /**
   * Canopy: a revolved dome rather than a sphere segment.
   *
   * Its base meets the fuselage tangentially. A sphere intersecting a lathe
   * leaves a visible crease exactly where the eye lands first.
   */
  const canopy = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.0, 0.24),
      new THREE.Vector2(0.064, 0.232),
      new THREE.Vector2(0.118, 0.2),
      new THREE.Vector2(0.157, 0.15),
      new THREE.Vector2(0.18, 0.083),
      new THREE.Vector2(0.188, 0.0),
    ];
    return new THREE.LatheGeometry(pts, 52);
  }, []);

  const rim = useMemo(() => new THREE.TorusGeometry(0.182, 0.016, 14, 52), []);
  const arch = useMemo(
    () => new THREE.TorusGeometry(0.172, 0.013, 12, 36, Math.PI),
    [],
  );
  const seatBack = useMemo(() => new THREE.CapsuleGeometry(0.06, 0.105, 8, 22), []);
  const cushion = useMemo(() => new THREE.SphereGeometry(0.072, 26, 18), []);
  const dash = useMemo(() => new THREE.BoxGeometry(0.21, 0.08, 0.032), []);
  const yoke = useMemo(
    () => new THREE.TorusGeometry(0.054, 0.012, 12, 30, Math.PI * 1.35),
    [],
  );
  const column = useMemo(() => new THREE.CylinderGeometry(0.014, 0.017, 0.115, 18), []);

  return (
    <group position={[0, 0.2, 0.14]}>
      {/* Interior first, so it shows through the glass. */}
      <mesh
        geometry={cushion}
        material={m.darkMetal}
        position={[0, -0.078, -0.055]}
        scale={[1, 0.42, 1.06]}
      />
      <mesh
        geometry={seatBack}
        material={m.darkMetal}
        position={[0, -0.018, -0.118]}
        rotation={[0.24, 0, 0]}
      />
      <mesh
        geometry={dash}
        material={m.darkMetal}
        position={[0, -0.05, 0.118]}
        rotation={[-0.32, 0, 0]}
      />
      <mesh
        geometry={column}
        material={m.metal}
        position={[0, -0.076, 0.046]}
        rotation={[0.36, 0, 0]}
      />
      <mesh
        geometry={yoke}
        material={m.metal}
        position={[0, -0.026, 0.064]}
        rotation={[Math.PI * 0.82, 0, 0]}
      />

      {/* Framing, then glass over it. */}
      <mesh geometry={rim} material={m.white} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={arch} material={m.white} rotation={[0, Math.PI / 2, 0]} />
      <mesh geometry={canopy} material={m.glass} />
    </group>
  );
}

const WING = { span: 1.36, root: 0.58, tip: 0.31 } as const;

function Wing({ m, side }: PartProps & { side: -1 | 1 }) {
  const wing = useMemo(
    () =>
      new THREE.ExtrudeGeometry(
        wingShape(WING.span, WING.root, WING.tip),
        extrudeOptions(0.062, 0.028),
      ),
    [],
  );

  /**
   * The cyan stripe.
   *
   * A full-length spanwise band, not a token flash — in the reference it runs
   * most of the wing and is the second thing you see after the silhouette.
   * Floated a few millimetres above the surface so it cannot z-fight.
   */
  const stripe = useMemo(
    () =>
      new THREE.ExtrudeGeometry(
        wingShape(WING.span * 0.88, WING.root * 0.34, WING.tip * 0.4),
        extrudeOptions(0.014, 0.007),
      ),
    [],
  );

  const tip = useMemo(() => new THREE.CapsuleGeometry(0.062, 0.22, 8, 22), []);

  return (
    <group
      // Mirrored by scaling X: the planform is authored once for the right wing
      // and reused, which halves both the geometry and the code.
      scale={[side, 1, 1]}
      position={[0, -0.05, 0.04]}
      rotation={[0, 0, side === 1 ? -0.05 : 0.05]}
    >
      {/* Extrusions are built in XY and swept along Z, so the wing is laid flat
          by a quarter turn about X. */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh geometry={wing} material={m.orange} position={[0.15, 0, -0.031]} />
        <mesh geometry={stripe} material={m.cyan} position={[0.2, 0, 0.034]} />
      </group>
      <mesh
        geometry={tip}
        material={m.white}
        position={[WING.span + 0.15, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[1, 1, 0.4]}
      />
    </group>
  );
}

function Tail({ m }: PartProps) {
  const fin = useMemo(
    () =>
      new THREE.ExtrudeGeometry(
        wingShape(0.46, 0.44, 0.25),
        extrudeOptions(0.05, 0.022),
      ),
    [],
  );
  const stab = useMemo(
    () =>
      new THREE.ExtrudeGeometry(
        wingShape(0.44, 0.32, 0.19),
        extrudeOptions(0.044, 0.02),
      ),
    [],
  );
  const finTip = useMemo(() => new THREE.CapsuleGeometry(0.046, 0.16, 8, 18), []);

  /** The two horizontal stabiliser tips, instanced. */
  const stabTips = useMemo(() => {
    const g = new THREE.CapsuleGeometry(0.042, 0.13, 8, 16);
    const mesh = new THREE.InstancedMesh(g, undefined, 2);
    const dummy = new THREE.Object3D();

    [-1, 1].forEach((s, i) => {
      dummy.position.set(s * 0.48, 0.02, 0.04);
      dummy.rotation.set(Math.PI / 2, 0, 0);
      dummy.scale.set(0.9, 0.9, 0.4);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, []);

  return (
    <group position={[0, 0, -0.92]}>
      <group position={[0, 0.09, 0]}>
        <mesh
          geometry={fin}
          material={m.orange}
          rotation={[0, -Math.PI / 2, Math.PI / 2]}
          position={[0.025, 0, 0.022]}
        />
        <mesh
          geometry={finTip}
          material={m.white}
          position={[0, 0.49, 0.022]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[1, 1, 0.4]}
        />
      </group>

      {[-1, 1].map((s) => (
        <group key={s} scale={[s, 1, 1]} position={[0, 0.02, 0.04]}>
          <group rotation={[-Math.PI / 2, 0, 0]}>
            <mesh geometry={stab} material={m.orange} position={[0.055, 0, -0.022]} />
          </group>
        </group>
      ))}
      <primitive object={stabTips} material={m.white} />
    </group>
  );
}

/**
 * All three wheels: rubber tyre, cyan hub, orange centre.
 *
 * A torus for the tyre rather than a fat cylinder. A toy tyre's cross-section
 * is round, and a cylinder's square shoulder is the clearest tell that a wheel
 * was made of primitives.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * INSTANCED ACROSS ALL THREE WHEELS, not one component rendered three times.
 *
 * As a per-wheel component this was nine draw calls — the single largest item
 * on the aircraft and the reason the first version came in at 44 rather than
 * the claimed 39. Three InstancedMeshes carrying three instances each does the
 * same job in three calls and brings the total to 38.
 *
 * The two front wheels and the small tail wheel differ only in radius, which is
 * a per-instance scale. Rolling still works: the matrices are rewritten each
 * frame, which is nine matrix composes — nothing.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Wheel placements: [x, y, z, radius]. Front pair, then the tail wheel. */
const WHEELS: Array<[number, number, number, number]> = [
  [-0.35, -0.45, 0.33, 0.205],
  [0.35, -0.45, 0.33, 0.205],
  [0.0, -0.25, -1.06, 0.088],
];

/** Unit radius; per-instance scale sizes each wheel. */
const WHEEL_UNIT = 1;

function Wheels({
  m,
  rollRef,
}: PartProps & { rollRef: RefObject<number> }) {
  const tyre = useMemo(
    () => new THREE.TorusGeometry(WHEEL_UNIT * 0.72, WHEEL_UNIT * 0.36, 18, 44),
    [],
  );
  const hub = useMemo(
    () =>
      new THREE.CylinderGeometry(
        WHEEL_UNIT * 0.64,
        WHEEL_UNIT * 0.64,
        WHEEL_UNIT * 0.52,
        34,
      ),
    [],
  );
  const centre = useMemo(
    () =>
      new THREE.CylinderGeometry(
        WHEEL_UNIT * 0.3,
        WHEEL_UNIT * 0.3,
        WHEEL_UNIT * 0.6,
        26,
      ),
    [],
  );

  const tyres = useMemo(
    () => new THREE.InstancedMesh(tyre, undefined, WHEELS.length),
    [tyre],
  );
  const hubs = useMemo(
    () => new THREE.InstancedMesh(hub, undefined, WHEELS.length),
    [hub],
  );
  const centres = useMemo(
    () => new THREE.InstancedMesh(centre, undefined, WHEELS.length),
    [centre],
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    const roll = rollRef.current;

    WHEELS.forEach(([x, y, z, r], i) => {
      // Tyre: torus lies in its own XY plane, so a quarter turn about Y stands
      // it up across the aircraft. Rolling is then about the world X axis.
      dummy.position.set(x, y, z);
      dummy.rotation.set(roll, Math.PI / 2, 0);
      dummy.scale.setScalar(r);
      dummy.updateMatrix();
      tyres.setMatrixAt(i, dummy.matrix);

      // Hub and centre are cylinders along Y; they need the extra quarter turn
      // about X to lie along the axle.
      dummy.rotation.set(roll, Math.PI / 2, Math.PI / 2);
      dummy.updateMatrix();
      hubs.setMatrixAt(i, dummy.matrix);
      centres.setMatrixAt(i, dummy.matrix);
    });

    tyres.instanceMatrix.needsUpdate = true;
    hubs.instanceMatrix.needsUpdate = true;
    centres.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <primitive object={tyres} material={m.rubber} />
      <primitive object={hubs} material={m.cyan} />
      <primitive object={centres} material={m.orange} />
    </>
  );
}

function LandingGear({
  m,
  rollRef,
}: PartProps & { rollRef: RefObject<number> }) {
  /**
   * Legs, drag braces and the tail strut — six pieces, one draw call.
   *
   * Instancing costs a little clarity in the source and buys five draw calls
   * back, which is what keeps the whole aircraft under forty.
   */
  const struts = useMemo(() => {
    const g = new THREE.CapsuleGeometry(0.026, 0.3, 8, 18);
    const mesh = new THREE.InstancedMesh(g, undefined, 6);
    const dummy = new THREE.Object3D();
    let i = 0;

    for (const s of [-1, 1]) {
      // Main leg, raked out and forward.
      dummy.position.set(s * 0.25, -0.29, 0.29);
      dummy.rotation.set(0.17, 0, s * 0.47);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i++, dummy.matrix);

      // Drag brace back to the fuselage.
      dummy.position.set(s * 0.18, -0.25, 0.12);
      dummy.rotation.set(-0.74, 0, s * 0.3);
      dummy.scale.set(0.74, 0.84, 0.74);
      dummy.updateMatrix();
      mesh.setMatrixAt(i++, dummy.matrix);
    }

    // Tail strut.
    dummy.position.set(0, -0.13, -1.02);
    dummy.rotation.set(0.36, 0, 0);
    dummy.scale.set(0.66, 0.5, 0.66);
    dummy.updateMatrix();
    mesh.setMatrixAt(i++, dummy.matrix);

    // Spare instance parked inside the fuselage — InstancedMesh draws its full
    // count regardless, so an unused slot must go somewhere invisible.
    dummy.position.set(0, 0, 0);
    dummy.scale.setScalar(0.001);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);

    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, []);

  /** Suspension coils at the top of each main leg. */
  const coils = useMemo(() => {
    const g = new THREE.TorusGeometry(0.032, 0.0095, 10, 26);
    const mesh = new THREE.InstancedMesh(g, undefined, 2);
    const dummy = new THREE.Object3D();

    [-1, 1].forEach((s, i) => {
      dummy.position.set(s * 0.16, -0.16, 0.31);
      dummy.rotation.set(0, Math.PI / 2, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, []);

  return (
    <group>
      <primitive object={struts} material={m.metal} />
      <primitive object={coils} material={m.darkMetal} />
      <Wheels m={m} rollRef={rollRef} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════ component ══ */

export type CartoonPlaneProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  /** Gentle bob and rock. Turn OFF when a parent drives the transform. */
  float?: boolean;
  spinPropeller?: boolean;
};

export function CartoonPlane({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  float = true,
  spinPropeller = true,
}: CartoonPlaneProps) {
  const floatRef = useRef<THREE.Group>(null);
  const propRef = useRef<THREE.Group>(null);
  // Wheel roll is a single number rather than three refs: all three wheels
  // touch the same ground, so they roll together by definition.
  const rollRef = useRef(0);

  /**
   * Seven materials for the whole aircraft, created once.
   *
   * Every mesh takes one by reference. Creating a material inline inside JSX —
   * the obvious thing to write — compiles a new shader program per mesh per
   * re-render, which is both a leak and a first-frame stall.
   */
  const m = useMemo<PlaneMaterials>(
    () => ({
      orange: paint(COLORS.orange),
      cyan: paint(COLORS.cyan),
      white: paint(COLORS.white),
      metal: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(COLORS.metal),
        roughness: 0.26,
        metalness: 0.88,
        clearcoat: 0.45,
      }),
      darkMetal: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(COLORS.darkMetal),
        roughness: 0.44,
        metalness: 0.72,
      }),
      rubber: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(COLORS.rubber),
        roughness: 0.93,
        metalness: 0,
        clearcoat: 0.14,
      }),
      /**
       * The canopy, and the only transmissive surface on the aircraft.
       *
       * `transmission` makes the renderer capture what is behind the surface in
       * a separate pass. That is what produces real glass — you can see the
       * seat through it — and it is also why exactly one mesh gets it.
       */
      glass: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(COLORS.glass),
        transmission: 0.92,
        thickness: 0.2,
        roughness: 0.05,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        ior: 1.42,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      }),
    }),
    [],
  );

  // Materials hold compiled GPU programs; React dropping the object does not
  // release them.
  useEffect(() => {
    return () => {
      for (const material of Object.values(m)) material.dispose();
    };
  }, [m]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (float && floatRef.current) {
      // Two frequencies rather than one, so the motion never visibly repeats on
      // a short loop the way a single sine does.
      floatRef.current.position.y =
        Math.sin(t * 1.1) * 0.055 + Math.sin(t * 0.47) * 0.03;
      floatRef.current.rotation.z = Math.sin(t * 0.83) * 0.055;
      floatRef.current.rotation.x = Math.sin(t * 0.61) * 0.03;
    }

    if (spinPropeller && propRef.current) {
      // Frame-rate independent: a fixed per-frame increment spins at different
      // speeds on a 60Hz and a 144Hz display.
      propRef.current.rotation.z += delta * 26;
    }

    rollRef.current += delta * 1.6;
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group ref={floatRef}>
        <Body m={m} />
        <Engine m={m} />
        <Propeller m={m} spinRef={propRef} />
        <Cockpit m={m} />
        <Wing m={m} side={-1} />
        <Wing m={m} side={1} />
        <Tail m={m} />
        <LandingGear m={m} rollRef={rollRef} />
      </group>
    </group>
  );
}

export default CartoonPlane;
