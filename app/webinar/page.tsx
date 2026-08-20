import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/brand/Wordmark";
import { BackLink } from "@/components/ui/BackLink";
import { WebinarForm } from "@/components/forms/WebinarForm";
import { FaqPreview } from "@/components/sections/FaqPreview";
import { HeroTestimonial } from "@/components/webinar/HeroTestimonial";
import { MethodFlow } from "@/components/webinar/MethodFlow";
import {
  WEBINAR_HERO,
  WEBINAR_CORE,
  WEBINAR_WHY_NOW,
  WEBINAR_LITERACY,
  WEBINAR_METHOD,
  WEBINAR_EXAMPLE,
  WEBINAR_TAKEAWAYS,
  WEBINAR_COVER,
  WEBINAR_FAQS,
  WEBINAR_FINAL_CTA,
} from "@/content/webinar";
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
 * ─────────────────────────────────────────────────────────────────────────────
 * THE ORDER IS THE ARGUMENT.
 *
 * Proof, then the claim, then why it matters, then what the words mean, then
 * how we do it, then it made concrete, then what the parent leaves with, then
 * objections, then the ask. Each section answers the question the one above it
 * raises. Moving one is not a layout change — it breaks the sequence.
 *
 * Every word lives in content/webinar.ts. Nothing below is copy.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Revalidates hourly so a newly scheduled session appears without a deploy,
 * while still serving from cache for the ad traffic that hits it hardest.
 */
export const revalidate = 3600;

export default async function WebinarPage() {
  const session = await getNextWebinarSession();

  const eventSchema = session
    ? {
        "@context": "https://schema.org",
        "@type": "Event",
        name: session.title,
        startDate: session.starts_at,
        eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
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
        {/* ── 1. REAL PARENT PROOF, then the promise ──────────────────────
            The testimonial leads because it is the only thing on this page a
            parent has no reason to discount. Everything below it is BrainLIT
            describing BrainLIT; this is somebody else describing what changed.

            It sits in the SAME grid row as the form rather than above the
            header, so on desktop nothing is displaced. On mobile the order
            becomes video, then headline, then form — a parent meets the proof,
            learns what is on offer, and is then asked for their details, which
            is the order that earns the ask. */}
        <Container size="wide" className="py-14 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_minmax(360px,0.95fr)] lg:gap-16">
            <div>
              <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
                {WEBINAR_HERO.eyebrow}
              </p>

              <div className="mt-6">
                <HeroTestimonial />
              </div>

              <h1 className="mt-10 text-[length:var(--text-h1)] text-ink">
                {WEBINAR_CORE.headline.before}
                <span className="text-brand-gradient">
                  {WEBINAR_CORE.headline.accent}
                </span>
                {WEBINAR_CORE.headline.after}
              </h1>

              <p className="mt-6 max-w-xl text-[length:var(--text-lead)] leading-relaxed text-slate">
                A free session for parents of {SITE.ageRange.min}-
                {SITE.ageRange.max} year olds. No pitch to sit through - bring
                the questions you have actually been worrying about.
              </p>

              {/* ── 2. THE CORE MESSAGE, unpacked in parent language ──── */}
              <div className="mt-8 max-w-xl space-y-4">
                {WEBINAR_CORE.body.map((line) => (
                  <p
                    key={line}
                    className="text-[0.975rem] leading-relaxed text-slate"
                  >
                    {line}
                  </p>
                ))}
              </div>

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

              {/* On mobile the form is a long way down by now. Hidden on
                  desktop, where it is already in view and a button pointing at
                  it would be noise. */}
              <a
                href="#register"
                className="mt-8 inline-flex rounded-full bg-brand-gradient px-7 py-3.5 font-display text-sm font-semibold text-white lg:hidden"
              >
                {WEBINAR_HERO.cta}
              </a>
            </div>

            {/* The form keeps its place: second in the DOM, sticky on desktop.
                A parent needs to know what they are signing up for first. */}
            <div id="register" className="lg:sticky lg:top-8 lg:self-start">
              <WebinarForm sessionId={session?.id ?? null} />
            </div>
          </div>
        </Container>

        {/* ── 3. WHY IT MATTERS NOW ───────────────────────────────────────
            Urgency from the change in how children learn, not from fear. There
            is deliberately nothing here about jobs disappearing or children
            being left behind. */}
        <section className="border-t border-mist bg-mist/20">
          <Container size="wide" className="py-16 sm:py-20">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-display text-[length:var(--text-h2)] leading-tight text-ink">
                {WEBINAR_WHY_NOW.heading}
              </h2>
              <div className="mt-6 space-y-4">
                {WEBINAR_WHY_NOW.body.map((line) => (
                  <p
                    key={line}
                    className="text-[length:var(--text-lead)] leading-relaxed text-slate"
                  >
                    {line}
                  </p>
                ))}
              </div>

              <ul className="mt-8 space-y-3">
                {WEBINAR_WHY_NOW.questions.map((q) => (
                  <li
                    key={q}
                    className="rounded-2xl bg-paper px-5 py-4 text-[0.975rem] leading-relaxed text-ink ring-1 ring-mist"
                  >
                    {q}
                  </li>
                ))}
              </ul>

              <p className="mt-8 font-display text-[1.05rem] font-medium text-ink">
                {WEBINAR_WHY_NOW.close}
              </p>
            </div>
          </Container>
        </section>

        {/* ── 4. WHAT AI LITERACY MEANS ─────────────────────────────────── */}
        <section className="border-t border-mist">
          <Container size="wide" className="py-16 sm:py-20">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-display text-[length:var(--text-h2)] leading-tight text-ink">
                {WEBINAR_LITERACY.heading}
              </h2>
              <p className="mt-5 text-[length:var(--text-lead)] leading-relaxed text-slate">
                {WEBINAR_LITERACY.lead}
              </p>
              <p className="mt-2 text-[length:var(--text-lead)] leading-relaxed text-ink">
                {WEBINAR_LITERACY.subLead}
              </p>

              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {WEBINAR_LITERACY.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-3 rounded-2xl bg-mist/30 px-5 py-4"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 size-2 shrink-0 rounded-full bg-brand-gradient"
                    />
                    <span className="text-[0.975rem] leading-relaxed text-ink">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>

        {/* ── 5. WHAT MAKES BRAINLIT DIFFERENT ──────────────────────────── */}
        <section className="border-t border-mist">
          <Container size="wide" className="py-16 sm:py-20">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-display text-[length:var(--text-h2)] leading-tight text-ink">
                {WEBINAR_METHOD.heading}
              </h2>
              <p className="mt-5 text-[length:var(--text-lead)] leading-relaxed text-slate">
                {WEBINAR_METHOD.lead}
              </p>

              <div className="mt-8 rounded-3xl bg-brand-gradient p-6 sm:p-8">
                <MethodFlow steps={WEBINAR_METHOD.steps} tone="accent" />
              </div>

              <div className="mt-8 space-y-4">
                {WEBINAR_METHOD.body.map((line) => (
                  <p
                    key={line}
                    className="text-[0.975rem] leading-relaxed text-slate"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* ── 6. ONE REAL EXAMPLE ─────────────────────────────────────────
            The same seven beats as above, made concrete — not a second
            diagram. See the note in MethodFlow. */}
        <section className="border-t border-mist bg-mist/20">
          <Container size="wide" className="py-16 sm:py-20">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-display text-[length:var(--text-h2)] leading-tight text-ink">
                {WEBINAR_EXAMPLE.heading}
              </h2>
              <p className="mt-5 text-[0.975rem] text-slate">
                {WEBINAR_EXAMPLE.prompt}
              </p>
              <p className="mt-3 rounded-2xl bg-paper px-6 py-5 font-display text-[1.15rem] leading-snug font-medium text-ink ring-1 ring-mist">
                {WEBINAR_EXAMPLE.question}
              </p>

              <p className="mt-7 text-[0.975rem] leading-relaxed text-slate">
                {WEBINAR_EXAMPLE.contrast}
              </p>
              <div className="mt-5">
                <MethodFlow steps={WEBINAR_EXAMPLE.walkthrough} />
              </div>

              <p className="mt-8 font-display text-[1.05rem] font-medium text-ink">
                {WEBINAR_EXAMPLE.close}
              </p>
            </div>
          </Container>
        </section>

        {/* ── 7. TAKEAWAYS ────────────────────────────────────────────────
            What the PARENT leaves with. Distinct from "what we will cover",
            which is the agenda — this is the outcome. */}
        <section className="border-t border-mist">
          <Container size="wide" className="py-16 sm:py-20">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-display text-[length:var(--text-h2)] leading-tight text-ink">
                {WEBINAR_TAKEAWAYS.heading}
              </h2>
              <ol className="mt-8 space-y-4">
                {WEBINAR_TAKEAWAYS.items.map((item, i) => (
                  <li key={item} className="flex gap-4">
                    <span
                      aria-hidden="true"
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-mist/60 font-display text-sm font-semibold text-indigo"
                    >
                      {i + 1}
                    </span>
                    <span className="pt-1 text-[0.975rem] leading-relaxed text-ink">
                      {item}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-8 text-[0.975rem] leading-relaxed text-slate">
                {WEBINAR_TAKEAWAYS.close}
              </p>
            </div>
          </Container>
        </section>

        {/* ── 8. WHAT WE WILL COVER ─────────────────────────────────────── */}
        <section className="border-t border-mist bg-mist/20">
          <Container size="wide" className="py-16 sm:py-20">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-display text-[length:var(--text-h2)] leading-tight text-ink">
                {WEBINAR_COVER.heading}
              </h2>
              <ul className="mt-7 space-y-3.5">
                {WEBINAR_COVER.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-gradient"
                    />
                    <span className="text-[0.975rem] leading-relaxed text-slate">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-10 max-w-xl rounded-2xl border border-mist bg-paper p-6 font-display text-[0.975rem] leading-relaxed text-indigo">
                “We don&apos;t teach children to depend on AI. We teach them to
                think, so they can lead it.”
              </p>
            </div>
          </Container>
        </section>

        {/* ── 9. FAQ ──────────────────────────────────────────────────────
            This page's OWN questions — see the note in content/webinar.ts on
            why it no longer borrows the homepage set. */}
        <div className="border-t border-mist">
          <FaqPreview
            faqs={WEBINAR_FAQS}
            showAllLink={false}
            includeSchema={false}
          />
        </div>

        {/* ── 10. FINAL CTA ───────────────────────────────────────────────
            The one place repeating the headline earns its keep: a parent who
            has read this far gets the opening claim back, now with an answer
            attached. */}
        <section className="border-t border-mist bg-ink">
          <Container size="wide" className="py-16 text-center sm:py-20">
            <div className="mx-auto max-w-2xl">
              <h2 className="font-display text-[length:var(--text-h2)] leading-tight font-semibold text-white">
                {WEBINAR_FINAL_CTA.heading}
              </h2>
              <p className="mt-5 text-[length:var(--text-lead)] leading-relaxed text-white/70">
                {WEBINAR_FINAL_CTA.body}
              </p>
              <a
                href="#register"
                className="mt-8 inline-flex rounded-full bg-white px-8 py-4 font-display text-sm font-semibold text-ink transition-colors hover:bg-white/90"
              >
                {WEBINAR_FINAL_CTA.cta}
              </a>
            </div>
          </Container>
        </section>
      </main>

      <footer className="border-t border-mist py-8">
        <Container
          size="wide"
          className="flex flex-col gap-3 text-xs text-slate sm:flex-row sm:items-center sm:justify-between"
        >
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
