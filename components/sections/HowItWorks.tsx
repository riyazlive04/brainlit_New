import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { HOW_IT_WORKS } from "@/content/home";
import { SITE } from "@/lib/site";

export function HowItWorks() {
  return (
    <section className="relative z-10 bg-paper py-24 sm:py-32">
      <Container>
        <Reveal className="max-w-2xl">
          <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
            How it works
          </p>
          <h2 className="mt-5 text-[length:var(--text-h2)] text-ink">
            Four steps, and the first one is free.
          </h2>
        </Reveal>

        <ol className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2">
          {HOW_IT_WORKS.map((item, i) => (
            <Reveal as="li" key={item.step} delay={i * 80}>
              <div className="flex items-baseline gap-4">
                <span
                  aria-hidden="true"
                  className="font-display text-[2.5rem] leading-none font-bold text-brand-gradient"
                >
                  {item.step}
                </span>
                <h3 className="text-[length:var(--text-h3)] text-ink">
                  {item.title}
                </h3>
              </div>
              <p className="mt-3 pl-[3.9rem] text-[0.975rem] leading-relaxed text-slate">
                {item.body}
              </p>
            </Reveal>
          ))}
        </ol>

        <Reveal className="mt-14 rounded-2xl border border-mist bg-mist/25 p-6 sm:p-8">
          <p className="text-[0.975rem] leading-relaxed text-slate">
            <span className="font-display font-semibold text-ink">
              Ages {SITE.ageRange.min}–{SITE.ageRange.max}.
            </span>{" "}
            Live online, so distance is not a barrier — we teach children in{" "}
            {SITE.city} and across India. If you are unsure whether your child
            is ready, come to the free session and ask us. We will tell you
            honestly.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
