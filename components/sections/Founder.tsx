import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { FOUNDER } from "@/content/home";

/**
 * Founder.
 *
 * Parents choose a small education brand on the strength of the person behind
 * it, so this section grows as the real material arrives rather than shipping
 * a placeholder avatar and lorem paragraphs:
 *
 *   quote only            → the compact layout that shipped in Phase 1
 *   + story               → full storytelling layout, quote becomes the pull
 *   + photo / credentials → each appears in place when supplied
 *
 * NEEDS INPUT: `story` is the single highest-value missing item on this page.
 * It should be in the founder's own voice and answer two questions — what did
 * you see that made you start this, and why should a parent trust you with
 * their child's thinking. A quote cannot do that work.
 */
export function Founder() {
  const hasStory = FOUNDER.story.length > 0;

  return (
    <section className="relative z-10 bg-mist/30 py-24 sm:py-32">
      <Container>
        <div className="grid gap-12 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:gap-16">
          {/* ------------------------------------------------------- Portrait */}
          <Reveal className="md:sticky md:top-28 md:self-start">
            {FOUNDER.photoUrl ? (
              <Image
                src={FOUNDER.photoUrl}
                alt={`${FOUNDER.name}, ${FOUNDER.role} of BrainLIT`}
                width={576}
                height={720}
                sizes="(min-width: 768px) 18rem, 10rem"
                className="aspect-[4/5] w-40 rounded-2xl object-cover sm:w-48 md:w-full"
              />
            ) : (
              <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase md:hidden">
                Who is behind this
              </p>
            )}

            <div className="mt-6">
              <p className="font-display text-[1.0625rem] font-semibold text-ink">
                {FOUNDER.name}
              </p>
              <p className="mt-0.5 text-sm text-slate">{FOUNDER.role}</p>

              {FOUNDER.credentials.length > 0 && (
                <ul className="mt-5 space-y-2 border-t border-mist pt-5">
                  {FOUNDER.credentials.map((credential) => (
                    <li key={credential} className="text-sm text-slate">
                      {credential}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Reveal>

          {/* ---------------------------------------------------------- Story */}
          <Reveal delay={60}>
            <p className="hidden font-display text-sm font-medium tracking-[0.2em] text-violet uppercase md:block">
              Who is behind this
            </p>

            {hasStory ? (
              <>
                <h2 className="mt-5 text-[length:var(--text-h2)] text-ink">
                  Why this exists.
                </h2>

                <div className="mt-8 space-y-5">
                  {FOUNDER.story.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 48)}
                      className="text-[1.0625rem] leading-relaxed text-slate"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                <blockquote className="mt-10 border-l-2 border-violet/40 pl-6 font-display text-[length:var(--text-h3)] leading-snug font-medium text-ink">
                  “{FOUNDER.quote}”
                </blockquote>
              </>
            ) : (
              <>
                {/* Phase 1 layout — the quote carries the section alone. */}
                <blockquote className="mt-5 font-display text-[length:var(--text-h3)] leading-snug font-medium text-ink md:mt-6">
                  “{FOUNDER.quote}”
                </blockquote>

                {FOUNDER.bio && (
                  <p className="mt-6 max-w-2xl text-[0.975rem] leading-relaxed text-slate">
                    {FOUNDER.bio}
                  </p>
                )}
              </>
            )}
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
