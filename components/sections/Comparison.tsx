import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { COMPARISON } from "@/content/home";

/**
 * BrainLIT against the category parents keep confusing us with.
 *
 * A real <table> with proper <th scope>, not a grid of divs — a screen reader
 * announces "What is taught, the usual approach: Coding" only if the structure
 * is genuinely tabular. A div grid reads as five unrelated words.
 *
 * The left column names an APPROACH, never a competitor. We have no evidence
 * about any specific academy, and a comparison table implying otherwise is a
 * liability rather than a marketing asset.
 */
export function Comparison() {
  return (
    <section className="relative z-10 bg-paper pb-24 sm:pb-32">
      <Container size="default">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
            The difference
          </p>
          <h2 className="mt-5 text-[length:var(--text-h2)] text-ink">
            Two very different bets on what lasts.
          </h2>
        </Reveal>

        <Reveal className="mt-14 overflow-hidden rounded-2xl border border-mist">
          {/* Horizontally scrollable on narrow screens rather than wrapped —
              a comparison that reflows into a single column stops comparing. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left">
              <caption className="sr-only">
                How the usual approach to teaching children about AI compares
                with BrainLIT
              </caption>
              <thead>
                <tr className="border-b border-mist">
                  <th scope="col" className="sr-only">
                    Aspect
                  </th>
                  <th
                    scope="col"
                    className="p-5 font-display text-sm font-semibold tracking-wide text-slate uppercase sm:p-6"
                  >
                    The usual approach
                  </th>
                  <th
                    scope="col"
                    className="bg-mist/30 p-5 font-display text-sm font-semibold tracking-wide text-indigo uppercase sm:p-6"
                  >
                    BrainLIT
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr
                    key={row.theme}
                    className="border-b border-mist last:border-b-0"
                  >
                    <th
                      scope="row"
                      className="p-5 text-left text-sm font-normal text-slate sm:p-6"
                    >
                      {row.theme}
                    </th>
                    <td className="p-5 text-[0.975rem] text-slate sm:p-6">
                      {row.usual}
                    </td>
                    <td className="bg-mist/30 p-5 font-display text-[0.975rem] font-semibold text-ink sm:p-6">
                      {row.brainlit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        <Reveal className="mt-6 text-center">
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate">
            Nothing here is a criticism of learning to code. It is a good thing
            to learn. It is just no longer the scarce thing.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
