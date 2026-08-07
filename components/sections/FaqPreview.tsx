import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { FAQS, HOMEPAGE_FAQS, type Faq } from "@/content/home";

/**
 * Structured data must describe what is actually on the page — Google treats
 * FAQPage markup listing questions the visitor cannot see as a violation. That
 * is why the schema below is built from the `faqs` actually rendered rather
 * than from FAQS wholesale, and why /faq, which shows every question, marks up
 * every question.
 */

type FaqPreviewProps = {
  /** Which questions to show. Defaults to the homepage set. */
  faqs?: readonly Faq[];
  /**
   * Whether to offer the way through to /faq.
   *
   * Off on the webinar landing page. That page carries no navigation on
   * purpose — see the note at the top of app/webinar/page.tsx — because every
   * link on it is an exit from the one conversion it exists to get, and this
   * one would sit directly under the registration form.
   */
  showAllLink?: boolean;
  /**
   * Whether to emit FAQPage markup.
   *
   * Off wherever the page is noindex, which is the webinar landing page. The
   * markup would never be read there, and the page already carries Event
   * schema that Google does have a reason to look at.
   */
  includeSchema?: boolean;
};

/**
 * FAQ preview.
 *
 * Rendered as native <details>, not a JS accordion: it works before hydration,
 * it is keyboard accessible for free, and browser find-in-page can reach text
 * inside a closed <details>. A hand-rolled accordion gives up all three.
 *
 * Also emits FAQPage structured data — but note where that now lands. This used
 * to render on the homepage as well, and that instance was the one carrying the
 * markup; it was removed at the client's request because the same questions are
 * answered on the webinar landing page. The only caller left is that page, and
 * it passes `includeSchema={false}` because it is noindex. So this component no
 * longer emits FAQPage markup anywhere. /faq keeps its own copy, which is why
 * the site still has it at all.
 *
 * Parents search these questions almost verbatim, so if a rich result is ever
 * wanted back on a page with real authority, re-rendering this on the homepage
 * with default props is the whole fix.
 */
export function FaqPreview({
  faqs = HOMEPAGE_FAQS,
  showAllLink = true,
  includeSchema = true,
}: FaqPreviewProps = {}) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <section className="relative z-10 bg-paper py-24 sm:py-32">
      {includeSchema && (
        <script
          type="application/ld+json"
          // Content is authored by us, not user input, so there is nothing here
          // that could inject markup.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

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
          {faqs.map((faq, i) => (
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

        {showAllLink && (
          <Reveal className="mt-10">
            <Link
              href="/faq"
              className="font-display text-[0.975rem] font-semibold text-violet hover:underline"
            >
              Read all {FAQS.length} questions →
            </Link>
          </Reveal>
        )}
      </Container>
    </section>
  );
}
