import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { TRANSFORMATION } from "@/content/home";

/**
 * Before and after.
 *
 * Deliberately labelled "where most children start" → "what we build toward",
 * not "before BrainLIT" → "after BrainLIT". The second framing is a guaranteed
 * outcome for an individual child, which no education provider can honestly
 * promise and which advertising review treats as a results claim.
 *
 * The ✅/❌ from the brief are not used. Emoji are read aloud by screen readers
 * ("cross mark", "check mark") ahead of every single item, and they sit badly
 * with the rest of the type. The same contrast is carried by colour, weight and
 * a drawn glyph instead.
 */
export function Transformation() {
  return (
    <section className="relative z-10 bg-mist/30 py-24 sm:py-32">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
            {TRANSFORMATION.eyebrow}
          </p>
          <h2 className="mt-5 text-[length:var(--text-h2)] text-ink">
            {TRANSFORMATION.heading}
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {/* ---------------------------------------------------------- Before */}
          <Reveal className="rounded-2xl border border-mist bg-paper/60 p-7 sm:p-8">
            <h3 className="font-display text-sm font-semibold tracking-[0.14em] text-slate uppercase">
              {TRANSFORMATION.before.label}
            </h3>
            <ul className="mt-7 space-y-4">
              {TRANSFORMATION.before.items.map((item) => (
                <li key={item} className="flex gap-3.5">
                  <span
                    aria-hidden="true"
                    className="mt-[0.3rem] grid size-5 shrink-0 place-items-center rounded-full border border-slate/25 text-slate/60"
                  >
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 10 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    >
                      <path d="M2 2l6 6M8 2l-6 6" />
                    </svg>
                  </span>
                  <span className="text-[0.975rem] leading-relaxed text-slate">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* ----------------------------------------------------------- After */}
          <Reveal
            delay={80}
            className="rounded-2xl border border-violet/25 bg-paper p-7 shadow-[0_2px_28px_-12px_rgba(133,79,180,0.4)] sm:p-8"
          >
            <h3 className="font-display text-sm font-semibold tracking-[0.14em] text-indigo uppercase">
              {TRANSFORMATION.after.label}
            </h3>
            <ul className="mt-7 space-y-4">
              {TRANSFORMATION.after.items.map((item) => (
                <li key={item} className="flex gap-3.5">
                  <span
                    aria-hidden="true"
                    className="mt-[0.3rem] grid size-5 shrink-0 place-items-center rounded-full bg-brand-gradient text-white"
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 5.2l2 2L8 3" />
                    </svg>
                  </span>
                  <span className="text-[0.975rem] leading-relaxed text-ink">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal className="mt-8 text-center">
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate">
            Every child moves at their own pace, and none of this happens in a
            week. It is the direction that matters.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
