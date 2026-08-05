import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { WEBINAR_VALUE } from "@/content/home";

/**
 * What a parent actually gets from the free session.
 *
 * The old homepage sent people to /webinar on the strength of the word "free",
 * which answers the price question and none of the others — chiefly "what is
 * the catch" and "is this an hour of being sold to". This section answers both
 * before the click, which is the difference between a registration and a
 * bounce.
 *
 * The program walkthrough is listed last on purpose, and the copy says so. It
 * is the one item that looks like a pitch, and naming its position is what
 * makes the rest of the list credible.
 */
export function WebinarValue() {
  return (
    <section className="relative z-10 bg-paper py-24 sm:py-32">
      <Container>
        <Reveal className="max-w-3xl">
          <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
            {WEBINAR_VALUE.eyebrow}
          </p>
          <h2 className="mt-5 text-[length:var(--text-h2)] text-ink">
            {WEBINAR_VALUE.heading}
          </h2>
          <p className="mt-6 text-[length:var(--text-lead)] leading-relaxed text-slate">
            {WEBINAR_VALUE.intro}
          </p>
        </Reveal>

        <ul className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {WEBINAR_VALUE.items.map((item, i) => (
            <Reveal
              as="li"
              key={item.title}
              delay={i * 60}
              className="border-t border-mist pt-6"
            >
              <h3 className="font-display text-[1.0625rem] font-semibold text-ink">
                {item.title}
              </h3>
              <p className="mt-2.5 text-[0.95rem] leading-relaxed text-slate">
                {item.body}
              </p>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-14 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Button href="/webinar" variant="spark" size="lg">
            Reserve your free seat
          </Button>
          <p className="text-sm text-slate">
            Free · Live online · For parents, not children
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
