/**
 * The dotted flight trail.
 *
 * Written as a template string rather than a .glsl file for the same reason as
 * shaders/brain.ts — no bundler loader to configure, one less thing to break on
 * a Next major.
 *
 * Every dot's position is fixed at startup and never updated. The whole
 * animation is one uniform: `uHead`, the rocket's current parameter along the
 * curve. Dots ahead of it have not been drawn yet; dots behind it have. Nothing
 * touches the buffer after upload, so the trail costs a single uniform write per
 * frame no matter how many dots it has.
 *
 * NOTE: this is a JS template literal. A backtick anywhere in these comments
 * terminates the string and the file stops parsing. Quote GLSL in comments with
 * plain text.
 */

export const trailVertexShader = /* glsl */ `
  uniform float uHead;        // rocket position along the curve, 0..1
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uFade;        // global fade, used when the mark takes over

  attribute float aT;         // this dot's own position along the curve
  attribute float aSeed;

  varying float vAlpha;

  void main() {
    // How long ago the rocket passed this dot.
    float age = uHead - aT;

    // Not yet reached: cull by collapsing to zero size and alpha. Cheaper than
    // a discard in the fragment shader, which still costs the rasterisation.
    float drawn = step(0.0, age);

    // Each dot pops in over a short window rather than appearing at full size,
    // so the trail reads as being drawn rather than as a line being unmasked.
    float pop = smoothstep(0.0, 0.012, age);

    // The tail thins with distance but never fully clears. A trail that fades to
    // nothing behind the rocket loses the thing it is for: showing how far the
    // thing has already travelled.
    float tail = mix(1.0, 0.42, smoothstep(0.0, 0.55, age));

    // The trail does not start AT his fingertips.
    //
    // sampleTrail spaces dots by curve PARAMETER, which is deliberate — it is
    // what bunches them where the flight is slow and stretches them where it
    // accelerates. The cost is at t=0, where the curve is slowest of all and
    // several hundred dots land inside the first few centimetres. They merge
    // into a continuous hairline running back to his hand, and what that reads
    // as is a KITE STRING: the rocket looks tethered rather than thrown.
    //
    // Holding the first few percent back costs nothing — the rocket is in his
    // hand there and covers it — and the tether goes away.
    // 0.12, not 0.06. At 0.06 the tether was gone but the stretch just past it
    // was still solid — the gap moved rather than closed. Twice the window puts
    // the first visible dot where the dots are far enough apart to read as
    // dots.
    float birth = smoothstep(0.0, 0.12, aT);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Slight per-dot size variance. Unlike the background lattice in
    // shaders/brain.ts — which must be perfectly uniform or it reads as dirt —
    // this is a hand-drawn trail, and a little irregularity is what stops it
    // looking like a dashed CSS border.
    float size = uSize * (0.82 + aSeed * 0.36) * pop * drawn;
    gl_PointSize = size * uPixelRatio * (1.0 / max(-mvPosition.z, 0.001));

    vAlpha = tail * pop * drawn * uFade * birth;
  }
`;

export const trailFragmentShader = /* glsl */ `
  precision mediump float;

  uniform vec3 uColor;

  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c);
    if (d > 0.25) discard;

    float alpha = smoothstep(0.25, 0.05, d);
    gl_FragColor = vec4(uColor, alpha * clamp(vAlpha, 0.0, 1.0));

    #include <colorspace_fragment>
  }
`;
