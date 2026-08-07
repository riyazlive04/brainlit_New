import { Button } from "@/components/ui/Button";
import { SITE } from "@/lib/site";

/**
 * Shared copy blocks for the layout lab.
 *
 * Every variant renders exactly the same words so the only thing being compared
 * is the arrangement. Text alignment is passed in, because a centred column and
 * a left column want different treatments.
 */

export function HeroCopy({ align = "center" }: { align?: "center" | "left" }) {
  const centred = align === "center";

  return (
    <>
      <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
        AI Thinking Academy · Ages {SITE.ageRange.min}-{SITE.ageRange.max}
      </p>

      <h1
        className={`mt-6 text-[length:var(--text-display)] text-ink ${
          centred ? "mx-auto max-w-4xl" : "max-w-2xl"
        }`}
      >
        AI Literacy for{" "}
        <span className="tracking-normal uppercase">next generation</span>{" "}
        <span className="text-brand-gradient">Thinkers and Leaders</span>
      </h1>

      <p
        className={`mt-7 text-[length:var(--text-lead)] leading-relaxed text-slate ${
          centred ? "mx-auto max-w-2xl" : "max-w-lg"
        }`}
      >
        AI can already do the homework. It cannot do the thinking. BrainLIT
        builds the one thing that stays valuable - a child who can question,
        create and solve.
      </p>

      <div
        className={`mt-10 flex flex-col gap-3 sm:flex-row ${
          centred ? "items-center justify-center" : "items-start"
        }`}
      >
        <Button href="/webinar" variant="spark" size="lg">
          Join the free webinar
        </Button>
        <Button href="/courses" variant="outline" size="lg">
          Explore programs
        </Button>
      </div>
    </>
  );
}

export function ProblemCopy() {
  return (
    <>
      <h2 className="text-[length:var(--text-h2)] text-ink">
        The homework is no longer the hard part.
      </h2>
      <p className="mt-6 text-[length:var(--text-lead)] leading-relaxed text-slate">
        A child can now get a finished essay in four seconds. What they cannot
        get is the judgement to know whether it is any good, the curiosity to
        ask a better question, or the confidence to disagree with it.
      </p>
    </>
  );
}

export function PhilosophyCopy() {
  return (
    <>
      <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
        Our whole philosophy
      </p>
      <p className="mt-8 font-display text-[length:var(--text-h1)] leading-[1.1] font-semibold tracking-tight text-ink">
        We don&apos;t teach children to depend on AI. We teach them to{" "}
        <span className="text-brand-gradient">think</span>, so they can lead it.
      </p>
    </>
  );
}
