import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { PillarIcon } from "@/components/brand/PillarIcon";
import { CinematicMount } from "@/components/three/CinematicMount";
import { StickyCta } from "@/components/layout/StickyCta";
import { WhyNow } from "@/components/sections/WhyNow";
import { Comparison } from "@/components/sections/Comparison";
import { Curriculum } from "@/components/sections/Curriculum";
import { Journey } from "@/components/sections/Journey";
import { ThinkingDemo } from "@/components/sections/ThinkingDemo";
import { ProofStats } from "@/components/sections/ProofStats";
import { StudentProjects } from "@/components/sections/StudentProjects";
import { Testimonials } from "@/components/sections/Testimonials";
import { Founder } from "@/components/sections/Founder";
import { Pricing } from "@/components/sections/Pricing";
import { Community } from "@/components/sections/Community";
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
 * The cinematic zone spans the first three screens. One fixed canvas
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
 *      Curriculum sits next to Journey; ProofStats sits next to Testimonials
 *      and StudentProjects.
 *   2. Nothing asks for money or an email before it has given something. The
 *      interactive demo comes before Pricing; the free guides come before the
 *      final CTA.
 *
 * Sections whose content has not been supplied render nothing — ProofStats,
 * StudentProjects, Testimonials, Community. The live page is therefore shorter
 * than this file suggests, and gets longer as real material arrives rather than
 * shipping placeholders. See content/home.ts.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT WAS CUT, AND WHY IT IS NOT COMING BACK BY ACCIDENT (Aug 2026)
 *
 * Eleven blocks were removed as doing no work for the site's actual jobs — build
 * trust, capture leads, fill the webinar, convert to enrolment, show student
 * work. Recorded here so nobody re-adds them thinking they were an oversight:
 *
 *   - The 160svh spacer inside the cinematic zone. Dead markup: the zone's own
 *     height sets the scrub length, so the spacer bought no film and cost a
 *     screen of scroll. The zone also came down 400svh → 300svh.
 *   - TrustMarks. Third-party logos are the weakest trust signal available to
 *     us, and Testimonials and StudentProjects do that job far harder.
 *   - Library (podcast + articles). Right content, wrong container — it belongs
 *     on /podcast and /blog, which are still to be built.
 *   - HowItWorks. Its four steps were a strict subset of Journey's eight
 *     stages. Journey kept; the same argument is not made twice.
 *   - The Positioning block. It said "Thinking academy, not a coding academy" —
 *     which the philosophy screen says above it and Comparison proves in five
 *     rows below it. Three statements of one idea in a row.
 *   - Four of the seven items in FOUNDER.mission, which restated the seven
 *     pillars in the founder's voice one screen after the pillars themselves.
 *   - Resources ("Useful things, on the way"), removed at the client's request.
 *     Its guide list shipped empty — RESOURCES in content/home.ts has no
 *     entries — so the band was a heading promising future files next to a
 *     subscribe box. NOTE: it carried the only NewsletterForm on the site, the
 *     footer's signup having been removed separately, so the site now captures
 *     no email addresses at all. components/forms/NewsletterForm.tsx and
 *     /api/newsletter both still work; nothing renders them.
 *   - Transformation ("The same tool, used two completely different ways"),
 *     removed at the client's request. It was the before/after contrast on a
 *     child — asks for the answer → asks for options and chooses. TRANSFORMATION
 *     in content/home.ts is now unused; nothing renders it.
 *   - WebinarValue ("One hour, for parents…"), removed at the client's request.
 *     It was the only place the free session was EXPLAINED rather than merely
 *     linked: the AI myths, screen time, the careers question, the thinking
 *     framework, the live Q&A and the programme walkthrough. Filling the
 *     webinar is one of this page's stated jobs and four CTAs still point at
 *     it, but nothing now says what an hour of it actually contains — the ask
 *     is made without the offer. WEBINAR_VALUE survives in content/home.ts,
 *     unused, if that argument is ever wanted back.
 *   - The outcomes block inside Curriculum ("Six things, and none of them is a
 *     certificate of attendance"), removed at the client's request. It was not
 *     its own section — it sat under the week-by-week roadmap, pairing "what
 *     happens" with "so what". Curriculum now describes the schedule only.
 *     OUTCOMES survives in content/home.ts, rendered by nothing.
 *   - FaqPreview, removed at the client's request: the same questions are
 *     answered on the webinar landing page, which is where the traffic that
 *     asks them is going. THE COMPONENT STAYS — app/webinar/page.tsx still
 *     renders it, and /faq is unaffected.
 *     One cost, since it is not obvious: the homepage instance was the one
 *     emitting FAQPage structured data (`includeSchema` defaults true; the
 *     webinar page turns it off because that page is noindex). /faq has its own
 *     copy of that markup, so the site keeps it — but it is no longer on the
 *     highest-authority page, which is where these questions, searched almost
 *     verbatim by parents, had the best chance of a rich result.
 *
 * Note what went with all of that, so the gaps are decisions and not surprises.
 * Comparison contrasts US against other academies, and Transformation was the
 * only block contrasting A CHILD before against after — item 7 of the homepage
 * improvement brief, and no longer made anywhere on the page. With OUTCOMES
 * gone too, nothing now states what a child ends up holding: Curriculum lists
 * the weeks, and the portfolio, the presentation and the finished project are
 * only mentioned in passing in the Comparison table.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function HomePage() {
  return (
    <>
      {/* 500svh, up from 300, to HALVE the speed of the film.
          ─────────────────────────────────────────────────────────────────────
          THIS IS THE ONLY NUMBER THAT SETS THE PACE. ScrollTrigger runs this
          zone `top top` -> `bottom bottom`, so progress is scroll position over
          (zone height − viewport). Nothing inside the zone can change that: the
          box has a height of its own and its children do not add to it. See the
          note further down about the spacer that used to sit here.

          Measured at 1440x900:

                        scrub      screens/shot   empty scroll
              300svh    1800px     0.36–0.44      1.23 screens
              500svh    3600px     0.72–0.88      3.23 screens

          The cost is stated in that last column and it is the real trade: two
          extra screens of nothing for a reader who does not care about the
          animation. 500 rather than higher because the empty run grows one
          screen for every 100svh added here, and past about three screens it
          stops reading as a slow film and starts reading as a broken page.

          `min-h` rather than `h`: the hero inside is `min-h-[100svh]` and can
          outgrow a short phone viewport. With a fixed height that overflows;
          with a minimum the zone grows, and a longer zone only makes the film
          slower, which is the direction that is safe. */}
      <div data-cinematic className="relative min-h-[500svh]">
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

        {/* Shots 2, 3 and 4 — the throw, the move to his eyeline, and the burn
            — play across the rest of this zone with no copy over them, which is
            the point: shot 3 puts the camera behind a child's eyes watching
            something he made climb out of sight, and there is no sentence worth
            putting on top of that.

            There is deliberately no spacer element here. One used to sit in
            this position and it did nothing: the zone is a fixed height, so its
            children cannot lengthen the scroll the film is scrubbed against.
            It bought no extra frames and cost a screen of scrolling.

            The "homework is no longer the hard part" screen was removed earlier
            at the client's request. Its argument is not lost — Why Now, just
            below, makes the same case with more force and concrete detail. */}
      </div>

      {/* ------------------------------------------------------ The philosophy
          AFTER the cinematic, not inside it.

          This used to be the last screen of the zone, and it was written for a
          beat that no longer exists: "copy sits directly over the densest part
          of the mark", back when the sequence ended with embers settling into
          a logo. A settled logo is a background. What ends the sequence now is
          an aeroplane flying into the viewer's face, and no scrim makes a
          sentence readable over that — the two simply competed, and at the
          moment the plane is largest the line was directly behind it.

          Outside the zone it arrives when the film is over: the aircraft has
          gone, the canvas has faded with the zone, and the line lands on a
          clean page. It is the last thing said rather than a caption over the
          last thing shown.

          The zone keeps its own height, so the sequence still gets its full
          scrub — moving this out costs the animation nothing.
          `text-scrim` is left in place: harmless here, and still correct if the
          copy is ever moved back over artwork. */}
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
                <span className="text-brand-gradient">think</span>, so they can
                lead it.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── The case ─────────────────────────────────────────────────────── */}
      <WhyNow />

      {/* Why Now goes straight into Comparison. A "Positioning" screen used to
          sit between them, saying "an AI Thinking Academy, not another coding
          academy" — which is what the philosophy screen says above it and what
          Comparison demonstrates in five rows immediately below. Removing the
          middle statement of three loses no argument and saves a screen. */}
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
      <Curriculum />
      {/* Journey carries the process on its own. HowItWorks sat here and its
          four steps were a strict subset of Journey's eight stages. */}
      <Journey />

      {/* ── Proof ───────────────────────────────────────────────────────── */}
      <ThinkingDemo />
      <ProofStats />
      <StudentProjects />
      <Testimonials />
      <Founder />

      {/* ── The offer ───────────────────────────────────────────────────── */}
      <Pricing />

      {/* ── Reasons to stay in touch ────────────────────────────────────── */}
      <Community />

      {/* ── Close ───────────────────────────────────────────────────────── */}
      <FinalCta />

      <StickyCta />
    </>
  );
}
