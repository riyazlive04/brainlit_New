import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { CURRICULUM } from "@/content/home";

/**
 * The roadmap: what happens, week by week.
 *
 * IT USED TO ANSWER "SO WHAT" TOO. A second block sat below the weeks — "Six
 * things, and none of them is a certificate of attendance" — pairing the
 * schedule with the six outcomes a child leaves holding. The two were kept in
 * one section deliberately, on the argument that the weeks answer "what
 * happens" and the outcomes answer "so what", and that split apart they each
 * read as filler. It was removed at the client's request; see the cut list in
 * app/(marketing)/page.tsx. OUTCOMES is still in content/home.ts and is now
 * rendered by nothing.
 *
 * What is left is the schedule alone, which is the weaker half of that pair:
 * it tells a parent comparing options what their child will DO, and no longer
 * what their child will HAVE at the end.
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

      </Container>
    </section>
  );
}
