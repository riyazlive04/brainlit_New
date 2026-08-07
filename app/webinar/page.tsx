import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/brand/Wordmark";
import { BackLink } from "@/components/ui/BackLink";
import { WebinarForm } from "@/components/forms/WebinarForm";
import { FaqPreview } from "@/components/sections/FaqPreview";
import {
  formatSessionDate,
  formatSessionTime,
  getNextWebinarSession,
} from "@/lib/webinar";
import { LEGAL_LINKS, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free session for parents",
  description:
    "A free live session for parents: how to raise a child who thinks before they use AI. Ask us anything - no pitch to sit through.",
  alternates: { canonical: "/webinar" },
  // Ad landing pages should not compete with the homepage for the same terms.
  robots: { index: false, follow: true },
};

/**
 * Webinar landing page.
 *
 * Deliberately OUTSIDE the (marketing) route group, so it has no global
 * navigation. Every link in a header is an exit from a page whose only job is
 * one conversion — this is where paid traffic lands, and the header is the most
 * expensive thing you can put on it.
 *
 * Revalidates hourly so a newly scheduled session appears without a deploy,
 * while still serving from cache for the ad traffic that hits it hardest.
 */
export const revalidate = 3600;

const PROMISES = [
  "Why “learn to code” is no longer the answer, and what replaced it",
  "The four questions a child should ask before trusting any AI answer",
  "How to tell whether your child is using AI to think, or to avoid thinking",
  "What we actually teach, and whether your child is ready for it",
];

export default async function WebinarPage() {
  const session = await getNextWebinarSession();

  const eventSchema = session
    ? {
        "@context": "https://schema.org",
        "@type": "Event",
        name: session.title,
        startDate: session.starts_at,
        eventAttendanceMode:
          "https://schema.org/OnlineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: {
          "@type": "VirtualLocation",
          url: `${SITE.url}/webinar`,
        },
        organizer: { "@type": "Organization", name: SITE.name, url: SITE.url },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: `${SITE.url}/webinar`,
        },
      }
    : null;

  return (
    <>
      {eventSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
        />
      )}

      {/* Mark and a back control only — still no navigation menu. A visitor
          who wants to leave will leave; giving them one clear way back is
          better UX than making them hunt for the browser button, and it is far
          cheaper than a full nav bar full of competing exits. */}
      <header className="border-b border-mist">
        <Container
          size="wide"
          className="flex h-18 items-center justify-between gap-4 py-4"
        >
          <Wordmark href="/" />
          <BackLink label="Back" />
        </Container>
      </header>

      <main className="flex-1 bg-paper">
        <Container size="wide" className="py-14 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_minmax(360px,0.95fr)] lg:gap-16">
            <div>
              <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
                Free · Live online · For parents
              </p>

              <h1 className="mt-6 text-[length:var(--text-h1)] text-ink">
                Your child will use AI either way. The question is whether they
                can <span className="text-brand-gradient">think</span> first.
              </h1>

              <p className="mt-6 max-w-xl text-[length:var(--text-lead)] leading-relaxed text-slate">
                A free session for parents of {SITE.ageRange.min}-
                {SITE.ageRange.max} year olds. No pitch to sit through - bring
                the questions you have actually been worrying about.
              </p>

              {session && (
                <div className="mt-8 inline-flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-mist bg-mist/25 px-6 py-4">
                  <div>
                    <p className="text-xs tracking-wide text-slate uppercase">
                      Next session
                    </p>
                    <p className="mt-0.5 font-display font-semibold text-ink">
                      {formatSessionDate(session.starts_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs tracking-wide text-slate uppercase">
                      Time
                    </p>
                    <p className="mt-0.5 font-display font-semibold text-ink">
                      {formatSessionTime(session.starts_at)} IST
                    </p>
                  </div>
                  <div>
                    <p className="text-xs tracking-wide text-slate uppercase">
                      Length
                    </p>
                    <p className="mt-0.5 font-display font-semibold text-ink">
                      {session.duration_minutes} min
                    </p>
                  </div>
                </div>
              )}

              <h2 className="mt-12 font-display text-[length:var(--text-h3)] text-ink">
                What we will cover
              </h2>
              <ul className="mt-5 space-y-3.5">
                {PROMISES.map((promise) => (
                  <li key={promise} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-gradient"
                    />
                    <span className="text-[0.975rem] leading-relaxed text-slate">
                      {promise}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-10 max-w-xl rounded-2xl border border-mist p-6 font-display text-[0.975rem] leading-relaxed text-indigo">
                “We don&apos;t teach children to depend on AI. We teach them to
                think, so they can lead it.”
              </p>
            </div>

            {/* Form is on the right on desktop and, crucially, ABOVE the
                supporting detail on mobile would be wrong — a parent needs to
                know what they are signing up for first. It sits second in the
                DOM and second on the page. */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <WebinarForm sessionId={session?.id ?? null} />
            </div>
          </div>
        </Container>

        {/* Objection handling, after the offer and the form rather than before
            them. A parent who is already convinced should never have to scroll
            past six questions to reach the thing they came to do; a parent who
            is hesitating gets the answers without leaving the page — which is
            the whole reason the link through to /faq is suppressed here. */}
        <div className="border-t border-mist">
          <FaqPreview showAllLink={false} includeSchema={false} />
        </div>
      </main>

      <footer className="border-t border-mist py-8">
        <Container size="wide" className="flex flex-col gap-3 text-xs text-slate sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.legalName}
          </p>
          <div className="flex flex-wrap gap-4">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-violet"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </Container>
      </footer>
    </>
  );
}
