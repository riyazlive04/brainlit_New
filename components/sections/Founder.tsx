import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { FOUNDER } from "@/content/home";

/**
 * Meet the founder.
 *
 * Parents choose a small education brand on the strength of the person behind
 * it, which makes this the highest-trust section on the page — and the reason
 * it is placed after the proof and before the offer.
 *
 * The copy is the founder's own, kept close to as written. Two structural
 * decisions worth knowing:
 *
 *   The pull quote is lifted OUT of the prose rather than repeated inside it.
 *   "Technology changes fast. Thinking lasts forever." arrives in the middle of
 *   the story where it originally sat, set large, and does the work of a
 *   section break.
 *
 *   The promise closes on a bordered card rather than another paragraph. It is
 *   the one first-person commitment on the site, and a reader skimming should
 *   still land on it.
 *
 * The layout still adapts to what exists — no photo, no credentials and no
 * story each degrade gracefully rather than leaving a hole.
 */
export function Founder() {
  const hasStory = FOUNDER.story.length > 0;

  return (
    <section className="relative z-10 bg-mist/30 py-16 sm:py-20">
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
                loading="lazy"
                sizes="(min-width: 768px) 18rem, 10rem"
                className="aspect-[4/5] w-40 rounded-2xl object-cover sm:w-48 md:w-full"
              />
            ) : (
              <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase md:hidden">
                {FOUNDER.eyebrow}
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
                    <li key={credential} className="text-sm leading-relaxed text-slate">
                      {credential}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Reveal>

          {/* ---------------------------------------------------------- Story */}
          <div>
            <Reveal>
              <p className="hidden font-display text-sm font-medium tracking-[0.2em] text-violet uppercase md:block">
                {FOUNDER.eyebrow}
              </p>
              <h2 className="mt-5 text-[length:var(--text-h2)] text-ink">
                {FOUNDER.heading}
              </h2>
            </Reveal>

            {hasStory ? (
              <>
                {/* The story breaks around the pull quote: the first two
                    paragraphs set up the lesson, the quote states it, the rest
                    follows from it. */}
                <Reveal delay={40} className="mt-8 space-y-5">
                  {FOUNDER.story.slice(0, 2).map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 48)}
                      className="text-[1.0625rem] leading-relaxed text-slate"
                    >
                      {paragraph}
                    </p>
                  ))}
                </Reveal>

                <Reveal delay={60}>
                  <blockquote className="my-10 border-l-2 border-violet/40 pl-6">
                    <p className="font-display text-[length:var(--text-h3)] leading-snug font-semibold text-ink">
                      {FOUNDER.quote}
                    </p>
                  </blockquote>
                </Reveal>

                <Reveal delay={80} className="space-y-5">
                  {FOUNDER.story.slice(2).map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 48)}
                      className="text-[1.0625rem] leading-relaxed text-slate"
                    >
                      {paragraph}
                    </p>
                  ))}
                </Reveal>
              </>
            ) : (
              <Reveal delay={40}>
                <blockquote className="mt-8 font-display text-[length:var(--text-h3)] leading-snug font-medium text-ink">
                  “{FOUNDER.quote}”
                </blockquote>
                {FOUNDER.bio && (
                  <p className="mt-6 max-w-2xl text-[0.975rem] leading-relaxed text-slate">
                    {FOUNDER.bio}
                  </p>
                )}
              </Reveal>
            )}

            {/* -------------------------------------------------- The mission */}
            {FOUNDER.mission.length > 0 && (
              <Reveal delay={100} className="mt-12">
                <h3 className="font-display text-[1.0625rem] font-semibold text-ink">
                  The future belongs to children who can:
                </h3>
                <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {FOUNDER.mission.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-[0.55rem] size-1.5 shrink-0 rounded-full bg-brand-gradient"
                      />
                      <span className="text-[0.975rem] leading-relaxed text-slate">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            {/* -------------------------------------------------- The promise */}
            {FOUNDER.promise.body.length > 0 && (
              <Reveal
                delay={120}
                className="mt-12 rounded-2xl border border-violet/25 bg-paper p-7 sm:p-8"
              >
                <h3 className="font-display text-sm font-semibold tracking-[0.14em] text-indigo uppercase">
                  {FOUNDER.promise.heading}
                </h3>
                <div className="mt-5 space-y-4">
                  {FOUNDER.promise.body.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 48)}
                      className="text-[1.0625rem] leading-relaxed text-ink"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
                <p className="mt-6 font-display text-sm font-semibold text-slate">
                  - {FOUNDER.name}
                </p>
              </Reveal>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
