/**
 * Sparks thrown off the burning paper.
 *
 * Replaces shaders/mark.ts, which drove the logo assembly at the end of the
 * sequence. That beat was removed at the client's request — the aeroplane
 * emerging from the fire is now the climax, and a logo assembling behind it
 * split the frame between two events and landed neither.
 *
 * What is left is much simpler, and needs none of what the mark needed: no
 * artwork sampling, no per-particle target positions, no convergence. Embers
 * are born hot at a point, fly outward, cool, and go out.
 *
 * NOTE: this is a JS template literal. A backtick anywhere in these comments
 * terminates the string and the file stops parsing.
 */

export const emberVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSpray;     // 0 at the source -> 1 fully dispersed
  uniform float uOpacity;
  uniform float uSize;
  uniform float uPixelRatio;

  attribute vec3  aDir;     // this spark's outward direction, unit-ish
  attribute float aSpeed;
  attribute float aSeed;

  varying float vAlpha;
  varying float vHeat;
  varying float vCore;

  void main() {
    float s = aSeed;

    // Each spark leaves at its own moment, so the burst has a leading edge
    // rather than every particle departing on the same frame.
    float t = clamp((uSpray - s * 0.35) / 0.65, 0.0, 1.0);

    // Outward, decelerating — air resistance on something with almost no mass.
    float travel = (1.0 - pow(1.0 - t, 2.2)) * aSpeed;
    vec3 pos = aDir * travel;

    // Heat rises, and the drift grows as the spark slows.
    pos.y += t * t * (0.35 + s * 0.9);
    pos.x += sin(uTime * 1.9 + s * 47.0) * 0.05 * t;
    pos.z += cos(uTime * 1.6 + s * 31.0) * 0.05 * t;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // How far out this spark has got, 0..1 across the whole burst.
    float reach = clamp(travel / 2.2, 0.0, 1.0);

    // Sparks flicker, and shrink as they cool.
    //
    // SIZE ALSO FALLS WITH SPEED. Every spark being the same size is most of
    // what made this read as confetti rather than fire: a real burst is a dense
    // knot of bright motes with a few faint ones thrown clear, and the ones
    // thrown clear are the SMALL ones — they are the fragments light enough to
    // be carried. Uniform dots at uniform spacing read as a pattern.
    float flicker = 0.7 + 0.6 * abs(sin(uTime * 8.0 + s * 63.0));
    float size = uSize * (1.45 - t * 0.8) * flicker / (1.0 + aSpeed * 0.55);
    gl_PointSize = size * uPixelRatio * (1.0 / max(-mvPosition.z, 0.001));

    // Heat falls with age AND with distance travelled. A spark that has flown
    // two metres has been in the air longer than one still at the source, so it
    // must be further through its own cooling, not merely further away.
    vHeat = clamp((1.0 - t) * (1.0 - reach * 0.75), 0.0, 1.0);
    // The white-hot centre, over the first fraction of the flight only.
    vCore = 1.0 - smoothstep(0.0, 0.28, reach);

    // Bright at birth, out by the end. Nothing survives the burst — and the
    // fringe thins rather than stopping at a hard edge.
    vAlpha = uOpacity * flicker
             * (1.0 - smoothstep(0.45, 1.0, t))
             * (1.0 - smoothstep(0.45, 1.0, reach) * 0.85);
  }
`;

export const emberFragmentShader = /* glsl */ `
  precision mediump float;

  uniform vec3 uHot;
  uniform vec3 uCool;
  uniform vec3 uCore;

  varying float vAlpha;
  varying float vHeat;
  varying float vCore;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c);
    if (d > 0.25) discard;

    // Soft-edged while hot, tighter as it dies — a cooling spark stops glowing
    // before it stops existing.
    float alpha = smoothstep(0.25, mix(0.19, 0.06, 1.0 - vHeat), d);

    /**
     * Three temperatures, not two.
     *
     * This was a mix between two colours that differ only in the third decimal
     * — #f2a922 and #ef9f2c are the same orange to the eye — so every spark
     * came out identical whatever its age, and a field of identical dots is
     * confetti.
     *
     * Now it runs pale-hot at the centre, through the brand's spark yellow, to
     * a deep ember at the fringe. NOT done with additive blending, which is the
     * usual way to make fire glow: additive brightens toward white and this
     * canvas sits on a white page, so it would erase the burst entirely.
     */
    vec3 color = mix(uCool, uHot, vHeat);
    color = mix(color, uCore, vCore * vHeat * 0.8);

    gl_FragColor = vec4(color, alpha * clamp(vAlpha, 0.0, 1.0));

    #include <colorspace_fragment>
  }
`;
