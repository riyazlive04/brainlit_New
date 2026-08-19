import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { GALLERY } from "@/content/home";

/**
 * Photographs from the sessions.
 *
 * Renders NOTHING while `GALLERY.photos` is empty, which is how it ships — the
 * same contract ProofStats, StudentProjects and Testimonials keep. The reasons
 * it must not be filled with stock photography, and the DPDP consent rule that
 * applies the moment a child is recognisable in a frame, are both on the
 * GALLERY block in content/home.ts.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE ASPECT RATIO FOR EVERY FRAME, and `object-cover` to reach it.
 *
 * Photographs supplied by a client arrive in whatever shape the phone that took
 * them produced: portrait, landscape, the occasional square, and at least one
 * screenshot. A grid that honours each one is a grid with ragged rows and holes
 * in it, and it reads as broken rather than as considered. Cropping to a
 * consistent 4:3 costs the edges of some frames and buys a wall of pictures
 * that looks deliberate.
 *
 * It also means the SPACE IS RESERVED before any bytes arrive — the ratio is on
 * the wrapper and `fill` stretches to it, so the page below does not jump as
 * each photograph decodes. That is the whole reason `width` and `height` are
 * required on the data: without them Next cannot do this arithmetic.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function Gallery() {
  const { photos } = GALLERY;
  if (photos.length === 0) return null;

  return (
    // `relative z-10`, like every other section: the homepage mounts a `fixed
    // inset-0 z-0` canvas that never unmounts, and a positioned z-0 element
    // paints above a static one wherever it sits in the document.
    <section className="relative z-10 py-20 sm:py-24">
      <Container size="wide">
        <Reveal>
          <p className="font-display text-sm font-semibold tracking-wide text-violet uppercase">
            {GALLERY.eyebrow}
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-[length:var(--text-h2)] leading-tight text-ink">
            {GALLERY.heading}
          </h2>
          <p className="mt-4 max-w-xl text-[length:var(--text-lead)] leading-relaxed text-slate">
            {GALLERY.lead}
          </p>
        </Reveal>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, i) => (
            /**
             * Keyed on `src`, not on the index. These are the one kind of list
             * on this page somebody reorders by hand, and an index key would
             * have React reuse the wrong <img> across that edit — which shows
             * up as a photograph briefly wearing its neighbour's caption.
             */
            <li key={photo.src}>
              <Reveal delay={i * 70}>
                <figure>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-mist">
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      /**
                       * Widest first, as the spec requires — the browser picks
                       * the first matching condition, so a mobile-first order
                       * here would serve every desktop a phone-sized crop.
                       *
                       * The three values track the grid above it: one column
                       * below sm, two to lg, three beyond, inside a `wide`
                       * container that caps out around 80rem.
                       */
                      sizes="(min-width: 1024px) 26rem, (min-width: 640px) 45vw, 92vw"
                      className="object-cover transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] hover:scale-[1.03]"
                    />
                  </div>

                  {photo.caption && (
                    <figcaption className="mt-3 text-sm leading-relaxed text-slate">
                      {photo.caption}
                    </figcaption>
                  )}
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
