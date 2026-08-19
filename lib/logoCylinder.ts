import * as THREE from "three";

/**
 * A drum of flat plates turning about a vertical axis.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Written for a "trusted by" logo wall and used here for session photographs,
 * which is the same problem wearing different art: N rectangles, evenly spaced
 * around a circumference, turning slowly, legible three or four at a time.
 *
 * Everything that decides how it LOOKS is an option. Everything that decides
 * whether it WORKS is one of four calculations:
 *
 *   1. the luminance key        — see FRAGMENT
 *   2. front faces plus a fade  — see `facingOpacity`
 *   3. repeating the set        — see `layout`
 *   4. radius from plate COUNT  — see `layout`
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type LogoCylinderLogo = {
  src: string;
  /** Used for the accessible list, and for the placeholder if `src` fails. */
  label: string;
};

export type LogoCylinderOptions = {
  container: HTMLElement;
  logos: LogoCylinderLogo[];
  color?: string;
  /**
   * Drop a white paper background out of the art. TRUE for scanned or
   * flattened logos, FALSE for photographs and transparent PNGs — see FRAGMENT
   * for what it does to a photograph.
   */
  keyWhiteBackground?: boolean;
  /** Radians per second. */
  spinSpeed?: number;
  /** How many times the set is wrapped around the drum. */
  repeat?: number;
  /** Plate width in world units. Fixed, so a plate is one size on every screen. */
  plateWidth?: number;
  /** Plate width divided by height. */
  aspect?: number;
  /** Radians about X. The camera looks down on the drum by this much. */
  tilt?: number;
  /** How many plates the camera should frame across the front. */
  logosInView?: number;
  radius?: number | "auto";
  reactToScroll?: boolean;
  maxDpr?: number;
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. THE LUMINANCE KEY.
 *
 * Client logos arrive as dark ink on solid white. Dropped on a dark page they
 * read as white cards with something in the middle — the paper becomes the
 * loudest thing on screen. Rather than re-cutting every asset, the shader keys
 * on brightness: ink survives, paper drops out.
 *
 * `smoothstep(0.95, 0.35, lum)` runs BACKWARDS on purpose — high luminance maps
 * to 0 and disappears, low luminance maps to 1 and stays.
 *
 * TWO FAILURES IT CANNOT FIX. A logo that is a solid dark shape with white text
 * knocked out of it inverts into a filled blob, because the white text is
 * exactly what the key removes; those need real transparent art. And a
 * PHOTOGRAPH keyed this way is destroyed — every bright area becomes a hole —
 * which is why `keyWhiteBackground` defaults to false.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uKey;
  varying vec2 vUv;

  void main() {
    vec4 tex = texture2D(uMap, vUv);

    if (uKey > 0.5) {
      float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
      float alpha = smoothstep(0.95, 0.35, lum) * tex.a;
      gl_FragColor = vec4(uColor, alpha * uOpacity);
    } else {
      gl_FragColor = vec4(tex.rgb, tex.a * uOpacity);
    }

    if (gl_FragColor.a < 0.01) discard;
  }
`;

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 2. FRONT FACES, PLUS A FADE ON HOW SQUARE-ON THE PLATE IS.
 *
 * Culling backfaces stops the far half of the drum showing through the near
 * half, mirrored. That alone is not enough: a plate at 90 degrees is a
 * one-pixel sliver, and six slivers at once read as noise rather than as depth.
 * So each plate also fades by how much it faces the camera.
 *
 * The `+0.1 / 1.1` bias takes a plate out slightly BEFORE it turns edge-on, and
 * `pow(…, 0.8)` holds the front of the range open so the three or four plates
 * that matter stay at full strength.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function facingOpacity(worldZ: number, radius: number): number {
  const facing = Math.min(1, Math.max(-1, worldZ / radius));
  return Math.pow(Math.min(1, Math.max(0, (facing + 0.1) / 1.1)), 0.8);
}

export type CylinderLayout = {
  plateCount: number;
  radius: number;
  step: number;
  plateHeight: number;
  cameraZ: number;
  groupLift: number;
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 3 AND 4. HOW MANY PLATES, HOW BIG THE DRUM, WHERE THE CAMERA GOES.
 *
 * REPEAT THE SET. The angular step is `2π / count` and takes no notice of the
 * radius, so eight logos sit 45 degrees apart and every neighbour of the front
 * plate is already foreshortened into a sliver. The wall reads one logo at a
 * time and no amount of resizing changes it, because resizing does not change
 * the angle. Wrapping the set twice halves the step to 22.5 degrees, where a
 * neighbour keeps about 92% of its width and three or four are legible at once.
 *
 * RADIUS COMES FROM THE PLATE COUNT, NOT THE VIEWPORT. Sizing the drum to the
 * container looks right on a square box and falls apart on a wide short one:
 * the radius maxes out, the plates fling to the edges, and two stay in frame.
 * Instead the plate is a fixed world size, exactly enough circumference is
 * wrapped around the set, and the CAMERA moves to frame it. A plate is then the
 * same size on every screen.
 *
 * THE TILT COMPENSATION. Turning the drum about X swings its front face down by
 * `R·sin(tilt)`, and at a large radius that is enough to push the front plates
 * out of frame entirely. The group is lifted by the same amount.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function layout(opts: {
  logoCount: number;
  repeat: number;
  plateWidth: number;
  aspect: number;
  tilt: number;
  logosInView: number;
  radius: number | "auto";
  fovDeg: number;
  viewportAspect: number;
}): CylinderLayout {
  const plateCount = Math.max(1, opts.logoCount * opts.repeat);
  const plateHeight = opts.plateWidth / opts.aspect;

  // 0.72 leaves a gap between plates. At 1.0 they touch and the drum reads as a
  // solid barrel; below about 0.6 the gaps are wider than the plates.
  const GAP = 0.72;
  const radius =
    opts.radius === "auto"
      ? (plateCount * opts.plateWidth) / (GAP * 2 * Math.PI)
      : opts.radius;

  // Fewer, larger plates on a narrow container. Three tiny ones on a phone is
  // worse than one you can actually see.
  const inView =
    opts.viewportAspect < 2 ? Math.max(2, opts.logosInView - 2) : opts.logosInView;

  const halfFov = (opts.fovDeg * Math.PI) / 360;
  const wantWidth = inView * opts.plateWidth * 1.15;
  const distForWidth = wantWidth / 2 / (Math.tan(halfFov) * opts.viewportAspect);
  const distForHeight = (plateHeight * 1.7) / 2 / Math.tan(halfFov);

  return {
    plateCount,
    radius,
    step: (2 * Math.PI) / plateCount,
    plateHeight,
    cameraZ: radius + Math.max(distForWidth, distForHeight, 1.5),
    groupLift: radius * Math.sin(opts.tilt),
  };
}

/** A tinted plate carrying its label, for art that has not arrived yet. */
export function placeholderTexture(label: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, "#3f5ba6");
    grad.addColorStop(1, "#7c4bb0");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "500 26px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label.slice(0, 34), 256, 128);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function makePlateMaterial(
  map: THREE.Texture,
  color: string,
  key: boolean,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uMap: { value: map },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 1 },
      uKey: { value: key ? 1 : 0 },
    },
    transparent: true,
    // Front faces only — see `facingOpacity` for why that is half the fix.
    side: THREE.FrontSide,
    // Transparent plates that write depth occlude the ones behind them in
    // whatever order they happen to be drawn.
    depthWrite: false,
  });
}

export const CYLINDER_DEFAULTS = {
  color: "#ffffff",
  keyWhiteBackground: false,
  spinSpeed: 0.24,
  repeat: 2,
  plateWidth: 2.4,
  aspect: 2,
  tilt: 0.12,
  logosInView: 4,
  radius: "auto" as number | "auto",
  reactToScroll: false,
  maxDpr: 1.75,
};

/**
 * The portable entry point: `new LogoCylinder({ container, logos })` in any
 * page, React or not. The React Three Fiber version is in
 * components/three/LogoDrum.tsx and shares every calculation above.
 */
export class LogoCylinder {
  private opts: typeof CYLINDER_DEFAULTS & {
    container: HTMLElement;
    logos: LogoCylinderLogo[];
  };
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private group = new THREE.Group();
  private meshes: THREE.Mesh[] = [];
  private textures: THREE.Texture[] = [];
  private geometry: THREE.PlaneGeometry;
  private world = new THREE.Vector3();
  private layoutValues!: CylinderLayout;
  private raf = 0;
  private last = 0;
  private spin = 0;
  private scrollKick = 0;
  private lastScrollY = 0;
  private onScreen = true;
  private reduced = false;
  private observer?: IntersectionObserver;
  private destroyed = false;

  constructor(options: LogoCylinderOptions) {
    this.opts = { ...CYLINDER_DEFAULTS, ...options };

    const { container } = this.opts;
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.opts.maxDpr));
    this.renderer.setSize(container.clientWidth, Math.max(1, container.clientHeight));
    this.renderer.setClearColor(0x000000, 0);

    const canvas = this.renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    // Decoration. A full-width canvas that swallows swipes is a real problem on
    // a phone, and there is nothing here to interact with.
    canvas.style.pointerEvents = "none";
    container.appendChild(canvas);

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    this.scene.add(this.group);
    this.geometry = new THREE.PlaneGeometry(1, 1);

    this.build();
    this.resize();

    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.onScreen = entry.isIntersecting;
        if (this.onScreen) this.start();
        else this.stop();
      },
      { threshold: 0.01 },
    );
    this.observer.observe(container);

    window.addEventListener("resize", this.resize);
    document.addEventListener("visibilitychange", this.onVisibility);
    if (this.opts.reactToScroll) {
      this.lastScrollY = window.scrollY;
      window.addEventListener("scroll", this.onScroll, { passive: true });
    }

    if (this.reduced) {
      // WCAG 2.3.3: one frame, then nothing.
      this.update(0);
      this.renderer.render(this.scene, this.camera);
    } else {
      this.start();
    }
  }

  private build() {
    const { logos, repeat, color, keyWhiteBackground } = this.opts;
    const loader = new THREE.TextureLoader();

    for (let i = 0; i < logos.length * repeat; i++) {
      const logo = logos[i % logos.length];

      const texture = loader.load(
        logo.src,
        (loaded) => {
          loaded.colorSpace = THREE.SRGBColorSpace;
        },
        undefined,
        () => {
          // Art that has not arrived. A placeholder keeps the geometry
          // judgeable instead of leaving a hole in the drum.
          const fallback = placeholderTexture(logo.label);
          material.uniforms.uMap.value = fallback;
          this.textures.push(fallback);
        },
      );
      texture.colorSpace = THREE.SRGBColorSpace;
      this.textures.push(texture);

      const material = makePlateMaterial(texture, color, keyWhiteBackground);
      const mesh = new THREE.Mesh(this.geometry, material);
      this.group.add(mesh);
      this.meshes.push(mesh);
    }
  }

  private resize = () => {
    if (this.destroyed) return;
    const { container } = this.opts;
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.opts.maxDpr));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;

    this.layoutValues = layout({
      logoCount: this.opts.logos.length,
      repeat: this.opts.repeat,
      plateWidth: this.opts.plateWidth,
      aspect: this.opts.aspect,
      tilt: this.opts.tilt,
      logosInView: this.opts.logosInView,
      radius: this.opts.radius,
      fovDeg: this.camera.fov,
      viewportAspect: this.camera.aspect,
    });

    const { radius, step, plateHeight, cameraZ, groupLift } = this.layoutValues;

    this.meshes.forEach((mesh, i) => {
      const angle = i * step;
      mesh.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
      // Faces outward, which is what puts its front to the camera at the front
      // of the drum.
      mesh.rotation.y = angle;
      mesh.scale.set(this.opts.plateWidth, plateHeight, 1);
    });

    this.group.rotation.x = this.opts.tilt;
    this.group.position.y = groupLift;

    this.camera.position.set(0, 0, cameraZ);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();

    if (this.reduced) this.renderer.render(this.scene, this.camera);
  };

  private onVisibility = () => {
    if (document.hidden) this.stop();
    else if (this.onScreen) this.start();
  };

  private onScroll = () => {
    const delta = window.scrollY - this.lastScrollY;
    this.lastScrollY = window.scrollY;
    this.scrollKick += delta * 0.0009;
  };

  private update(dt: number) {
    this.spin += (this.opts.spinSpeed + this.scrollKick) * dt;
    // Decays, so a flick of the wheel is a nudge rather than a new speed.
    this.scrollKick *= Math.pow(0.02, dt);
    this.group.rotation.y = this.spin;

    // A slow wobble, so it never settles into reading as a flat carousel seen
    // head on.
    this.group.rotation.z = Math.sin(this.spin * 0.5) * 0.02;

    this.group.updateWorldMatrix(true, true);
    for (const mesh of this.meshes) {
      mesh.getWorldPosition(this.world);
      const material = mesh.material as THREE.ShaderMaterial;
      material.uniforms.uOpacity.value = facingOpacity(
        this.world.z,
        this.layoutValues.radius,
      );
    }
  }

  private frame = (now: number) => {
    if (this.destroyed) return;
    const dt = this.last ? Math.min((now - this.last) / 1000, 0.05) : 0;
    this.last = now;
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.frame);
  };

  start() {
    if (this.reduced || this.raf || this.destroyed || document.hidden) return;
    this.last = 0;
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    if (!this.raf) return;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  destroy() {
    this.destroyed = true;
    this.stop();
    this.observer?.disconnect();
    window.removeEventListener("resize", this.resize);
    document.removeEventListener("visibilitychange", this.onVisibility);
    window.removeEventListener("scroll", this.onScroll);

    for (const mesh of this.meshes) (mesh.material as THREE.Material).dispose();
    for (const texture of this.textures) texture.dispose();
    this.geometry.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
