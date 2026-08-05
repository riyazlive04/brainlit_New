import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { WHY_NOW } from "@/content/home";

/**
 * The urgency section.
 *
 * Placed immediately after the 3D zone, where the reader has just been told
 * "the homework is no longer the hard part" and is ready to be shown why.
 *
 * The visual is the argument: five capabilities stacked as a rising ladder,
 * each one a thing a parent can go and verify. No adoption statistics, because
 * a number we cannot source is a liability on a page that also asks for money —
 * and Meta treats unsubstantiated claims as grounds to reject an ad account.
 *
 * Dark-on-dark by design. It is the one heavy moment on an otherwise white
 * page, which is what makes it land; the ink background also lets the brand
 * ramp run at full brightness, which it cannot do on white.
 */
export function WhyNow() {
  return (
    <section className="relative z-10 overflow-hidden bg-ink py-24 sm:py-32">
      {/* Ambient wash, echoing the hero canvas so the two read as one product */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.28]"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 15% 0%, var(--color-indigo), transparent 60%)," +
            "radial-gradient(ellipse 55% 45% at 85% 100%, var(--color-violet), transparent 62%)",
        }}
      />

      <Container className="relative">
        <Reveal className="max-w-3xl">
          <p className="font-display text-sm font-medium tracking-[0.2em] text-lilac uppercase">
            {WHY_NOW.eyebrow}
          </p>
          <h2 className="mt-5 text-[length:var(--text-h2)] text-white">
            {WHY_NOW.heading}
          </h2>
          <p className="mt-6 text-[length:var(--text-lead)] leading-relaxed text-mist/75">
            {WHY_NOW.intro}
          </p>
        </Reveal>

        {/* The ladder. Each rung is wider than the last — the escalation is
            carried by the layout so the copy does not have to shout it. */}
        <ul className="mt-14 space-y-px">
          {WHY_NOW.capabilities.map((item, i) => (
            <Reveal
              as="li"
              key={item.label}
              delay={i * 70}
              className="group flex flex-col gap-1 border-t border-white/10 py-5 sm:flex-row sm:items-baseline sm:gap-8"
            >
              <span
                aria-hidden="true"
                className="font-display text-xs tabular-nums text-white/25"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-display text-[length:var(--text-h3)] font-semibold text-white sm:w-64 sm:shrink-0">
                {item.label}
              </span>
              <span className="text-[0.975rem] leading-relaxed text-mist/70">
                {item.body}
              </span>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-16 max-w-3xl border-t border-white/10 pt-12">
          <p className="text-[length:var(--text-lead)] leading-relaxed text-mist/75">
            {WHY_NOW.turn}
          </p>
          <p className="mt-4 font-display text-[length:var(--text-h2)] leading-[1.15] font-semibold tracking-tight text-white">
            {/* The full logo ramp is used here and nowhere else on the page —
                it fails contrast on white but is at its best on ink. */}
            It is whether they will know{" "}
            <span className="bg-brand-gradient-bright bg-clip-text text-transparent">
              how to think
            </span>
            , or quietly learn to depend on it.
          </p>
          <p className="mt-8 text-[0.975rem] leading-relaxed text-mist/55">
            {WHY_NOW.footnote}
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
