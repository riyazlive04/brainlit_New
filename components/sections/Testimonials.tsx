import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { TESTIMONIALS } from "@/content/home";

/**
 * Parent testimonials.
 *
 * Renders nothing while `TESTIMONIALS` is empty — which is the current state,
 * on purpose. Parents buy on trust from other parents, so this is one of the
 * highest-value sections on the page, and precisely for that reason it must
 * never be filled with invented quotes. An empty section costs a conversion;
 * a fabricated one is a lie told to a parent about their child's education.
 *
 * Supply real quotes with consent in `content/home.ts` and this appears.
 */
export function Testimonials() {
  if (TESTIMONIALS.length === 0) return null;

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
          {TESTIMONIALS.map((item, i) => (
            <Reveal
              as="li"
              key={`${item.parentName}-${item.city}`}
              delay={i * 80}
              className="flex"
            >
              <figure className="flex flex-col rounded-2xl bg-paper p-7 shadow-[0_1px_0_0_rgba(11,16,32,0.05)]">
                <blockquote className="flex-1 text-[1.0625rem] leading-relaxed text-ink">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-6 text-sm text-slate">
                  <span className="font-display font-semibold text-ink">
                    {item.parentName}
                  </span>
                  <br />
                  {item.childContext ? `${item.childContext} · ` : ""}
                  {item.city}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
