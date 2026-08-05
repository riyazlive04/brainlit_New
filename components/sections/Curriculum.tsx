import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { CURRICULUM, OUTCOMES } from "@/content/home";

/**
 * The roadmap, followed by what a child leaves with.
 *
 * These two belong together: the weeks answer "what happens", the outcomes
 * answer "so what". Split across separate sections they read as filler; side by
 * side they are the closest thing on the page to a syllabus, which is what a
 * parent comparing options is actually looking for.
 *
 * Horizontal connector on desktop, vertical rail on mobile — a four-column grid
 * squeezed onto a 360px Android is unreadable, and a stack on desktop loses the
 * sense of progression.
 *
 * NEEDS INPUT: the four themes came from the client's brief as an example.
 * Confirm against the real syllabus — a parent who enrols on this page will
 * expect what it describes.
 */
export function Curriculum() {
  return (
    <section className="relative z-10 bg-paper py-24 sm:py-32">
      <Container>
        <Reveal className="max-w-2xl">
          <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
            The roadmap
          </p>
          <h2 className="mt-5 text-[length:var(--text-h2)] text-ink">
            What the weeks actually look like.
          </h2>
          <p className="mt-6 text-[0.975rem] leading-relaxed text-slate">
            Each week builds on the last, and the fourth is entirely your
            child&apos;s own work.
          </p>
        </Reveal>

        {/* ------------------------------------------------------ The weeks */}
        <ol className="relative mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {/* The rail. Vertical on mobile, horizontal from lg — drawn once
              behind the items rather than as a border on each, so it does not
              break across grid gaps. */}
          <div
            aria-hidden="true"
            className="absolute top-2 bottom-2 left-[1.05rem] w-px bg-mist lg:top-[1.05rem] lg:right-0 lg:bottom-auto lg:left-0 lg:h-px lg:w-auto"
          />

          {CURRICULUM.map((item, i) => (
            <Reveal
              as="li"
              key={item.week}
              delay={i * 80}
              className="relative pl-14 lg:pl-0"
            >
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 grid size-[2.1rem] place-items-center rounded-full bg-brand-gradient font-display text-[0.7rem] font-bold text-white lg:relative lg:mb-6"
              >
                {item.week}
              </span>
              <h3 className="text-[length:var(--text-h3)] text-ink">
                <span className="sr-only">Week {Number(item.week)}: </span>
                {item.title}
              </h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-slate">
                {item.body}
              </p>
            </Reveal>
          ))}
        </ol>

        {/* --------------------------------------------------- The outcomes */}
        <div className="mt-24 rounded-3xl border border-mist bg-mist/25 p-8 sm:mt-28 sm:p-12">
          <Reveal className="max-w-2xl">
            <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
              What they leave with
            </p>
            <h2 className="mt-5 text-[length:var(--text-h2)] text-ink">
              Six things, and none of them is a certificate of attendance.
            </h2>
          </Reveal>

          <ul className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {OUTCOMES.map((outcome, i) => (
              <Reveal as="li" key={outcome.title} delay={i * 60}>
                <h3 className="font-display text-[1.0625rem] font-semibold text-ink">
                  {outcome.title}
                </h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-slate">
                  {outcome.body}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
