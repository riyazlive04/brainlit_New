import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContactForm } from "@/components/forms/ContactForm";
import { SocialIcon } from "@/components/brand/SocialIcon";
import { SITE, SOCIAL_LINKS, whatsappHref } from "@/lib/site";
import { CONTACT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Questions about BrainLIT's AI thinking programs for children aged 10-14? Message us on WhatsApp or send an enquiry.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const whatsapp = whatsappHref();

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Ask us anything."
        lead="Especially the sceptical questions. Those are usually the ones worth answering."
        breadcrumbs={[{ label: "Contact" }]}
      />

      <section className="py-20 sm:py-28">
        <Container size="default">
          <div className="grid gap-12 lg:grid-cols-[1fr_minmax(360px,0.9fr)] lg:gap-16">
            <div>
              <h2 className="font-display text-[length:var(--text-h3)] text-ink">
                Quickest ways to reach us
              </h2>

              <dl className="mt-8 space-y-7">
                {whatsapp && (
                  <div>
                    <dt className="text-sm tracking-wide text-slate uppercase">
                      WhatsApp
                    </dt>
                    <dd className="mt-1">
                      <a
                        href={whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-display text-[1.0625rem] font-semibold text-violet hover:underline"
                      >
                        Message us directly
                      </a>
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm tracking-wide text-slate uppercase">
                    Email
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="font-display text-[1.0625rem] font-semibold text-violet hover:underline"
                    >
                      {CONTACT_EMAIL}
                    </a>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm tracking-wide text-slate uppercase">
                    Where we are
                  </dt>
                  <dd className="mt-1 text-[1.0125rem] text-ink">
                    {SITE.city}, India - teaching online across the country
                  </dd>
                </div>

                {/* Last, and deliberately so. This list is ordered by how fast
                    it gets a parent an answer, and a social profile is the
                    slowest thing on it — it is where they go to decide whether
                    to trust us, not where they go to ask a question. */}
                <div>
                  <dt className="text-sm tracking-wide text-slate uppercase">
                    Follow us
                  </dt>
                  {/* Icon AND label here, unlike the footer's icon-only row.
                      This is a contact list a parent is reading to decide how
                      to get hold of us, so every other row names itself in
                      words; a line of bare glyphs would be the one entry that
                      has to be decoded. */}
                  <dd className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                    {SOCIAL_LINKS.map((link) => (
                      <a
                        key={link.key}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-display text-[1.0625rem] font-semibold text-violet hover:underline"
                      >
                        <SocialIcon network={link.key} className="size-5" />
                        {link.label}
                      </a>
                    ))}
                  </dd>
                </div>
              </dl>

              <div className="mt-12 rounded-2xl border border-mist bg-mist/25 p-6">
                <h3 className="font-display font-semibold text-ink">
                  Thinking about enrolling?
                </h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-slate">
                  The free parent session answers most questions better than we
                  can over email - and there is nothing to sit through.
                </p>
                <a
                  href="/webinar"
                  className="mt-4 inline-block font-display text-[0.95rem] font-semibold text-violet hover:underline"
                >
                  See the next session →
                </a>
              </div>
            </div>

            <div>
              <h2 className="sr-only">Send an enquiry</h2>
              <ContactForm />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
