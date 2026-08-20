import Image from "next/image";
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

/**
 * THE REAL ARTWORK, not a reconstruction.
 *
 * What stood here was ~170 lines of hand-drawn SVG - lobes, gyri, circuit
 * traces, gradients - built by eye because the designer's file had never been
 * supplied. It was close, and it was never right: wrong lobe count, wrong
 * trace density, a hard seam where the artwork has a soft one.
 *
 * The source is brainlit1.jpeg. `public/brainlit-mark.png` is the MARK ONLY,
 * cut from it at y175-680 - the file's own wordmark reads "Brainlit" and the
 * brand is "BrainLIT", so importing the lockup whole would have put the wrong
 * spelling on every page. The word is still set in type below.
 *
 * The background was keyed out rather than cropped: flat #f7f7f7, soft alpha
 * ramp, and the edge pixels un-premultiplied against that colour. Skipping that
 * last step leaves every anti-aliased edge carrying a little of the old light
 * background, which is invisible on white and shows as a pale halo the moment
 * the mark sits on one of the dark bands.
 *
 * `alt=""` on purpose. Wordmark labels the whole lockup - as a link, or as a
 * role="img" span - so a description here would announce the brand twice.
 */
function Mark({ className }: { className?: string }) {
  return (
    <Image
      src="/brainlit-mark.png"
      alt=""
      width={447}
      height={478}
      // Eager, not `priority`: this is the header logo and lazy-loading it
      // means a visible gap on first paint, but several instances can be on a
      // page at once and `priority` on each would preload them all.
      loading="eager"
      className={cn("w-auto shrink-0", className)}
    />
  );
}

export function Wordmark({
  className,
  tone = "light",
  markOnly = false,
  href = "/",
  markClassName = "h-9",
}: WordmarkProps) {
  const content = (
    <>
      <Mark className={markClassName} />
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
    <Link href={href} className={classes} aria-label={`${SITE.name} - home`}>
      {content}
    </Link>
  );
}
