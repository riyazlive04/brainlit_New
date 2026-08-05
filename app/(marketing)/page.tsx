import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { PillarIcon } from "@/components/brand/PillarIcon";
import { SceneMount } from "@/components/three/SceneMount";
import { StickyCta } from "@/components/layout/StickyCta";
import { WhyNow } from "@/components/sections/WhyNow";
import { Comparison } from "@/components/sections/Comparison";
import { Transformation } from "@/components/sections/Transformation";
import { Curriculum } from "@/components/sections/Curriculum";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Journey } from "@/components/sections/Journey";
import { ThinkingDemo } from "@/components/sections/ThinkingDemo";
import { ProofStats } from "@/components/sections/ProofStats";
import { StudentProjects } from "@/components/sections/StudentProjects";
import { Testimonials } from "@/components/sections/Testimonials";
import { Founder } from "@/components/sections/Founder";
import { WebinarValue } from "@/components/sections/WebinarValue";
import { Pricing } from "@/components/sections/Pricing";
import { Library } from "@/components/sections/Library";
import { Resources } from "@/components/sections/Resources";
import { Community } from "@/components/sections/Community";
import { TrustMarks } from "@/components/sections/TrustMarks";
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
 * Layout is centred: copy sits in the middle of the viewport with the mark
 * centred behind it. Chosen by the client over the offset "aside" arrangement.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ORDER IS THE ARGUMENT
 *
 * The sections below are sequenced as one continuous case, not grouped by type.
 * Read top to bottom it goes: something changed → here is what changed → we are
 * not what you think we are → here is what we do instead → here is the proof →
 * here is who we are → here is what it costs → here is the easy first step.
 *
 * Two rules held while assembling it:
 *   1. Every claim is followed by the evidence for it, not three screens later.
 *      Transformation sits next to Curriculum; ProofStats sits next to
 *      Testimonials and StudentProjects.
 *   2. Nothing asks for money or an email before it has given something. The
 *      interactive demo comes before Pricing; the free guides come before the
 *      final CTA.
 *
 * Sections whose content has not been supplied render nothing — ProofStats,
 * StudentProjects, Testimonials, Library, Community, TrustMarks. The live page
 * is therefore shorter than this file suggests, and gets longer as real
 * material arrives rather than shipping placeholders. See content/home.ts.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function HomePage() {
  return (
    <>
      <div data-three-zone className="relative">
        <SceneMount />

        {/* ------------------------------------------------------------- Hero */}
        <section className="relative z-10 flex min-h-[100svh] items-center">
          <Container className="py-32 text-center">
            <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
              AI Thinking Academy · Ages {SITE.ageRange.min}–{SITE.ageRange.max}
            </p>

            <h1 className="mx-auto mt-6 max-w-4xl text-[length:var(--text-display)] text-ink">
              Teach your child to{" "}
              <span className="text-brand-gradient">think</span> before they use
              AI.
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-[length:var(--text-lead)] leading-relaxed text-slate">
              AI can already do the homework. It cannot do the thinking.
              BrainLIT builds the one thing that stays valuable — a child who
              can question, create and solve.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
          </Container>
        </section>

        {/* -------------------------------------------------------- The problem */}
        <section className="relative z-10 flex min-h-[90svh] items-center">
          <Container size="narrow" className="py-24 text-center">
            <Reveal>
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
          <Container size="narrow" className="py-24 text-center">
            <Reveal>
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

      {/* ── The case ─────────────────────────────────────────────────────── */}
      <WhyNow />

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

      <Comparison />

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
                  className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-2xl bg-mist/60 text-indigo"
                >
                  <PillarIcon pillar={pillar.key} className="size-[1.35rem]" />
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

      {/* ── What actually happens ────────────────────────────────────────── */}
      <Transformation />
      <Curriculum />
      <HowItWorks />
      <Journey />

      {/* ── Proof ───────────────────────────────────────────────────────── */}
      <ThinkingDemo />
      <ProofStats />
      <StudentProjects />
      <Testimonials />
      <Founder />

      {/* ── The offer ───────────────────────────────────────────────────── */}
      <WebinarValue />
      <Pricing />

      {/* ── Reasons to stay in touch ────────────────────────────────────── */}
      <Library />
      <Resources />
      <Community />
      <TrustMarks />

      {/* ── Close ───────────────────────────────────────────────────────── */}
      <FaqPreview />
      <FinalCta />

      <StickyCta />
    </>
  );
}
