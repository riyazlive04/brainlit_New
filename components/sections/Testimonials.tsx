import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { VideoTestimonial } from "@/components/sections/VideoTestimonial";
import { getPublishedTestimonials } from "@/lib/content";
import { publicStorageUrl } from "@/lib/storage";

/**
 * Parent testimonials, with or without video.
 *
 * Renders nothing until at least one is published. Parents buy on trust from
 * other parents, so this is one of the highest-value sections on the page, and
 * precisely for that reason it must never be filled with invented quotes. An
 * empty section costs a conversion; a fabricated one is a lie told to a parent
 * about their child's education.
 *
 * Managed in the admin panel.
 */
export async function Testimonials() {
  const testimonials = await getPublishedTestimonials();
  if (testimonials.length === 0) return null;

  // Video testimonials lead. A parent hearing another parent is the strongest
  // thing on this page, and it should not be three rows below a text quote.
  const ordered = [...testimonials].sort(
    (a, b) => Number(Boolean(b.video_path)) - Number(Boolean(a.video_path)),
  );

  return (
    <section className="relative z-10 bg-mist/30 py-16 sm:py-20">
      <Container>
        <Reveal className="max-w-2xl">
          <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
            From parents
          </p>
          <h2 className="mt-5 text-[length:var(--text-h2)] text-ink">
            What they noticed at home.
          </h2>
        </Reveal>

        {/* `items-start`, so a card is as tall as what is in it.
            ─────────────────────────────────────────────────────────────────
            A grid stretches its items to the tallest in the row by default,
            which is right when they hold comparable things and absurd here: a
            video card runs to about 640px, and beside it a two-word quote was
            being stretched to match, leaving a card that is nine-tenths empty
            white. It read as a photograph that had failed to load — it was
            reported as exactly that — when nothing was missing at all.

            Ragged bottoms are the correct look for quotes of different
            lengths. Equal heights are what made a short one look broken. */}
        <ul className="mt-14 grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ordered.map((item, i) => {
            const videoSrc = publicStorageUrl(
              "testimonial-videos",
              item.video_path,
            );
            const photoSrc = publicStorageUrl(
              "testimonial-photos",
              item.photo_path,
            );

            return (
              <Reveal
                as="li"
                key={item.id}
                delay={i * 80}
                // A video card spans two columns on wide screens: a talking
                // head squeezed into a third of the row is unwatchable.
                className={videoSrc ? "flex lg:col-span-2" : "flex"}
              >
                <figure className="flex w-full flex-col rounded-2xl bg-paper p-7 shadow-[0_1px_0_0_rgba(11,16,32,0.05)]">
                  {videoSrc && (
                    <div className="mb-6">
                      <VideoTestimonial
                        src={videoSrc}
                        parentName={item.parent_name}
                        city={item.city}
                      />
                    </div>
                  )}

                  <blockquote className="flex-1 text-[1.0625rem] leading-relaxed text-ink">
                    “{item.quote}”
                  </blockquote>

                  {/* The face goes WITH the attribution, not above the quote.
                      A portrait at the top is a header and pulls rank on the
                      words; beside the name it does the one job it is here for,
                      which is to say a real person said this. */}
                  <figcaption className="mt-6 flex items-center gap-3 text-sm text-slate">
                    {photoSrc && (
                      <Image
                        src={photoSrc}
                        alt=""
                        width={96}
                        height={96}
                        unoptimized
                        // Decorative: the name is right beside it in text, so a
                        // screen reader announcing the face as well would just
                        // say the parent's name twice.
                        aria-hidden="true"
                        className="size-12 shrink-0 rounded-full object-cover"
                      />
                    )}
                    <span>
                      <span className="font-display font-semibold text-ink">
                        {item.parent_name}
                      </span>
                      <br />
                      {item.child_first_name
                        ? `Parent of ${item.child_first_name}${item.city ? " · " : ""}`
                        : ""}
                      {item.city}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
