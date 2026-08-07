import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { PillarIcon } from "@/components/brand/PillarIcon";
import { CinematicMount } from "@/components/three/CinematicMount";
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
 * The cinematic zone spans the first three and a half screens. One fixed canvas
 * sits behind them at z-0 while the copy rides above at z-10; those sections
 * stay transparent so the scene shows through, and everything after is opaque
 * white, which is what hides the canvas for the rest of the page.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE HERO IS A FILM, AND THE COPY IS NOT WAITING FOR IT
 *
 * Five shots play across this zone as the visitor scrolls: a boy throws a paper
 * rocket, the camera moves to his eyeline, the rocket burns, and the embers
 * become the BrainLIT mark. See components/three/lib/shots.ts.
 *
 * The client's brief said the site content should "pop up" once the sequence
 * lands. It does — but the HERO is not part of what waits. Headline, lead, both
 * CTAs and the trust facts are all painted in the first viewport, before a
 * single frame of 3D has loaded, for two reasons that are not negotiable:
 *
 *   1. The lead paragraph is the LCP element. It is server-rendered text and it
 *      must stay that way. See the note in components/three/CinematicMount.tsx
 *      for what happened the last time 3D got in front of it.
 *   2. A large share of traffic arrives from an ad, on a phone, intending to
 *      book the webinar. Making that person scroll three screens of film before
 *      they can find a button is a conversion decision, not a design one.
 *
 * What arrives on the mark instead is the philosophy screen at the end of the
 * zone — the line the whole sequence has been building toward. That is the
 * "pop", and it lands on the one screen where it means something.
 * ─────────────────────────────────────────────────────────────────────────────
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
      <div data-cinematic className="relative">
        <CinematicMount />

        {/* ------------------------------------------------- Shot 1 · the boy
            The hero copy, and the first frame of the film behind it.

            One column, capped and left-aligned from lg, deliberately leaving
            the right half of a desktop viewport empty. That empty half is the
            composition — it is where the boy stands and where the rocket has
            room to climb. The camera rig frames it explicitly; see the
            `narrow` handling in components/three/Cinematic.tsx for how it
            collapses on a phone, where he moves below the copy instead.

            The static artwork that used to occupy this space is gone. Two
            depictions of children on one screen, one of them animated, is one
            too many.

            `min-h` rather than `h`, because the stacked layout is taller than
            a small phone viewport and must be allowed to grow. */}
        <section className="relative z-10 flex min-h-[100svh] items-center">
          <Container size="wide" className="py-20 sm:py-24">
            <div className="lg:max-w-[36rem] xl:max-w-[40rem]">
              <div className="text-center lg:text-left">
                <p className="font-display text-xs font-semibold tracking-[0.22em] text-violet uppercase sm:text-sm">
                  AI Thinking Academy · Ages {SITE.ageRange.min}–
                  {SITE.ageRange.max}
                </p>

                {/* Smaller than --text-display, which is sized for a headline
                    spanning the full page. In a column it would wrap to six
                    lines and swamp the CTAs. */}
                <h1 className="mt-4 text-[clamp(2.35rem,4.5vw,3.5rem)] text-ink">
                  AI Literacy for{" "}
                  {/* Capitalised with CSS, not by typing NEXT GENERATION into
                      the DOM. Screen readers pronounce short all-caps strings
                      as initialisms — "N-E-X-T" — and the text also stops
                      matching a search for "next generation". Styling gets the
                      look without either cost.

                      `whitespace-nowrap` because the line was breaking after
                      "NEXT", splitting the phrase across two lines; and
                      `tracking-normal` cancels the -0.02em on h1, which reads
                      as cramped once the letters are caps. */}
                  <span className="tracking-normal whitespace-nowrap uppercase">
                    next generation
                  </span>{" "}
                  <span className="text-brand-gradient">
                    Thinkers and Leaders
                  </span>
                </h1>

                {/* Capped near 50 characters a line. Left at max-w-2xl the
                    measure runs long enough to hurt readability at this size —
                    but too narrow and it stacks into five airy lines, which is
                    what made the block read as loose. `leading-[1.55]` for the
                    same reason: --text-lead is already large, and 1.625 on top
                    of it opens gaps the eye reads as unfinished. */}
                <p className="mx-auto mt-6 max-w-[36rem] text-[length:var(--text-lead)] leading-[1.55] text-slate lg:mx-0">
                  AI can already do the homework. It cannot do the thinking.
                  BrainLIT builds the one thing that stays valuable — a child
                  who can question, create and solve.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                  <Button href="/webinar" variant="spark" size="lg">
                    Join the free webinar
                  </Button>
                  <Button href="/courses" variant="outline" size="lg">
                    Explore programs
                  </Button>
                </div>

                {/* Three separate facts, so three list items with drawn
                    separators — not one string with "·" typed into it. The
                    dividers are decorative and a screen reader skips them. */}
                <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-sm text-slate lg:justify-start">
                  {[
                    "Live online",
                    "Small batches",
                    `For parents in ${SITE.city} and across India`,
                  ].map((fact, i) => (
                    <li key={fact} className="flex items-center gap-3">
                      {i > 0 && (
                        <span
                          aria-hidden="true"
                          className="h-3.5 w-px bg-mist"
                        />
                      )}
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </section>

        {/* --------------------------------------- Shots 2, 3 and 4 · the film
            Empty scroll, on purpose.

            This is the throw, the move to his eyeline, and the burn. It carries
            no copy at all, and that is the point: shot 3 puts the camera behind
            a child's eyes watching something he made climb out of sight, and
            there is no sentence worth putting on top of that.

            It is also the only part of the page that exists purely to be
            scrolled through, so it is kept as short as the sequence can bear.
            Roughly 160svh here plus the tail of the hero gives shots 2–4 about
            two screens between them.

            `aria-hidden` and empty: a screen reader gets nothing from it, and
            there is nothing here to get. The argument resumes below. */}
        <div aria-hidden="true" className="h-[160svh]" />

        {/* The "homework is no longer the hard part" screen was removed at the
            client's request. Its argument is not lost — Why Now, immediately
            after this zone, makes the same case with more force and concrete
            detail, so the page now gets there one screen sooner. */}

        {/* --------------------------------------------------- Shot 5 · the mark
            The line the film has been building toward, arriving as the embers
            settle into the logo behind it.

            This is the one screen where copy sits directly over the densest
            part of the mark. The scrim behind the text block is what keeps it
            legible — see the note on `text-scrim` in globals.css. */}
        <section className="relative z-10 flex min-h-[90svh] items-center">
          <Container size="narrow" className="py-24 text-center">
            <div className="relative">
              <div aria-hidden="true" className="text-scrim" />

              <Reveal className="relative">
                <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
                  Our whole philosophy
                </p>
                <p className="mt-8 font-display text-[length:var(--text-h1)] leading-[1.1] font-semibold tracking-tight text-ink">
                  We don&apos;t teach children to depend on AI. We teach them to{" "}
                  <span className="text-brand-gradient">think</span>, so they
                  can lead it.
                </p>
              </Reveal>
            </div>
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
