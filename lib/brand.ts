/**
 * Single source of truth for brand colour.
 *
 * These values are sampled from the official BrainLIT logo artwork and are
 * mirrored in `app/globals.css` as Tailwind theme tokens. The 3D scene cannot
 * read CSS custom properties from inside a shader, so it imports from here.
 *
 * If a colour changes, it must change in BOTH places or the WebGL scene will
 * drift out of sync with the DOM.
 */

export const BRAND = {
  /** Left hemisphere, top of the ramp — logic, clarity */
  cyan: "#7aceeb",
  /** Primary brand blue */
  blue: "#5eaedd",
  /** Deep blue — bulb base, headings on light backgrounds */
  indigo: "#3f5ba6",
  /** Bridge between the two hemispheres */
  periwinkle: "#8777c8",
  /** Right hemisphere — creativity */
  violet: "#854fb4",
  /** Soft purple, backgrounds and particle tint */
  lilac: "#c68edc",
  /** The filament. The "LIT" moment. Used sparingly, on purpose. */
  spark: "#fcd057",
  sparkDeep: "#f0b429",
  /** Near-black canvas behind the 3D sections */
  ink: "#0b1020",
} as const;

export type BrandColor = keyof typeof BRAND;

/**
 * The wordmark gradient, in order. Used for both the CSS gradient and the
 * particle colour ramp so the 3D scene and the type share one identity.
 */
export const BRAND_RAMP = [
  BRAND.cyan,
  BRAND.blue,
  BRAND.periwinkle,
  BRAND.violet,
] as const;

/**
 * Particle palette for the 3D scene.
 *
 * Deliberately deeper than the logo's own colours. The scene sits on a white
 * page, and the logo ramp's light end (`cyan` at 1.8:1, `blue` at 2.5:1) is
 * close to invisible there. The mark itself may use those — logos are exempt
 * from contrast rules — but tens of thousands of small particles must actually
 * be seen, so they use readable equivalents that still read as the brand.
 *
 * `core` is warm orange rather than the `spark` yellow for the same reason:
 * yellow on white has almost no separation, so the ignition beat would land as
 * nothing at all.
 */
export const PARTICLE = {
  /** Brain hemispheres */
  left: "#3f7cbf",
  right: "#7d4bb0",
  /** Lightbulb screw base */
  base: "#2e3a80",
  /** Filament glow at the centre */
  core: "#ef9f2c",
  /** Circuit traces — deeper than the hemispheres so they read as lines
   *  drawn on top rather than dissolving into the fill behind them. */
  traceLeft: "#245e96",
  traceRight: "#5d3392",
  /** Rays and sparkles. A touch deeper than the logo's yellow, which measures
   *  under 2:1 on white and would simply vanish at particle scale. */
  spark: "#f2a922",
} as const;

/** Hex -> normalised RGB triplet, for passing into shader uniforms. */
export function toRgbTriplet(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;

  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ];
}
