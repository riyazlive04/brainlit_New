import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Prose, DraftNotice } from "@/components/ui/Prose";
import { SITE } from "@/lib/site";
import {
  CONTACT_EMAIL,
  EFFECTIVE_DATE,
  IS_DRAFT,
  JURISDICTION,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms on which BrainLIT provides its AI thinking programs for children.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms & Conditions"
        lead="The agreement between you and us. Written to be read, not to be survived."
        breadcrumbs={[{ label: "Terms & Conditions" }]}
      />

      <section className="py-16 sm:py-24">
        <Container size="narrow">
          {IS_DRAFT && <DraftNotice />}

          <p className="text-sm text-slate">Last updated: {EFFECTIVE_DATE}</p>

          <Prose className="mt-8">
            <h2>1. Who these terms are with</h2>
            <p>
              These terms govern your use of {SITE.url} and any program provided
              by {SITE.legalName} (&ldquo;{SITE.name}&rdquo;, &ldquo;we&rdquo;).
              By registering for a session or enrolling a child, you accept
              them.
            </p>

            <h2>2. Who can enrol</h2>
            <p>
              Our programs are for children aged {SITE.ageRange.min} to{" "}
              {SITE.ageRange.max}. Only a parent or legal guardian may register
              or enrol a child, and by doing so you confirm you are that parent
              or guardian and that you consent to us processing the limited
              information described in our{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </p>

            <h2>3. Registration and accuracy</h2>
            <p>
              Please give accurate contact details. We use them to send joining
              links and session changes, and we cannot deliver a program to a
              parent we cannot reach.
            </p>

            <h2>4. What we provide</h2>
            <ul>
              <li>Live online sessions delivered on the published schedule</li>
              <li>Materials and activities that support those sessions</li>
              <li>
                A learning experience aimed at developing thinking skills — not
                a guarantee of any particular academic or career outcome
              </li>
            </ul>
            <p>
              We may occasionally reschedule a session. If we do, we will tell
              you as early as we can and offer an alternative.
            </p>

            <h2>5. Expected conduct</h2>
            <p>
              Sessions involve children. We ask that participants are respectful
              to tutors and to each other. We may remove a participant whose
              behaviour disrupts a session or puts others at risk. Recording,
              copying or redistributing our sessions or materials is not
              permitted.
            </p>

            <h2>6. Session recordings and privacy of others</h2>
            <p>
              Where a session is recorded, we will say so beforehand. Do not
              record, photograph or share images of other people&apos;s children
              from a session under any circumstances.
            </p>

            <h2>7. Your child&apos;s work</h2>
            <p>
              Your child owns what they create. We will only publish their work
              or name with your specific written consent, which we record and
              which you may withdraw at any time.
            </p>

            <h2>8. Our materials</h2>
            <p>
              Our curriculum, materials, website content and branding belong to
              us. They are for your family&apos;s personal use in connection
              with a program, and not for redistribution or commercial use.
            </p>

            <h2>9. Fees, payment and refunds</h2>
            <p>
              Fees are shown before you enrol. Refunds and cancellations are
              covered by our <Link href="/refund">Refund Policy</Link>, which
              forms part of these terms.
            </p>

            <h2>10. Cancellation by us</h2>
            <p>
              If we cancel a program and cannot offer a suitable alternative, we
              will refund the fees paid for the part not delivered.
            </p>

            <h2>11. Limits on our liability</h2>
            <p>
              We provide our programs with reasonable care and skill. To the
              extent permitted by law, we are not liable for indirect or
              consequential loss, and our total liability in connection with a
              program is limited to the fees you paid for it. Nothing here
              limits liability that cannot lawfully be limited.
            </p>

            <h2>12. Technology on your side</h2>
            <p>
              Sessions need a working internet connection and a device with a
              camera and microphone. We cannot be responsible for sessions
              missed because of a problem with your own equipment or connection.
            </p>

            <h2>13. Changes to these terms</h2>
            <p>
              We may update these terms. Where a change materially affects a
              program you have already paid for, we will tell you directly.
            </p>

            <h2>14. Governing law</h2>
            <p>
              These terms are governed by the laws of {JURISDICTION.country},
              and the courts of {JURISDICTION.city}, {JURISDICTION.state} have
              exclusive jurisdiction.
            </p>

            <h2>15. Contact</h2>
            <p>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
          </Prose>
        </Container>
      </section>
    </>
  );
}
