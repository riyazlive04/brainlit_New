import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { COURSES, PROGRAM_ESSENTIALS } from "@/content/courses";
import { SITE, whatsappHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Live online AI thinking programs for children aged 10–14. Small batches, real projects, and a focus on judgement rather than tools.",
  alternates: { canonical: "/courses" },
};

function formatPrice(priceInr: number | null) {
  if (priceInr === null) return "Price on enquiry";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(priceInr);
}

export default function CoursesPage() {
  const whatsapp = whatsappHref(
    "Hi BrainLIT, I would like to know about your programs and fees.",
  );

  return (
    <>
      <PageHeader
        eyebrow="Programs"
        title="Live online, small batches, and a project your child can defend."
        lead={`For ages ${SITE.ageRange.min}–${SITE.ageRange.max}. Every program teaches the same seven habits of mind — they differ in depth, not in philosophy.`}
      />

      <section className="py-20 sm:py-28">
        <Container>
          {COURSES.length > 0 ? (
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {COURSES.map((course, i) => (
                <Reveal as="li" key={course.slug} delay={i * 70}>
                  <article className="flex h-full flex-col rounded-2xl border border-mist p-7 transition-colors hover:border-violet/40">
                    <h2 className="font-display text-[length:var(--text-h3)] text-ink">
                      {course.title}
                    </h2>
                    <p className="mt-2 text-sm text-violet">
                      Ages {course.ageMin}–{course.ageMax} ·{" "}
                      {course.durationWeeks} weeks
                    </p>
                    <p className="mt-4 flex-1 text-[0.95rem] leading-relaxed text-slate">
                      {course.summary}
                    </p>
                    <p className="mt-5 font-display font-semibold text-ink">
                      {formatPrice(course.priceInr)}
                    </p>
                    <Link
                      href={`/courses/${course.slug}`}
                      className="mt-4 font-display text-[0.95rem] font-semibold text-violet hover:underline"
                    >
                      See what is covered →
                    </Link>
                  </article>
                </Reveal>
              ))}
            </ul>
          ) : (
            /* Honest empty state. Better than inventing program names and
               prices that would have to be retracted — and it routes to the
               free session, which is the correct conversion path anyway. */
            <Reveal className="mx-auto max-w-2xl rounded-2xl border border-mist bg-mist/25 p-8 text-center sm:p-12">
              <h2 className="font-display text-[length:var(--text-h3)] text-ink">
                Program dates and fees are being finalised.
              </h2>
              <p className="mt-4 text-[1.0125rem] leading-relaxed text-slate">
                The next batch is being scheduled now. The free parent session
                is where we walk through exactly what is taught, how long it
                runs and what it costs — and you can ask whatever you like
                before deciding anything.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button href="/webinar" variant="spark" size="lg">
                  Join the free session
                </Button>
                {whatsapp && (
                  <Button href={whatsapp} external variant="outline" size="lg">
                    Ask about fees
                  </Button>
                )}
              </div>
            </Reveal>
          )}
        </Container>
      </section>

      <section className="bg-mist/30 py-20 sm:py-28">
        <Container>
          <Reveal className="max-w-2xl">
            <h2 className="text-[length:var(--text-h2)] text-ink">
              True of every program
            </h2>
          </Reveal>

          <ul className="mt-12 grid gap-8 sm:grid-cols-2">
            {PROGRAM_ESSENTIALS.map((item, i) => (
              <Reveal as="li" key={item.title} delay={i * 70}>
                <h3 className="font-display text-[length:var(--text-h3)] text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-[0.975rem] leading-relaxed text-slate">
                  {item.body}
                </p>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
