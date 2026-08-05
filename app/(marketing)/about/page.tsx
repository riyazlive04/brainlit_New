import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Founder } from "@/components/sections/Founder";
import { PILLARS, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "BrainLIT is an AI Thinking Academy for children aged 10–14. We teach children to think before they use AI — not how to operate the latest tool.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About BrainLIT"
        title={
          <>
            We are not trying to make your child{" "}
            <span className="text-brand-gradient">faster</span> at using AI.
          </>
        }
        lead="We are trying to make them harder to replace. Those are different goals, and almost everyone is chasing the first one."
        breadcrumbs={[{ label: "About" }]}
      />

      <section className="py-20 sm:py-28">
        <Container size="narrow">
          <Reveal>
            <h2 className="text-[length:var(--text-h2)] text-ink">
              Why this exists
            </h2>
            <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate">
              A child can now produce a finished essay, a working script or a
              polished presentation in seconds. Schools are still grading the
              output. Which means the thing being measured has quietly stopped
              measuring anything.
            </p>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate">
              What has not been automated is the judgement to know whether an
              answer is any good, the curiosity to ask a better question, and
              the nerve to disagree with something confident and wrong. Those
              are teachable. They are just not being taught.
            </p>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate">
              That gap is the whole reason {SITE.name} exists.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="bg-mist/30 py-20 sm:py-28">
        <Container size="narrow">
          <Reveal>
            <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
              Our position
            </p>
            <p className="mt-8 font-display text-[length:var(--text-h2)] leading-tight font-semibold text-ink">
              We don&apos;t teach children to depend on AI. We teach them to{" "}
              <span className="text-brand-gradient">think</span>, so they can
              lead it.
            </p>
            <p className="mt-8 text-[1.0625rem] leading-relaxed text-slate">
              AI will take over most routine tasks, and that is fine. It cannot
              replace a child who knows how to think, question, create and
              solve a problem worth solving. We would rather build that child
              than one who is very good at prompting.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container>
          <Reveal className="max-w-2xl">
            <h2 className="text-[length:var(--text-h2)] text-ink">
              The seven things we build
            </h2>
            <p className="mt-5 text-[1.0125rem] leading-relaxed text-slate">
              Not subjects on a timetable. Habits of mind, practised until they
              become the default.
            </p>
          </Reveal>

          <ul className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((pillar, i) => (
              <Reveal as="li" key={pillar.key} delay={i * 60}>
                <h3 className="font-display text-[length:var(--text-h3)] text-ink">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-slate">
                  {pillar.blurb}
                </p>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      <Founder />

      <section className="border-t border-mist py-20 sm:py-24">
        <Container size="narrow" className="text-center">
          <Reveal>
            <h2 className="text-[length:var(--text-h2)] text-ink">
              Come and judge for yourself.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-slate">
              The free parent session is the fastest way to work out whether any
              of this is right for your child.
            </p>
            <Button href="/webinar" variant="spark" size="lg" className="mt-9">
              Join the free session
            </Button>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
