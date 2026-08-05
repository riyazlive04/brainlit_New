import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { FAQS, HOMEPAGE_FAQS } from "@/content/home";

/**
 * Structured data must describe what is actually on the page — Google treats
 * FAQPage markup listing questions the visitor cannot see as a violation. So
 * the homepage marks up only the six it renders; /faq marks up all of them.
 */


/**
 * FAQ preview.
 *
 * Rendered as native <details>, not a JS accordion: it works before hydration,
 * it is keyboard accessible for free, and browser find-in-page can reach text
 * inside a closed <details>. A hand-rolled accordion gives up all three.
 *
 * Also emits FAQPage structured data. Of everything on this page it is the most
 * likely to earn a rich result, because parents search these questions almost
 * verbatim.
 */
export function FaqPreview() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOMEPAGE_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <section className="relative z-10 bg-paper py-24 sm:py-32">
      <script
        type="application/ld+json"
        // Content is authored by us, not user input, so there is nothing here
        // that could inject markup.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Container size="narrow">
        <Reveal>
          <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
            Questions parents ask
          </p>
          <h2 className="mt-5 text-[length:var(--text-h2)] text-ink">
            The things you are probably wondering.
          </h2>
        </Reveal>

        <div className="mt-12 divide-y divide-mist border-y border-mist">
          {HOMEPAGE_FAQS.map((faq, i) => (
            <Reveal key={faq.question} delay={i * 60}>
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 font-display text-[1.0625rem] font-semibold text-ink marker:hidden [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-violet transition-transform duration-300 group-open:rotate-45"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M8 3v10M3 8h10" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 pr-10 text-[0.975rem] leading-relaxed text-slate">
                  {faq.answer}
                </p>
              </details>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10">
          <Link
            href="/faq"
            className="font-display text-[0.975rem] font-semibold text-violet hover:underline"
          >
            Read all {FAQS.length} questions →
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
