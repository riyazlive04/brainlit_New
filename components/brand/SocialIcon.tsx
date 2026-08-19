import type { SocialKey } from "@/lib/site";

/**
 * The four accounts' marks.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DRAWN HERE, on the same 24px grid and the same 1.5 stroke as PillarIcon, for
 * the same reasons set out in that file — and one more that only applies to
 * these.
 *
 * The obvious alternative is a brand-icon package, whose glyphs are all SOLID
 * silhouettes. Dropped beside this site's outline iconography they read as a
 * different set that someone pasted in: heavier, darker, and visibly not from
 * the same hand. Outline versions of these four are perfectly legible at 20px —
 * the shapes are what carry the recognition, not the fill — so they are drawn
 * to match the rest rather than imported to match each other.
 *
 * Two exceptions where a fill is kept, because the mark stops being the mark
 * without it: Instagram's flash dot and YouTube's play triangle. Both are small
 * solid shapes in the originals and both vanish into noise as outlines.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PATHS: Record<SocialKey, (paint: string) => React.ReactNode> = {
  /* Rounded square, lens, flash */
  instagram: (paint) => (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5.2" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.1" cy="6.9" r="1.15" fill={paint} stroke="none" />
    </>
  ),

  /* The f, in its circle */
  facebook: () => (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.7 8.2h-1.3a2.1 2.1 0 00-2.1 2.1V21" />
      <path d="M9.6 12.6h5" />
    </>
  ),

  /* Screen and play head */
  youtube: (paint) => (
    <>
      <rect x="2.6" y="5.9" width="18.8" height="12.2" rx="3.6" />
      <path d="M10.6 9.4l5 2.6-5 2.6z" fill={paint} stroke="none" />
    </>
  ),

  /* Speech bubble with its tail at the lower left, and a handset */
  whatsapp: () => (
    <>
      <path d="M20.6 11.8a8.4 8.4 0 01-12.5 7.3L3.4 20.6l1.6-4.6a8.4 8.4 0 1115.6-4.2z" />
      <path d="M9.6 9.5c.3-.6 1.1-.6 1.4 0l.6 1.1c.2.4.1.8-.2 1.1l-.4.4a5.1 5.1 0 002.1 2.1l.4-.4c.3-.3.7-.4 1.1-.2l1.1.6c.6.3.6 1.1 0 1.4l-.5.3a2.2 2.2 0 01-2.1-.1 9.1 9.1 0 01-3.4-3.4 2.2 2.2 0 01-.1-2.1z" />
    </>
  ),
};

/**
 * Each network's own colour.
 *
 * Instagram's is a GRADIENT, not a swatch — that is what the real mark is, and
 * the single pink it is usually flattened to is a compromise made by people
 * drawing it in tools that cannot do gradients. An SVG can, so it does.
 *
 * The other three are the published brand values. They are written here rather
 * than added to the Tailwind theme on purpose: these are OTHER organisations'
 * colours, and putting them in the palette invites someone to reach for
 * `text-youtube` on a button one day.
 */
const BRAND_COLOUR: Record<Exclude<SocialKey, "instagram">, string> = {
  facebook: "#1877F2",
  youtube: "#FF0000",
  whatsapp: "#25D366",
};

/**
 * One id, reused. Two instances of this gradient on a page means a duplicate
 * id, which resolves to whichever comes first in document order — and since
 * both are identical, that is the right answer either way.
 */
const IG_GRADIENT_ID = "brainlit-instagram-gradient";

export function SocialIcon({
  network,
  className,
  /**
   * `brand` paints the mark in its own colour, which is what a row of social
   * links wants. `current` inherits from whatever contains it, which is what a
   * solid-coloured button wants — a green WhatsApp glyph on a green circle is
   * an invisible glyph.
   */
  tone = "brand",
}: {
  network: SocialKey;
  className?: string;
  tone?: "brand" | "current";
}) {
  const brand = tone === "brand";
  const paint = !brand
    ? "currentColor"
    : network === "instagram"
      ? `url(#${IG_GRADIENT_ID})`
      : BRAND_COLOUR[network];

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={paint}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      /**
       * Decorative in every place it is used: each icon sits inside a link that
       * already carries the network's name, either as visible text or as an
       * `aria-label`. Letting the SVG announce itself as well makes a screen
       * reader say "Instagram Instagram".
       */
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {brand && network === "instagram" && (
        <defs>
          {/* Corner to corner, which is the direction the real mark runs. */}
          <linearGradient
            id={IG_GRADIENT_ID}
            x1="3"
            y1="21"
            x2="21"
            y2="3"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#FEDA75" />
            <stop offset="0.28" stopColor="#FA7E1E" />
            <stop offset="0.58" stopColor="#D62976" />
            <stop offset="0.8" stopColor="#962FBF" />
            <stop offset="1" stopColor="#4F5BD5" />
          </linearGradient>
        </defs>
      )}
      {PATHS[network](paint)}
    </svg>
  );
}
