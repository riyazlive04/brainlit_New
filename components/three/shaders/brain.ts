/**
 * Logo particle shaders.
 *
 * Written as template strings rather than `.glsl` files so no bundler loader is
 * needed — one less thing to configure and one less thing to break on a Next
 * major upgrade.
 *
 * Two populations share one draw call:
 *   · logo dots   — sampled from the artwork, they form the mark on scroll
 *   · ambient dots — a jittered field filling the rest of the screen
 * `aAmbient` selects between the two behaviours. Keeping them in one geometry
 * means the background costs no extra draw call and both react to a click
 * together.
 *
 * Colour arrives per-particle in `aColor`, sampled from the logo itself, so the
 * shader never decides what anything should look like — it only moves dots and
 * blends toward the ignition colour.
 *
 * Particles are opaque and normally blended. The usual additive-glow look only
 * reads as light on a dark canvas; on a white page it converges to invisible.
 *
 * All motion happens on the GPU. Nothing animates a position on the CPU, which
 * is what lets the dot count scale without touching frame time.
 */

export const brainVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uForm;        // 0 scattered -> 1 formed
  uniform float uSplit;       // hemisphere separation
  uniform float uIgnite;      // filament ignition
  uniform float uDisperse;    // final upward dispersal
  uniform vec2  uPointer;     // -1..1, cursor parallax
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3  uColorCore;

  // Click ripple
  uniform vec2  uClickPos;    // in this group's local space
  uniform float uClickAge;    // seconds since the click
  uniform float uClickActive; // 0 or 1

  attribute vec3  aScatter;
  attribute vec3  aColor;
  attribute float aSide;
  attribute float aIgnite;
  attribute float aAmbient;
  attribute float aSeed;

  varying vec3  vColor;
  varying float vAlpha;

  /** Speed of the ripple front, in world units per second. */
  const float WAVE_SPEED = 3.4;
  /** How long a ripple lives. Must match the CPU-side reset. */
  const float WAVE_LIFE = 3.2;

  void main() {
    float s = aSeed;

    // --- unformed drift ------------------------------------------------------
    vec3 scattered = aScatter;
    scattered.x += sin(uTime * 0.35 + s * 31.4) * 0.22;
    scattered.y += cos(uTime * 0.28 + s * 17.7) * 0.22;
    scattered.z += sin(uTime * 0.31 + s * 23.1) * 0.18;

    // --- formation -----------------------------------------------------------
    // Each dot starts converging at a slightly different moment, so the mark
    // assembles as a wave instead of snapping into place all at once.
    float stagger = s * 0.35;
    float f = clamp((uForm - stagger) / max(1.0 - stagger, 0.0001), 0.0, 1.0);
    f = f * f * (3.0 - 2.0 * f);

    // Ambient dots are the background: always present, never forming.
    float form = mix(f, 1.0, aAmbient);
    vec3 pos = mix(scattered, position, form);

    // The field deliberately does NOT wander. Per-dot drift breaks the lattice
    // and the grid immediately reads as scattered dirt again. Its only motion
    // is the click ripple, which moves the whole neighbourhood together and so
    // preserves the pattern.

    // --- hemispheres part ----------------------------------------------------
    // aSide is 0 for the fissure, the screw base and every ambient dot, so the
    // mark opens at the seam and the background stays still.
    pos.x += aSide * uSplit;

    // --- idle breathing ------------------------------------------------------
    vec3 wobble = normalize(vec3(sin(s * 97.0), cos(s * 57.0), sin(s * 33.0)));
    pos += wobble * 0.010 * sin(uTime * 1.2 + s * 20.0) * f * (1.0 - aAmbient);

    // --- dispersal -----------------------------------------------------------
    // The background must not fly away with the mark.
    float logoOnly = 1.0 - aAmbient;
    pos.y += uDisperse * (1.4 + s * 2.6) * logoOnly;
    pos.x += (s - 0.5) * uDisperse * 1.3 * logoOnly;

    // --- click ripple --------------------------------------------------------
    // An expanding ring, not a uniform push: dots are displaced only as the
    // front passes them, which is what makes it read as a wave travelling
    // outward rather than the whole field lurching at once.
    float ripple = 0.0;
    if (uClickActive > 0.5) {
      vec2 delta = pos.xy - uClickPos;
      float dist = length(delta) + 0.0001;
      float front = uClickAge * WAVE_SPEED;

      // Gaussian band centred on the advancing front.
      float band = exp(-pow((dist - front) * 2.6, 2.0));
      // Fade with age, and with distance so it does not stay strong forever.
      float decay = exp(-uClickAge * (1.6 / WAVE_LIFE) * 3.0);

      ripple = band * decay;

      pos.xy += (delta / dist) * ripple * 0.34;
      pos.z += ripple * 0.3;
    }

    // --- pointer parallax ----------------------------------------------------
    // The logo shears per dot, which reads as depth. The field must move as one
    // rigid sheet — a per-dot offset would scramble the lattice on every mouse
    // move, which is precisely what made it look like noise before.
    float parallax = mix(0.04 + s * 0.05, 0.03, aAmbient);
    pos.xy += uPointer * parallax;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // --- size ----------------------------------------------------------------
    // Low size variance: the artwork has hairline features, and wild
    // per-particle size makes them read as noise rather than lines.
    // Logo dots vary in size, which softens the mark's edges and helps it read
    // as a cloud of thought. Field dots are all EXACTLY the same size — varying
    // them is the single strongest cue that a pattern is accidental rather than
    // drawn.
    //
    // NOTE: this whole shader is a JS template literal, so a backtick anywhere
    // in these comments terminates the string and the file stops parsing.
    // Quote GLSL in comments with plain text, never with backticks.
    //
    // The logo term was raised from 0.8 + s * 0.45 to darken the mark: on a
    // white page the mark is mostly gaps, so coverage does as much work as
    // colour does. Roughly a third more diameter is about 70% more area per
    // dot. The AMBIENT term is deliberately untouched — the background lattice
    // was tuned separately and enlarging it brings back the dust it took
    // several attempts to get rid of.
    float sizeVariation = mix(1.05 + s * 0.5, 1.2, aAmbient);
    float size = uSize * sizeVariation;
    size *= mix(0.7, 1.0, form);
    size += aIgnite * uIgnite * uSize * 0.35;
    size += ripple * uSize * 0.85;
    // Perspective falloff: distant dots shrink, as real depth demands.
    gl_PointSize = size * uPixelRatio * (1.0 / max(-mvPosition.z, 0.001));

    // --- colour --------------------------------------------------------------
    vColor = mix(aColor, uColorCore, clamp(aIgnite * uIgnite, 0.0, 1.0));
    vColor = mix(vColor, uColorCore, ripple * 0.75);

    // A regular lattice reads far more strongly than the same dots scattered,
    // so it needs less opacity to be clearly present.
    float logoAlpha = mix(0.22, 1.0, f);
    float fieldAlpha = 0.5;
    vAlpha = mix(logoAlpha, fieldAlpha, aAmbient);
    vAlpha *= (1.0 - uDisperse * 0.92 * logoOnly);
    vAlpha += ripple * 0.45;
  }
`;

export const brainFragmentShader = /* glsl */ `
  precision mediump float;

  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    // Round the square point sprite into a soft disc.
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c);
    if (d > 0.25) discard;

    float alpha = smoothstep(0.25, 0.045, d);

    gl_FragColor = vec4(vColor, alpha * clamp(vAlpha, 0.0, 1.0));

    #include <colorspace_fragment>
  }
`;
