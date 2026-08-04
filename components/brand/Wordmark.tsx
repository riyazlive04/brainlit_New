import Link from "next/link";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";

/**
 * BrainLIT mark — vector rebuild of the supplied logo.
 *
 * Drawn as SVG rather than shipping the PNG because the header, favicon and OG
 * images all need a transparent, resolution-independent asset, and the supplied
 * raster sits on a grey plate.
 *
 * This is a faithful reconstruction, not a machine trace of the original
 * artwork. For print and any use at large scale, get the designer's source
 * (.ai / .svg / Figma) — see PLAN.md §12.
 *
 * Structure: two brain hemispheres (left blue = logic, right violet =
 * creativity), circuit traces, a warm core glow where they meet, a lightbulb
 * screw base, and radiating spark rays.
 */

type WordmarkProps = {
  className?: string;
  /** `dark` for placement over a dark surface */
  tone?: "light" | "dark";
  /** Renders only the bulb mark, no wordmark text */
  markOnly?: boolean;
  href?: string | null;
  /** Tailwind height class for the mark */
  markClassName?: string;
};

function Mark({ uid, className }: { uid: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 200 220"
      aria-hidden="true"
      focusable="false"
      className={cn("w-auto shrink-0", className)}
    >
      <defs>
        {/* Left hemisphere — logic */}
        <linearGradient id={`${uid}-l`} x1="34" y1="30" x2="100" y2="143">
          <stop offset="0%" stopColor="#7aceeb" />
          <stop offset="55%" stopColor="#5eaedd" />
          <stop offset="100%" stopColor="#5a9fd4" />
        </linearGradient>

        {/* Right hemisphere — creativity */}
        <linearGradient id={`${uid}-r`} x1="166" y1="30" x2="100" y2="143">
          <stop offset="0%" stopColor="#c68edc" />
          <stop offset="55%" stopColor="#9b72d4" />
          <stop offset="100%" stopColor="#854fb4" />
        </linearGradient>

        {/* Screw base */}
        <linearGradient id={`${uid}-b`} x1="74" y1="150" x2="126" y2="210">
          <stop offset="0%" stopColor="#4a63b0" />
          <stop offset="100%" stopColor="#2e3a80" />
        </linearGradient>

        {/* The filament glow where the hemispheres meet — the "LIT" */}
        <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fcd057" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#f7a83c" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#f7a83c" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ---------------------------------------------------------- rays */}
      <g fill="#fbbf45">
        {[0, 26, -26, 52, -52, 76, -76].map((deg) => (
          <rect
            key={deg}
            x="97.4"
            y="-4"
            width="5.2"
            height="16"
            rx="2.6"
            transform={`rotate(${deg} 100 85)`}
          />
        ))}

        {/* Four-point sparkles */}
        {[
          { x: 60, y: 18, s: 1 },
          { x: 148, y: 24, s: 0.78 },
          { x: 36, y: 54, s: 0.62 },
          { x: 166, y: 62, s: 0.62 },
        ].map((sp) => (
          <path
            key={`${sp.x}-${sp.y}`}
            d="M0,-5.5 Q0.9,-0.9 5.5,0 Q0.9,0.9 0,5.5 Q-0.9,0.9 -5.5,0 Q-0.9,-0.9 0,-5.5 Z"
            transform={`translate(${sp.x} ${sp.y}) scale(${sp.s})`}
          />
        ))}
      </g>

      {/* ------------------------------------------------------ hemispheres */}
      <path
        d="M100 27 C90 22, 78 23, 71 30 C59 28, 48 36, 46 48 C36 53, 31 65, 35 76
           C28 85, 29 98, 38 105 C38 118, 47 128, 59 129 C66 139, 78 143, 89 139
           C93 143, 97 144, 100 143 Z"
        fill={`url(#${uid}-l)`}
      />
      <path
        d="M100 27 C110 22, 122 23, 129 30 C141 28, 152 36, 154 48 C164 53, 169 65, 165 76
           C172 85, 171 98, 162 105 C162 118, 153 128, 141 129 C134 139, 122 143, 111 139
           C107 143, 103 144, 100 143 Z"
        fill={`url(#${uid}-r)`}
      />

      {/* Warm core, sitting over both halves */}
      <ellipse cx="100" cy="103" rx="30" ry="21" fill={`url(#${uid}-glow)`} />

      {/* ------------------------------------------------- circuit traces */}
      <g
        fill="none"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.72"
      >
        <g stroke="#2f6ea8">
          <path d="M60 56 H76 V71 H91" />
          <path d="M52 93 H70 V80 H86" />
          <path d="M69 118 V102 H85" />
          <circle cx="60" cy="56" r="3.1" fill="#2f6ea8" />
          <circle cx="52" cy="93" r="3.1" fill="#2f6ea8" />
          <circle cx="69" cy="118" r="3.1" fill="#2f6ea8" />
        </g>
        <g stroke="#6b3fa0">
          <path d="M140 56 H124 V71 H109" />
          <path d="M148 93 H130 V80 H114" />
          <path d="M131 118 V102 H115" />
          <circle cx="140" cy="56" r="3.1" fill="#6b3fa0" />
          <circle cx="148" cy="93" r="3.1" fill="#6b3fa0" />
          <circle cx="131" cy="118" r="3.1" fill="#6b3fa0" />
        </g>
      </g>

      {/* Central fissure */}
      <path
        d="M100 30 V141"
        stroke="#3f5ba6"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* -------------------------------------------------------- bulb base */}
      <g fill={`url(#${uid}-b)`}>
        <rect x="73" y="150" width="54" height="13" rx="6.5" />
        <rect x="78" y="169" width="44" height="13" rx="6.5" />
        <path d="M85 188 h30 v3 c0 10 -6.5 17 -15 17 s-15 -7 -15 -17 z" />
      </g>
    </svg>
  );
}

export function Wordmark({
  className,
  tone = "light",
  markOnly = false,
  href = "/",
  markClassName = "h-9",
}: WordmarkProps) {
  // Gradient ids must be unique per instance: two marks on one page would
  // otherwise share ids and the second would inherit the first's fills.
  const uid = `bl-${tone}-${markOnly ? "m" : "full"}`;

  const content = (
    <>
      <Mark uid={uid} className={markClassName} />
      {!markOnly && (
        <span
          className={cn(
            // The logo wordmark is a rounded geometric face; Fredoka is the
            // closest available match and is loaded for this lockup alone.
            "font-wordmark text-[1.4rem] leading-none font-semibold tracking-tight",
            tone === "dark" ? "text-white" : "text-brand-gradient",
          )}
        >
          {SITE.name}
        </span>
      )}
    </>
  );

  const classes = cn("inline-flex items-center gap-2", className);

  if (!href) {
    return (
      <span className={classes} role="img" aria-label={SITE.name}>
        {content}
      </span>
    );
  }

  return (
    <Link href={href} className={classes} aria-label={`${SITE.name} — home`}>
      {content}
    </Link>
  );
}
