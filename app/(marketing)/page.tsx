import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SceneMount } from "@/components/three/SceneMount";
import { StickyCta } from "@/components/layout/StickyCta";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { StudentProjects } from "@/components/sections/StudentProjects";
import { Testimonials } from "@/components/sections/Testimonials";
import { Founder } from "@/components/sections/Founder";
import { FaqPreview } from "@/components/sections/FaqPreview";
import { FinalCta } from "@/components/sections/FinalCta";
import { PILLARS, SITE } from "@/lib/site";

export const metadata: Metadata = {
  // `absolute` bypasses the root layout's "%s · BrainLIT" template, which would
  // otherwise render "BrainLIT — AI Thinking Academy for children · BrainLIT".
  title: { absolute: `${SITE.name} — ${SITE.tagline}` },
  description: SITE.description,
  alternates: { canonical: "/" },
};

/**
 * Homepage.
 *
 * The 3D zone spans the first three screens. One fixed canvas sits behind them
 * at z-0 while the copy rides above at z-10; those sections stay transparent so
 * the scene shows through, and everything after is opaque white.
 *
 * Layout is the "quiet aside" arrangement: the mark is offset to the right and
 * scaled down, and copy holds a left column at its natural width. Text and
 * particles never share the same pixels, which is what makes body copy readable
 * over a moving dot field — contrast against a shifting background cannot be
 * guaranteed any other way. Below 768px the mark returns to centre and the copy
 * stacks (see BrainParticles).
 */
export default function HomePage() {
  return (
    <>
      <div data-three-zone className="relative">
        <SceneMount offsetX={2.35} offsetY={0.25} scale={0.62} />

        {/* ------------------------------------------------------------- Hero */}
        <section className="relative z-10 flex min-h-[100svh] items-center">
          <Container size="wide" className="py-32">
            <div className="max-w-2xl">
              <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
                AI Thinking Academy · Ages {SITE.ageRange.min}–
                {SITE.ageRange.max}
              </p>

              <h1 className="mt-6 text-[length:var(--text-display)] text-ink">
                Teach your child to{" "}
                <span className="text-brand-gradient">think</span> before they
                use AI.
              </h1>

              <p className="mt-7 max-w-lg text-[length:var(--text-lead)] leading-relaxed text-slate">
                AI can already do the homework. It cannot do the thinking.
                BrainLIT builds the one thing that stays valuable — a child who
                can question, create and solve.
              </p>

              <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row">
                <Button href="/webinar" variant="spark" size="lg">
                  Join the free webinar
                </Button>
                <Button href="/courses" variant="outline" size="lg">
                  Explore programs
                </Button>
              </div>

              <p className="mt-6 text-sm text-slate">
                Live online · Small batches · For parents in {SITE.city} and
                across India
              </p>
            </div>
          </Container>
        </section>

        {/* -------------------------------------------------------- The problem */}
        <section className="relative z-10 flex min-h-[90svh] items-center">
          <Container size="wide" className="py-24">
            <Reveal className="max-w-2xl">
              <h2 className="text-[length:var(--text-h2)] text-ink">
                The homework is no longer the hard part.
              </h2>
              <p className="mt-6 text-[length:var(--text-lead)] leading-relaxed text-slate">
                A child can now get a finished essay in four seconds. What they
                cannot get is the judgement to know whether it is any good, the
                curiosity to ask a better question, or the confidence to
                disagree with it.
              </p>
              <p className="mt-5 text-[length:var(--text-lead)] leading-relaxed text-slate">
                Those are the skills that decide what happens next. They are
                also the ones nobody is teaching.
              </p>
            </Reveal>
          </Container>
        </section>

        {/* ------------------------------------------------------- The ignition */}
        <section className="relative z-10 flex min-h-[90svh] items-center">
          <Container size="wide" className="py-24">
            <Reveal className="max-w-2xl">
              <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
                Our whole philosophy
              </p>
              <p className="mt-8 font-display text-[length:var(--text-h1)] leading-[1.1] font-semibold tracking-tight text-ink">
                We don&apos;t teach children to depend on AI. We teach them to{" "}
                <span className="text-brand-gradient">think</span>, so they can
                lead it.
              </p>
            </Reveal>
          </Container>
        </section>
      </div>

      {/* --------------------------------------------------------- Positioning */}
      <section className="relative z-10 bg-paper py-24 sm:py-32">
        <Container size="narrow" className="text-center">
          <Reveal>
            <h2 className="text-[length:var(--text-h2)] text-ink">
              An AI <em className="text-brand-gradient not-italic">Thinking</em>{" "}
              Academy — not another coding academy.
            </h2>
            <p className="mt-6 text-[length:var(--text-lead)] leading-relaxed text-slate">
              Most programs teach children to operate AI tools. Tools change
              every six months. We teach the thinking underneath — the part that
              still matters in ten years.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* ------------------------------------------------------------- Pillars */}
      <section className="relative z-10 bg-paper pb-24 sm:pb-32">
        <Container>
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-[length:var(--text-h2)] text-ink">
              Seven things we build
            </h2>
            <p className="mt-5 text-[0.975rem] leading-relaxed text-slate">
              Not subjects on a timetable. Habits of mind, practised until they
              stick.
            </p>
          </Reveal>

          <ul className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((pillar, i) => (
              <Reveal as="li" key={pillar.key} delay={i * 60} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-brand-gradient font-display text-sm font-semibold text-white"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-[length:var(--text-h3)] text-ink">
                    {pillar.title}
                  </h3>
                  <p className="mt-1.5 text-[0.95rem] leading-relaxed text-slate">
                    {pillar.blurb}
                  </p>
                </div>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      <HowItWorks />
      <StudentProjects />
      <Testimonials />
      <Founder />
      <FaqPreview />
      <FinalCta />

      <StickyCta />
    </>
  );
}
