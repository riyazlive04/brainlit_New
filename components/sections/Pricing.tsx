import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { PRICING } from "@/content/home";

/**
 * Fees.
 *
 * This section always renders, which is the point. A parent who can find no
 * indication of cost anywhere assumes the worst and leaves; "we will tell you,
 * and here is exactly when" converts far better than silence, and it is true.
 *
 * When a real starting price is set it leads. Until then the honest panel does
 * the work. What this must never do is invent a number, an instalment plan or a
 * scholarship — `hasScholarships` stays false until one actually exists,
 * because advertising a scholarship that does not is a plain misrepresentation
 * to families who may be choosing on exactly that basis.
 */

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function Pricing() {
  const hasPrice = PRICING.startingFromInr !== null;

  return (
    <section className="relative z-10 bg-mist/30 py-24 sm:py-32">
      <Container size="default">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
            Fees
          </p>
          <h2 className="mt-5 text-[length:var(--text-h2)] text-ink">
            {hasPrice
              ? "What it costs, before you ask."
              : "Let's talk about your investment in detail."}
          </h2>
        </Reveal>

        <Reveal
          delay={60}
          className="mx-auto mt-12 max-w-2xl rounded-3xl border border-mist bg-paper p-8 text-center sm:p-12"
        >
          {hasPrice && (
            <p className="font-display">
              <span className="block text-sm font-medium tracking-wide text-slate uppercase">
                Starting from
              </span>
              <span className="mt-3 block text-[clamp(2.5rem,6vw,3.5rem)] leading-none font-bold tracking-tight text-brand-gradient">
                {inr.format(PRICING.startingFromInr as number)}
              </span>
              {PRICING.unit && (
                <span className="mt-3 block text-sm text-slate">
                  {PRICING.unit}
                </span>
              )}
            </p>
          )}

          <p
            className={
              "text-[1.0625rem] leading-relaxed text-slate " +
              (hasPrice ? "mt-8 border-t border-mist pt-8" : "")
            }
          >
            {PRICING.note}
          </p>

          {(PRICING.hasInstalments || PRICING.hasScholarships) && (
            <ul className="mt-8 flex flex-wrap justify-center gap-2.5">
              {PRICING.hasInstalments && (
                <li className="rounded-full border border-mist px-4 py-1.5 text-sm text-slate">
                  Instalment plans available
                </li>
              )}
              {PRICING.hasScholarships && (
                <li className="rounded-full border border-mist px-4 py-1.5 text-sm text-slate">
                  Scholarships available
                </li>
              )}
            </ul>
          )}

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/webinar" variant="spark">
              Join the free session
            </Button>
            <Button href="/contact" variant="outline">
              Ask about fees
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
