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
    "Answers to what parents ask about BrainLIT — whether it is a coding class, screen time, ages, language, and what your child actually does.",
  alternates: { canonical: "/faq" },
};

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
        lead="If yours is not here, ask it at the free session — or message us."
      />

      <section className="py-20 sm:py-28">
        <Container size="narrow">
          <dl className="divide-y divide-mist border-y border-mist">
            {FAQS.map((faq, i) => (
              <Reveal key={faq.question} delay={i * 50} className="py-7">
                <dt className="font-display text-[1.125rem] font-semibold text-ink">
                  {faq.question}
                </dt>
                <dd className="mt-3 text-[1.0125rem] leading-relaxed text-slate">
                  {faq.answer}
                </dd>
              </Reveal>
            ))}
          </dl>

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
            {SITE.name} teaches children aged {SITE.ageRange.min}–
            {SITE.ageRange.max}, live and online.
          </p>
        </Container>
      </section>
    </>
  );
}
