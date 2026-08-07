import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { FAQS } from "@/content/home";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to what parents ask about BrainLIT - whether it is a coding class, screen time, ages, language, and what your child actually does.",
  alternates: { canonical: "/faq" },
};

/** Category order is authoring order in content/home.ts, deduplicated. */
const CATEGORIES = [...new Set(FAQS.map((faq) => faq.category))];

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function FaqPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <PageHeader
        eyebrow="Questions"
        title="The things parents actually ask."
        lead="If yours is not here, ask it at the free session - or message us."
        breadcrumbs={[{ label: "FAQ" }]}
      />

      <section className="py-20 sm:py-28">
        <Container size="narrow">
          {/* Jump list. With this many questions a flat wall is unusable on a
              phone — most parents arrive with one specific worry. */}
          <Reveal>
            <h2 className="sr-only">Jump to a topic</h2>
            <ul className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <li key={category}>
                  <a
                    href={`#${slugify(category)}`}
                    className="inline-flex min-h-9 items-center rounded-full border border-mist px-4 text-sm text-slate transition-colors hover:border-violet/40 hover:text-violet"
                  >
                    {category}
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>

          {CATEGORIES.map((category) => (
            <div key={category} className="mt-16 first:mt-14">
              <h2
                id={slugify(category)}
                className="scroll-mt-28 font-display text-sm font-medium tracking-[0.2em] text-violet uppercase"
              >
                {category}
              </h2>

              <dl className="mt-6 divide-y divide-mist border-y border-mist">
                {FAQS.filter((faq) => faq.category === category).map(
                  (faq, i) => (
                    <Reveal key={faq.question} delay={i * 50} className="py-7">
                      <dt className="font-display text-[1.125rem] font-semibold text-ink">
                        {faq.question}
                      </dt>
                      <dd className="mt-3 text-[1.0125rem] leading-relaxed text-slate">
                        {faq.answer}
                      </dd>
                    </Reveal>
                  ),
                )}
              </dl>
            </div>
          ))}

          <Reveal className="mt-14 rounded-2xl border border-mist bg-mist/25 p-8 text-center">
            <h2 className="font-display text-[length:var(--text-h3)] text-ink">
              Still not sure?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[0.975rem] leading-relaxed text-slate">
              Come to the free parent session and ask us directly. We would
              rather answer a hard question than have you enrol on a hunch.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/webinar" variant="spark" size="lg">
                Join the free session
              </Button>
              <Button href="/contact" variant="outline" size="lg">
                Ask us directly
              </Button>
            </div>
          </Reveal>

          <p className="mt-10 text-center text-sm text-slate">
            {SITE.name} teaches children aged {SITE.ageRange.min}-
            {SITE.ageRange.max}, live and online.
          </p>
        </Container>
      </section>
    </>
  );
}
