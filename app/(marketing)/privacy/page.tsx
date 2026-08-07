import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Prose, DraftNotice } from "@/components/ui/Prose";
import { SITE } from "@/lib/site";
import {
  CONTACT_EMAIL,
  EFFECTIVE_DATE,
  GRIEVANCE,
  IS_DRAFT,
  JURISDICTION,
  PROCESSORS,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How BrainLIT collects, uses and protects personal data - including our approach to children's data under India's DPDP Act 2023.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        lead={`How we handle your information - and, more importantly, how little we hold about your child.`}
        breadcrumbs={[{ label: "Privacy Policy" }]}
      />

      <section className="py-16 sm:py-24">
        <Container size="narrow">
          {IS_DRAFT && <DraftNotice />}

          <p className="text-sm text-slate">
            Last updated: {EFFECTIVE_DATE}
          </p>

          <Prose className="mt-8">
            <h2>The short version</h2>
            <p>
              We collect the <strong>parent&apos;s</strong> details, not the
              child&apos;s. From your child we store, at most, a first name and
              an age - enough to have a useful conversation with you, and not
              enough to identify or contact a minor. We never sell data, and we
              do not run behavioural advertising aimed at children.
            </p>

            <h2>Who we are</h2>
            <p>
              {SITE.legalName} operates {SITE.url}. We are based in{" "}
              {JURISDICTION.city}, {JURISDICTION.state}, {JURISDICTION.country}.
              For anything in this policy, contact{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>

            <h2>What we collect, and why</h2>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Why</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Parent name, email, phone</td>
                  <td>
                    To confirm your registration, send joining details, and
                    answer your enquiry
                  </td>
                </tr>
                <tr>
                  <td>Child&apos;s first name and age (optional)</td>
                  <td>
                    To recommend the right program and to address your child
                    correctly in a session
                  </td>
                </tr>
                <tr>
                  <td>Your message, if you send one</td>
                  <td>To answer it</td>
                </tr>
                <tr>
                  <td>
                    Campaign parameters from the link you arrived on (utm_*)
                  </td>
                  <td>
                    To understand which of our efforts actually reach parents
                  </td>
                </tr>
                <tr>
                  <td>IP address and request logs</td>
                  <td>
                    Security, abuse prevention and rate limiting. Retained
                    briefly.
                  </td>
                </tr>
                <tr>
                  <td>Analytics data</td>
                  <td>
                    Only if you consent. See <em>Cookies</em> below.
                  </td>
                </tr>
              </tbody>
            </table>

            <h2>Children&apos;s data</h2>
            <p>
              India&apos;s <strong>Digital Personal Data Protection Act 2023</strong>{" "}
              treats anyone under 18 as a child and requires verifiable parental
              consent before processing their personal data. It also prohibits
              tracking and behavioural advertising directed at children.
            </p>
            <p>Our approach is to collect as little as possible:</p>
            <ul>
              <li>
                The parent or guardian is our point of contact for everything.
                We do not ask a child for an email address or phone number.
              </li>
              <li>
                We store a child&apos;s first name and age only, and only if
                you choose to provide them.
              </li>
              <li>
                We do not run advertising targeted at children, and we do not
                build advertising profiles of them.
              </li>
              <li>
                We publish a child&apos;s work or name only where a parent has
                given specific written consent, which we record. That consent
                can be withdrawn at any time and we will remove the material.
              </li>
            </ul>

            <h2>Who else sees your data</h2>
            <p>
              We use the following service providers. We do not sell your data
              to anyone, and we do not share it for anyone else&apos;s
              marketing.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Purpose</th>
                  <th>What they receive</th>
                </tr>
              </thead>
              <tbody>
                {PROCESSORS.map((processor) => (
                  <tr key={processor.name}>
                    <td>{processor.name}</td>
                    <td>{processor.purpose}</td>
                    <td>{processor.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              Some of these providers operate servers outside India, so your
              data may be processed abroad under their own safeguards.
            </p>

            <h2>Cookies and analytics</h2>
            <p>
              Analytics and advertising tools load{" "}
              <strong>only after you consent</strong>. Decline, and they are
              never loaded - not merely ignored. Cookies strictly necessary to
              make the site work are always active.
            </p>
            <p>You can change your choice at any time from the cookie banner.</p>

            <h2>How long we keep things</h2>
            <ul>
              <li>
                <strong>Enquiries and registrations</strong> - while we are in
                contact with you and for a reasonable period after, so we can
                answer follow-up questions
              </li>
              <li>
                <strong>Student records</strong> - for the duration of the
                program and as long as required for certificates and support
              </li>
              <li>
                <strong>Server logs</strong> - a short period, for security
              </li>
            </ul>
            <p>
              Ask us to delete your data and we will, except where we are
              legally required to retain it.
            </p>

            <h2>Your rights</h2>
            <p>Under the DPDP Act 2023 you may:</p>
            <ul>
              <li>Ask what personal data we hold about you and your child</li>
              <li>Ask us to correct anything inaccurate or incomplete</li>
              <li>Ask us to erase it</li>
              <li>Withdraw consent you previously gave, at any time</li>
              <li>Nominate someone to exercise these rights on your behalf</li>
              <li>Raise a grievance, and escalate to the Data Protection Board of India if we do not resolve it</li>
            </ul>
            <p>
              To exercise any of these, email{" "}
              <a href={`mailto:${GRIEVANCE.email}`}>{GRIEVANCE.email}</a>.
            </p>

            <h2>Grievance Officer</h2>
            <p>
              {GRIEVANCE.name}, {GRIEVANCE.role}
              <br />
              <a href={`mailto:${GRIEVANCE.email}`}>{GRIEVANCE.email}</a>
            </p>

            <h2>Security</h2>
            <p>
              The site is served over HTTPS. Data is stored in an access-
              controlled database with row level security, and the keys that can
              read personal data are held server-side only and never sent to
              your browser. No system is perfectly secure, but we do not treat
              that as an excuse.
            </p>

            <h2>Changes</h2>
            <p>
              If we change this policy we will update the date at the top, and
              tell you directly where the change is significant.
            </p>

            <h2>Contact</h2>
            <p>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> - or see
              our <Link href="/contact">contact page</Link>.
            </p>
          </Prose>
        </Container>
      </section>
    </>
  );
}
