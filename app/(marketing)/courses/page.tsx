import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { PROGRAM_ESSENTIALS } from "@/content/courses";
import { getPublishedCourses } from "@/lib/content";
import { SITE, whatsappHref } from "@/lib/site";
import { cn } from "@/lib/cn";
import { publicStorageUrl } from "@/lib/storage";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Live online AI thinking programs for children aged 10-14. Small batches, real projects, and a focus on judgement rather than tools.",
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

/** Revalidates every five minutes, so a programme published in the admin panel
 *  reaches the public site without a deploy. */
export const revalidate = 300;

export default async function CoursesPage() {
  const courses = await getPublishedCourses();

  const whatsapp = whatsappHref(
    "Hi BrainLIT, I would like to know about your programs and fees.",
  );

  return (
    <>
      <PageHeader
        eyebrow="Programs"
        title="Live online, small batches, and a project your child can defend."
        lead={`For ages ${SITE.ageRange.min}-${SITE.ageRange.max}. Every program teaches the same seven habits of mind - they differ in depth, not in philosophy.`}
        breadcrumbs={[{ label: "Programs" }]}
      />

      <section className="py-20 sm:py-28">
        <Container>
          {courses.length > 0 ? (
            /**
             * THE GRID FOLLOWS THE COUNT. It was `md:grid-cols-2
             * lg:grid-cols-3` unconditionally, which is right for six
             * programmes and wrong for the number there actually are: one
             * course rendered as a narrow third of a row, marooned in an empty
             * two-thirds, reading as a page that had failed to load the rest.
             *
             * A single programme is not a grid, it is a feature — so it gets
             * the full measure and lays its details out beside its price. Two
             * sit as a pair. Three or more earn the three-column grid the
             * original was written for.
             */
            <ul
              className={cn(
                "grid gap-6",
                courses.length === 1 && "mx-auto max-w-3xl",
                courses.length === 2 && "mx-auto max-w-4xl sm:grid-cols-2",
                courses.length > 2 && "md:grid-cols-2 lg:grid-cols-3",
              )}
            >
              {courses.map((course, i) => {
                const solo = courses.length === 1;
                const image = publicStorageUrl("course-images", course.image_path);
                const facts = [
                  `Ages ${course.age_min}-${course.age_max}`,
                  course.duration_weeks ? `${course.duration_weeks} weeks` : null,
                  "Live online",
                ].filter(Boolean) as string[];

                return (
                  <Reveal as="li" key={course.id} delay={i * 70}>
                    <article
                      className={cn(
                        "group h-full rounded-2xl border border-mist bg-paper p-7 transition-[border-color,box-shadow] hover:border-violet/40 hover:shadow-[0_18px_40px_-24px_rgba(11,16,32,0.35)]",
                        solo ? "sm:p-9" : "flex flex-col",
                        // Two columns only when there is a photograph to make
                        // the second one.
                        solo && image && "sm:flex sm:gap-8",
                      )}
                    >
                      {/* THE PHOTOGRAPH IS A COLUMN, not something stacked
                          inside the text. A 16:9 box with `object-cover`,
                          because programme photographs arrive in whatever shape
                          the camera produced, and a row of cards whose images
                          are each a different height is what makes a grid look
                          broken.

                          `unoptimized` — the host is a storage bucket that is
                          not in `images.remotePatterns`, and the optimiser
                          refuses unconfigured hosts. */}
                      {image && (
                        <div
                          className={cn(
                            "overflow-hidden rounded-xl bg-mist",
                            solo ? "mb-6 sm:mb-0 sm:w-72 sm:shrink-0" : "mb-6",
                          )}
                        >
                          <Image
                            src={image}
                            alt={`${course.title} in progress`}
                            width={1280}
                            height={720}
                            unoptimized
                            sizes={solo ? "(min-width: 640px) 18rem, 92vw" : "(min-width: 1024px) 24rem, 92vw"}
                            className="aspect-video w-full object-cover transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] group-hover:scale-[1.02]"
                          />
                        </div>
                      )}

                      <div
                        className={cn(
                          solo ? "sm:flex sm:flex-1 sm:flex-col" : "flex flex-1 flex-col",
                        )}
                      >
                        <h2 className="font-display text-[length:var(--text-h3)] text-ink">
                          {course.title}
                        </h2>

                        {/* Facts as chips rather than a run-on line. They are
                            the three things a parent scans for, and a single
                            grey sentence is the one shape that hides them. */}
                        <ul className="mt-4 flex flex-wrap gap-2">
                          {facts.map((fact) => (
                            <li
                              key={fact}
                              className="rounded-full bg-mist/70 px-3 py-1 text-xs font-medium text-ink"
                            >
                              {fact}
                            </li>
                          ))}
                        </ul>

                        {/* Rendered only when it SAYS something. The column is
                            nullable, and it is also routinely filled with the
                            programme's own name while the real copy is still
                            being written — in both cases an empty paragraph or
                            an echo of the heading looks like a bug rather than
                            a blank. */}
                        {course.summary &&
                          course.summary.trim().toLowerCase() !==
                            course.title.trim().toLowerCase() && (
                            <p className="mt-5 flex-1 text-[0.975rem] leading-relaxed text-slate">
                              {course.summary}
                            </p>
                          )}
                        {/* ALWAYS A FOOTER, never a third column.
                            An earlier version made it a bordered side column on
                            the feature card, which worked until the card also
                            had a photograph — then the price floated against
                            the middle of the picture while the title sat under
                            it. One position that holds in every combination
                            beats two that each hold in one.

                            `mt-auto` pins it to the bottom of the column, so a
                            long summary and a short one end at the same line. */}
                        <div
                          className={cn(
                            "mt-6 border-t border-mist pt-6",
                            solo &&
                              "sm:mt-auto sm:flex sm:items-end sm:justify-between sm:gap-6",
                          )}
                        >
                          <div>
                            <p className="font-display text-[1.75rem] leading-none font-bold text-ink">
                              {formatPrice(course.price_inr)}
                            </p>
                            <p className="mt-1.5 text-xs text-slate">
                              {course.price_inr === null
                                ? "Ask us for the current batch"
                                : "Per child, for the full programme"}
                            </p>
                          </div>

                          {/* A button, not a text link. This is the only action
                              on the card and it was the least visible thing on
                              it. */}
                          <Button
                            href={`/courses/${course.slug}`}
                            variant="outline"
                            size="sm"
                            className={cn(
                              "mt-5 w-full justify-center",
                              solo && "sm:mt-0 sm:w-auto sm:shrink-0",
                            )}
                          >
                            See what is covered
                          </Button>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
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
                runs and what it costs - and you can ask whatever you like
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
