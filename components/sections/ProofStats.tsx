import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { PROOF_STATS } from "@/content/home";

/**
 * Headline numbers.
 *
 * Renders NOTHING while PROOF_STATS is empty, which is how it ships. See the
 * comment on PROOF_STATS in content/home.ts: every figure here is a
 * substantiable advertising claim, and inventing one to fill the space would
 * put a fabricated statistic beside a request for money on a site selling
 * children's education.
 *
 * The count-up is CSS only — no JavaScript, no IntersectionObserver, and no
 * hydration cost for a decorative flourish. It works by animating a registered
 * custom property (which, unlike a normal variable, the browser can interpolate)
 * and printing it through a CSS counter. Where `@property` or scroll-driven
 * animation is unsupported the number simply renders at its final value, which
 * is the only acceptable way for a statistic to degrade.
 *
 * Values that are not plain integers — "4.9/5", "1.2k" — skip the animation
 * entirely rather than being mangled into something inaccurate.
 */

/** "100+" → { count: 100, suffix: "+" }. Anything else → null. */
function parseTally(value: string): { count: number; suffix: string } | null {
  const match = /^(\d{1,9})(\D{0,3})$/.exec(value.trim());
  if (!match) return null;
  return { count: Number(match[1]), suffix: match[2] };
}

export function ProofStats() {
  if (PROOF_STATS.length === 0) return null;

  return (
    <section className="relative z-10 border-y border-mist bg-paper py-16 sm:py-20">
      <Container>
        <h2 className="sr-only">BrainLIT in numbers</h2>

        <dl className="grid gap-10 text-center sm:grid-cols-3 sm:gap-6">
          {PROOF_STATS.map((stat, i) => {
            const tally = parseTally(stat.value);

            return (
              <Reveal key={stat.label} delay={i * 80}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block font-display text-[clamp(2.75rem,6vw,4rem)] leading-none font-bold tracking-tight text-brand-gradient">
                    {tally ? (
                      <>
                        {/* The accessible value: always the real number, never
                            a mid-animation frame. The animated glyphs beside it
                            are aria-hidden, so assistive tech and copy-paste
                            both get "100+" and not "37+". */}
                        <span className="sr-only">{stat.value}</span>
                        <span
                          aria-hidden="true"
                          className="tally"
                          style={
                            {
                              "--tally-to": tally.count,
                            } as React.CSSProperties
                          }
                        />
                        <span aria-hidden="true">{tally.suffix}</span>
                      </>
                    ) : (
                      stat.value
                    )}
                  </span>

                  <span className="mt-3 block font-display text-[0.975rem] font-semibold text-ink">
                    {stat.label}
                  </span>

                  {stat.qualifier && (
                    <span className="mt-1.5 block text-sm leading-relaxed text-slate">
                      {stat.qualifier}
                    </span>
                  )}
                </dd>
              </Reveal>
            );
          })}
        </dl>
      </Container>
    </section>
  );
}
