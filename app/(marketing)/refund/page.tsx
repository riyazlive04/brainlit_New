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
  REFUND_TERMS,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "BrainLIT's refund and cancellation policy for paid programs. The free parent session requires no payment.",
  alternates: { canonical: "/refund" },
};

/**
 * Refund policy.
 *
 * The commercial terms here — the cooling-off window, the sessions-attended
 * limit, the processing time — are PLACEHOLDERS in lib/legal.ts. They were not
 * in the client's discovery documents, and a refund window is a business
 * commitment, not something to guess at. Confirm every number before launch.
 */
export default function RefundPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Refund Policy"
        lead="What happens if a program is not right for your child."
        breadcrumbs={[{ label: "Refund Policy" }]}
      />

      <section className="py-16 sm:py-24">
        <Container size="narrow">
          {IS_DRAFT && <DraftNotice />}

          <p className="text-sm text-slate">Last updated: {EFFECTIVE_DATE}</p>

          <Prose className="mt-8">
            <h2>The free parent session</h2>
            <p>
              The introductory session for parents is free. There is nothing to
              pay and nothing to refund. You can stop attending at any point
              with no obligation.
            </p>

            <h2>Paid programs</h2>

            <h3>If you change your mind early</h3>
            <p>
              You may cancel within{" "}
              <strong>{REFUND_TERMS.coolingOffDays} days</strong> of enrolling,
              provided your child has attended no more than{" "}
              <strong>{REFUND_TERMS.sessionsAttendedLimit} sessions</strong>,
              and receive a full refund of the fees paid.
            </p>

            <h3>After that</h3>
            <p>
              Once your child has attended more than{" "}
              {REFUND_TERMS.sessionsAttendedLimit} sessions, or the cooling-off
              period has passed, fees for sessions already delivered are
              non-refundable. Where a program is paid in instalments, you may
              cancel future instalments; you will not be charged for sessions
              that have not yet run.
            </p>

            <h3>If we cancel</h3>
            <p>
              If we cancel a program or cannot deliver it, and we cannot offer
              you a suitable alternative batch, we will refund the fees for the
              part not delivered in full.
            </p>

            <h3>Missed sessions</h3>
            <p>
              We cannot refund individual sessions your child misses. Tell us in
              advance where you can and we will do our best to help them catch
              up.
            </p>

            <h2>Exceptional circumstances</h2>
            <p>
              Illness, a family emergency, or something else that makes a
              program genuinely unworkable - talk to us. We would rather find a
              fair answer, such as deferring to a later batch, than hide behind
              a policy.
            </p>

            <h2>How to request a refund</h2>
            <p>
              Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from
              the address you enrolled with, telling us your child&apos;s name,
              the program, and why. Approved refunds are returned to the
              original payment method within{" "}
              <strong>{REFUND_TERMS.processingDays}</strong>.
            </p>

            <h2>Related</h2>
            <p>
              This policy forms part of our{" "}
              <Link href="/terms">Terms &amp; Conditions</Link>. How we handle
              your information is covered by our{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </p>

            <p>
              Questions about any of this? {SITE.name} would rather you asked
              before enrolling than after.
            </p>
          </Prose>
        </Container>
      </section>
    </>
  );
}
