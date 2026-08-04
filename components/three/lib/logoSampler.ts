/**
 * Builds the particle cloud by sampling the actual logo artwork.
 *
 * The previous approach re-declared the mark as hand-written geometry — lobes,
 * bars, rays — and every detail that was slightly off made the result read as
 * "a brain-ish cloud" rather than "the BrainLIT logo". Fidelity was capped by
 * how well the primitives were transcribed.
 *
 * This instead rasterises `brainlit-mark.svg` to an offscreen canvas and drops
 * a particle on opaque pixels, taking each particle's colour from the pixel it
 * landed on. Fidelity is structural: the cloud cannot drift from the artwork,
 * because it is made of the artwork. Update the SVG and the 3D updates with it.
 *
 * Cost is one ~2KB SVG fetch and a single canvas readback at startup.
 */

/** Raster resolution. High enough that hairline circuit traces survive. */
const RASTER = 440;

/** Alpha below this is antialiased fringe — sampling it produces a soft halo
 *  of near-transparent particles around every edge. */
const ALPHA_FLOOR = 140;

/** World-space width of the finished mark. */
const WORLD_WIDTH = 3.1;

/**
 * Darkening applied to sampled colours. 1.0 / 1.0 = the artwork untouched.
 *
 * Two reasons the raw artwork colours are too light here. Dots cover only part
 * of the area a solid fill would, so white page shows through the gaps and the
 * mark reads paler than the logo does. And the logo's own light end — cyan at
 * roughly 1.8:1 against white — was chosen for a solid shape, not for thousands
 * of small dots.
 *
 * Gamma rather than a flat multiply. Scaling every channel equally drags a
 * colour toward grey: the yellow rays would come out olive-brown. Raising each
 * channel to a power deepens the light channels more than the dark ones, which
 * darkens while *increasing* saturation, so the hues stay recognisably the
 * brand.
 */
const LOGO_GAMMA = 1.7;
const LOGO_SCALE = 0.95;

/**
 * A single muted periwinkle for every field dot — a desaturated point on the
 * brand ramp, sitting between the blue and violet hemispheres so it belongs to
 * the palette without pulling toward either side.
 */
const FIELD_COLOR: readonly [number, number, number] = [0.53, 0.56, 0.72];

function deepen(channel: number, gamma: number, scale = 1): number {
  return Math.min(1, Math.pow(channel, gamma) * scale);
}

/**
 * Share of the budget spent on the ambient field that fills the rest of the
 * screen, as opposed to the logo itself.
 */
const AMBIENT_SHARE = 0.55;

/**
 * Extent of the ambient field in world units. Wide enough to cover an ultrawide
 * viewport without its edges showing, but no wider — every unit of margin
 * beyond that spends dots off-screen and thins the spacing of the ones you can
 * actually see.
 */
const FIELD = { halfWidth: 5.2, halfHeight: 2.9 } as const;

/**
 * Layout of the background dot field.
 *
 * All three are regular by design — see the note at the ambient loop for why
 * randomness reads as dust rather than texture.
 */
export type FieldPattern = "grid" | "stagger" | "rings";

/**
 * The site uses `stagger`. A triangular lattice has no unbroken horizontal or
 * vertical line running across the screen, so it stays regular without reading
 * as graph paper — and unlike `rings` it creates no focal point of its own to
 * compete with the mark sitting at centre.
 */

export type LogoCloud = {
  target: Float32Array;
  scatter: Float32Array;
  /** Per-particle RGB, lifted straight from the artwork */
  color: Float32Array;
  /** −1 left hemisphere, +1 right, 0 for the centre column and the base */
  side: Float32Array;
  /** 0..1 proximity to the filament, drives the ignition */
  ignite: Float32Array;
  /** 1 for background field dots, 0 for dots that belong to the logo */
  ambient: Float32Array;
  seed: Float32Array;
  count: number;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function rasterise(url: string): Promise<ImageData> {
  const image = new Image();
  image.src = url;
  // decode() rejects on a broken or blocked asset, instead of silently
  // drawing nothing and leaving us to sample an empty canvas.
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = RASTER;
  canvas.height = RASTER;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas unavailable for logo sampling");

  ctx.drawImage(image, 0, 0, RASTER, RASTER);
  return ctx.getImageData(0, 0, RASTER, RASTER);
}

/**
 * Positions for the background field, in world units.
 *
 * Each pattern aims for `wanted` points but returns whatever its geometry
 * naturally produces — forcing an exact count would mean breaking the very
 * regularity that makes these read as designed.
 */
function buildFieldPositions(
  wanted: number,
  pattern: FieldPattern,
): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  const { halfWidth: HW, halfHeight: HH } = FIELD;

  if (pattern === "rings") {
    // Concentric circles, with dots spaced along each ring at the same interval
    // as the rings themselves — so density stays even from centre to edge
    // instead of crowding at the middle.
    const area = HW * 2 * HH * 2;
    const spacing = Math.sqrt(area / wanted);
    const maxRadius = Math.hypot(HW, HH);

    points.push([0, 0]);
    for (let r = spacing; r <= maxRadius; r += spacing) {
      const perRing = Math.max(6, Math.round((2 * Math.PI * r) / spacing));
      // Rotate each ring slightly so the dots do not line up into spokes
      // radiating from the centre.
      const offset = (r / spacing) * 0.6;
      for (let k = 0; k < perRing; k++) {
        const angle = (k / perRing) * Math.PI * 2 + offset;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (Math.abs(x) <= HW && Math.abs(y) <= HH) points.push([x, y]);
      }
    }
    return points;
  }

  // Grid and stagger share a lattice; stagger offsets alternate rows by half a
  // cell, which turns squares into triangles. The eye reads a triangular
  // lattice as softer because there is no continuous horizontal or vertical
  // line running across the screen.
  const aspect = HW / HH;
  const columns = Math.max(1, Math.round(Math.sqrt(wanted * aspect)));
  const rows = Math.max(1, Math.ceil(wanted / columns));
  const cellW = (HW * 2) / columns;
  const cellH = (HH * 2) / rows;

  for (let row = 0; row < rows; row++) {
    const shift = pattern === "stagger" && row % 2 === 1 ? cellW / 2 : 0;
    for (let col = 0; col < columns; col++) {
      const x = -HW + (col + 0.5) * cellW + shift;
      const y = -HH + (row + 0.5) * cellH;
      if (x > HW) continue; // the shifted row's last dot falls off the edge
      points.push([x, y]);
    }
  }

  return points;
}

export async function sampleLogoCloud(
  count: number,
  pattern: FieldPattern = "stagger",
  url = "/brainlit-mark.svg",
  seed = 0x8a17,
): Promise<LogoCloud> {
  const pixels = await rasterise(url);
  const data = pixels.data;

  // Collect every opaque pixel once, then draw from that pool. Rejection
  // sampling against the bitmap would waste most attempts on empty space —
  // the mark covers well under half its own bounding box.
  const opaque: number[] = [];
  for (let i = 0; i < RASTER * RASTER; i++) {
    if (data[i * 4 + 3] >= ALPHA_FLOOR) opaque.push(i);
  }

  if (opaque.length === 0) {
    throw new Error("logo rasterised to nothing — check the SVG path");
  }

  const rand = mulberry32(seed);

  const logoCount = count - Math.round(count * AMBIENT_SHARE);

  // The field is laid out before allocating, because a regular pattern yields
  // whatever count its geometry produces — rings especially. Sizing the buffers
  // to the real total beats trimming the pattern to hit a round number.
  const fieldPositions = buildFieldPositions(
    Math.round(count * AMBIENT_SHARE),
    pattern,
  );
  const total = logoCount + fieldPositions.length;

  const target = new Float32Array(total * 3);
  const scatter = new Float32Array(total * 3);
  const color = new Float32Array(total * 3);
  const side = new Float32Array(total);
  const ignite = new Float32Array(total);
  const ambient = new Float32Array(total);
  const seeds = new Float32Array(total);

  // Centre of the filament glow, in raster coordinates. Taken from the SVG's
  // own glow ellipse (cx 100, cy 103 in a -10..210 viewBox).
  const coreX = ((100 + 10) / 220) * RASTER;
  const coreY = (103 / 220) * RASTER;
  const coreRadius = (46 / 220) * RASTER;

  const scale = WORLD_WIDTH / RASTER;

  for (let i = 0; i < logoCount; i++) {
    const pixel = opaque[Math.floor(rand() * opaque.length)];
    const px = pixel % RASTER;
    const py = Math.floor(pixel / RASTER);

    const i3 = i * 3;

    // Jitter within the pixel so a particle count above the pixel count does
    // not produce visible stacking on a grid.
    const jx = px + rand();
    const jy = py + rand();

    target[i3] = (jx - RASTER / 2) * scale;
    target[i3 + 1] = -(jy - RASTER / 2) * scale;
    // Shallow depth. The artwork is flat; this only stops it looking like a
    // decal when the cloud tilts toward the cursor.
    target[i3 + 2] = (rand() * 2 - 1) * 0.09;

    const o = pixel * 4;
    color[i3] = deepen(data[o] / 255, LOGO_GAMMA, LOGO_SCALE);
    color[i3 + 1] = deepen(data[o + 1] / 255, LOGO_GAMMA, LOGO_SCALE);
    color[i3 + 2] = deepen(data[o + 2] / 255, LOGO_GAMMA, LOGO_SCALE);

    // Scattered start: a loose shell, biased outward so convergence reads as
    // "gathering in" rather than "expanding out".
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(rand() * 2 - 1);
    const radius = 2.4 + rand() * 2.2;
    scatter[i3] = Math.sin(phi) * Math.cos(theta) * radius;
    scatter[i3 + 1] = Math.sin(phi) * Math.sin(theta) * radius * 0.7;
    scatter[i3 + 2] = Math.cos(phi) * radius * 0.5;

    // The centre column (fissure) and everything below the brain must hold
    // still while the hemispheres part, or the mark tears apart.
    const centreOffset = jx - RASTER / 2;
    const belowBrain = py > (150 / 220) * RASTER;
    side[i] =
      belowBrain || Math.abs(centreOffset) < RASTER * 0.016
        ? 0
        : Math.sign(centreOffset);

    ignite[i] =
      Math.max(0, 1 - Math.hypot(jx - coreX, jy - coreY) / coreRadius) ** 1.8;

    seeds[i] = rand();
  }

  // ---------------------------------------------------------------------------
  // Ambient field — the dots that fill the rest of the screen.
  //
  // A STRICT grid. No jitter, no depth offset, no per-dot size or colour
  // variation.
  //
  // This was previously a jittered grid, on the theory that randomness looks
  // organic. It does not — it looks like dust on the screen. Regularity is what
  // makes a dot field read as deliberate: the eye recognises the lattice and
  // stops trying to find meaning in individual dots, exactly like perforated
  // paper or a halftone. Every axis of randomness added here (position, size,
  // depth, colour) is one more reason for it to read as dirt instead of design.
  //
  // The dots are also kept at z = 0. Depth variation changes each dot's
  // projected size and shifts it independently under camera tilt, which
  // destroys the lattice the moment the cursor moves.
  // ---------------------------------------------------------------------------
  for (let n = 0; n < fieldPositions.length; n++) {
    const i = logoCount + n;
    const i3 = i * 3;

    const [x, y] = fieldPositions[n];

    target[i3] = x;
    target[i3 + 1] = y;
    target[i3 + 2] = 0;

    // Field dots are always in place, so their scatter position is their home.
    // They are the background; they do not fly in on scroll.
    scatter[i3] = x;
    scatter[i3 + 1] = y;
    scatter[i3 + 2] = 0;

    // One flat colour for the entire field. A gradient across the field reads
    // as an uneven smudge at this dot size, not as a gradient.
    color[i3] = FIELD_COLOR[0];
    color[i3 + 1] = FIELD_COLOR[1];
    color[i3 + 2] = FIELD_COLOR[2];

    side[i] = 0;
    ignite[i] = 0;
    ambient[i] = 1;
    seeds[i] = rand();
  }

  return {
    target,
    scatter,
    color,
    side,
    ignite,
    ambient,
    seed: seeds,
    count: total,
  };
}
