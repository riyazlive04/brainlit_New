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
    <section className="relative z-10 bg-mist/30 py-24 sm:py-32">
      <Container>
        <Reveal className="max-w-2xl">
          <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
            From parents
          </p>
          <h2 className="mt-5 text-[length:var(--text-h2)] text-ink">
            What they noticed at home.
          </h2>
        </Reveal>

        <ul className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ordered.map((item, i) => {
            const videoSrc = publicStorageUrl(
              "testimonial-videos",
              item.video_path,
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

                  <figcaption className="mt-6 text-sm text-slate">
                    <span className="font-display font-semibold text-ink">
                      {item.parent_name}
                    </span>
                    <br />
                    {item.child_first_name
                      ? `Parent of ${item.child_first_name}${item.city ? " · " : ""}`
                      : ""}
                    {item.city}
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
