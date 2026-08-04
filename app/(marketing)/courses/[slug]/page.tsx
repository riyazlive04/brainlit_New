import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { COURSES, findCourse } from "@/content/courses";
import { SITE } from "@/lib/site";

/**
 * Program detail.
 *
 * `COURSES` is empty until real programs are supplied, so this generates no
 * routes today and every /courses/* URL correctly 404s rather than rendering an
 * empty shell. Fill the array and the pages appear with no further work.
 */
export function generateStaticParams() {
  return COURSES.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const course = findCourse(slug);

  if (!course) return { title: "Program not found" };

  return {
    title: course.title,
    description: course.summary,
    alternates: { canonical: `/courses/${course.slug}` },
  };
}

export default async function CourseDetailPage({
  params,
}: PageProps<"/courses/[slug]">) {
  const { slug } = await params;
  const course = findCourse(slug);

  if (!course) notFound();

  const price =
    course.priceInr === null
      ? "Price on enquiry"
      : new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(course.priceInr);

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.summary,
    provider: {
      "@type": "EducationalOrganization",
      name: SITE.name,
      url: SITE.url,
    },
    typicalAgeRange: `${course.ageMin}-${course.ageMax}`,
    ...(course.priceInr !== null && {
      offers: {
        "@type": "Offer",
        price: String(course.priceInr),
        priceCurrency: "INR",
        category: "Paid",
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />

      <PageHeader
        eyebrow={`Ages ${course.ageMin}–${course.ageMax} · ${course.durationWeeks} weeks`}
        title={course.title}
        lead={course.summary}
      >
        <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Button href="/webinar" variant="spark" size="lg">
            Join the free session first
          </Button>
          <span className="font-display font-semibold text-ink">{price}</span>
        </div>
      </PageHeader>

      <section className="py-20 sm:py-28">
        <Container size="narrow">
          {course.outcomes.length > 0 && (
            <Reveal>
              <h2 className="text-[length:var(--text-h2)] text-ink">
                What your child will be able to do
              </h2>
              <ul className="mt-8 space-y-3.5">
                {course.outcomes.map((outcome) => (
                  <li key={outcome} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-2 size-2 shrink-0 rounded-full bg-brand-gradient"
                    />
                    <span className="text-[1.0125rem] leading-relaxed text-slate">
                      {outcome}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          {course.curriculum.length > 0 && (
            <Reveal className="mt-16">
              <h2 className="text-[length:var(--text-h2)] text-ink">
                What is covered
              </h2>
              <ol className="mt-8 space-y-8">
                {course.curriculum.map((module, i) => (
                  <li key={module.title} className="flex gap-5">
                    <span
                      aria-hidden="true"
                      className="font-display text-xl font-bold text-brand-gradient"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-display text-[length:var(--text-h3)] text-ink">
                        {module.title}
                      </h3>
                      <p className="mt-2 text-[0.975rem] leading-relaxed text-slate">
                        {module.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          )}
        </Container>
      </section>
    </>
  );
}
