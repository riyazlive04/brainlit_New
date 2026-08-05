import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { JOURNEY } from "@/content/home";

/**
 * The whole path, from a parent's first click to where a child ends up.
 *
 * An ordered list with a rail behind it — the numbering is real, not drawn,
 * so a screen reader announces "1 of 8" without any ARIA.
 *
 * Stages marked `upcoming` are labelled "Planned" in text, not just styled
 * differently. Communicating availability through opacity alone fails for
 * anyone not looking at the screen, and "we sell something that does not exist
 * yet" is exactly the claim that must not depend on a visual cue.
 */
export function Journey() {
  return (
    <section className="relative z-10 bg-paper py-24 sm:py-32">
      <Container>
        <Reveal className="max-w-2xl">
          <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
            The journey
          </p>
          <h2 className="mt-5 text-[length:var(--text-h2)] text-ink">
            Where this goes, start to finish.
          </h2>
          <p className="mt-6 text-[0.975rem] leading-relaxed text-slate">
            You are at the top of it right now, and the next step costs nothing.
          </p>
        </Reveal>

        <ol className="relative mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div
            aria-hidden="true"
            className="absolute top-3 bottom-3 left-[0.4rem] w-px bg-gradient-to-b from-indigo/40 via-violet/30 to-transparent md:hidden"
          />

          {JOURNEY.map((stage, i) => (
            <Reveal
              as="li"
              key={stage.title}
              delay={i * 50}
              className="relative pl-8 md:pl-0"
            >
              {/* Node on mobile; on md+ the connector becomes the top border */}
              <span
                aria-hidden="true"
                className={
                  "absolute top-[0.45rem] left-0 size-[0.85rem] rounded-full md:hidden " +
                  (stage.upcoming
                    ? "border border-violet/40 bg-paper"
                    : "bg-brand-gradient")
                }
              />

              <div
                className={
                  "md:border-t md:pt-5 " +
                  (stage.upcoming ? "md:border-mist" : "md:border-violet/35")
                }
              >
                <p
                  aria-hidden="true"
                  className="hidden font-display text-xs tabular-nums text-violet md:block"
                >
                  {String(i + 1).padStart(2, "0")}
                </p>

                <h3 className="mt-0 font-display text-[1.0625rem] font-semibold text-ink md:mt-2">
                  {stage.title}
                  {stage.upcoming && (
                    <span className="ml-2 align-middle rounded-full border border-violet/30 px-2 py-0.5 text-[0.65rem] font-medium tracking-wide text-violet uppercase">
                      Planned
                    </span>
                  )}
                </h3>
                <p className="mt-2 text-[0.925rem] leading-relaxed text-slate">
                  {stage.body}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
