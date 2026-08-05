import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { getCourseBySlug, getPublishedCourses } from "@/lib/content";
import { PROGRAM_ESSENTIALS } from "@/content/courses";
import { SITE, whatsappHref } from "@/lib/site";

export const revalidate = 300;

/**
 * Programme detail, driven by the admin panel.
 *
 * Pre-renders whatever is published at build time. Anything published later
 * renders on demand and is then cached, so a new programme goes live within the
 * revalidate window without a deploy — and an unknown slug still 404s.
 */
export async function generateStaticParams() {
  const courses = await getPublishedCourses();
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) return { title: "Programme not found" };

  return {
    title: course.title,
    description: course.summary ?? undefined,
    alternates: { canonical: `/courses/${course.slug}` },
  };
}

function formatPrice(priceInr: number | null) {
  if (priceInr === null) return "Price on enquiry";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(priceInr);
}

export default async function CourseDetailPage({
  params,
}: PageProps<"/courses/[slug]">) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) notFound();

  const whatsapp = whatsappHref(
    `Hi BrainLIT, I would like to know more about "${course.title}".`,
  );

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.summary ?? SITE.description,
    provider: {
      "@type": "EducationalOrganization",
      name: SITE.name,
      url: SITE.url,
    },
    typicalAgeRange: `${course.age_min}-${course.age_max}`,
    ...(course.price_inr !== null && {
      offers: {
        "@type": "Offer",
        price: String(course.price_inr),
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
        eyebrow={`Ages ${course.age_min}–${course.age_max}${
          course.duration_weeks ? ` · ${course.duration_weeks} weeks` : ""
        }`}
        title={course.title}
        lead={course.summary ?? undefined}
        backHref="/courses"
        backLabel="All programmes"
        breadcrumbs={[
          { label: "Programs", href: "/courses" },
          { label: course.title },
        ]}
      >
        <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Button href="/webinar" variant="spark" size="lg">
            Join the free session first
          </Button>
          <span className="font-display font-semibold text-ink">
            {formatPrice(course.price_inr)}
          </span>
        </div>
      </PageHeader>

      <section className="py-20 sm:py-28">
        <Container size="narrow">
          <Reveal>
            <h2 className="text-[length:var(--text-h2)] text-ink">
              How this programme runs
            </h2>
            <ul className="mt-8 space-y-6">
              {PROGRAM_ESSENTIALS.map((item) => (
                <li key={item.title}>
                  <h3 className="font-display text-[length:var(--text-h3)] text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-[0.975rem] leading-relaxed text-slate">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="mt-14 rounded-2xl border border-mist bg-mist/25 p-8 text-center">
            <h2 className="font-display text-[length:var(--text-h3)] text-ink">
              Not sure if this is the right fit?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[0.975rem] leading-relaxed text-slate">
              Come to the free parent session first. We will tell you honestly
              whether your child is ready for this one.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/webinar" variant="spark" size="lg">
                Join the free session
              </Button>
              {whatsapp && (
                <Button href={whatsapp} external variant="outline" size="lg">
                  Ask a question
                </Button>
              )}
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
