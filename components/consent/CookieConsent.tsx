"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useConsent, writeConsent } from "@/lib/consent";

/**
 * Cookie consent banner.
 *
 * Design decisions that are compliance requirements, not preferences:
 *
 * · "Decline" is styled as prominently as "Accept". A greyed-out reject button
 *   next to a bright accept button is a dark pattern, and consent obtained that
 *   way is not freely given.
 * · Nothing loads until a choice is made — see lib/consent.ts.
 * · The banner does not block the page. A modal that traps a parent until they
 *   agree is coercion, and it would also tank mobile conversion.
 *
 * Hidden entirely when no GTM container is configured: asking for consent to
 * run tags that do not exist would be theatre.
 */
export function CookieConsent() {
  const consent = useConsent();
  // Dismissal is separate from the stored choice, so the banner disappears
  // immediately on click without waiting for a storage round trip.
  const [dismissed, setDismissed] = useState(false);

  const configured = Boolean(process.env.NEXT_PUBLIC_GTM_ID);
  if (!configured || dismissed || consent !== null) return null;

  const decide = (choice: "granted" | "denied") => {
    writeConsent(choice);
    setDismissed(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      // Sits above the sticky mobile CTA so the two never overlap illegibly.
      className="fixed inset-x-0 bottom-0 z-50 border-t border-mist bg-white/97 backdrop-blur-md"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 pt-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h2
            id="cookie-consent-title"
            className="font-display text-[0.975rem] font-semibold text-ink"
          >
            Can we measure how this site is doing?
          </h2>
          <p className="mt-1.5 text-[0.9rem] leading-relaxed text-slate">
            We would like to use analytics cookies to understand which pages
            help parents and which do not. Nothing loads unless you agree, and
            we never use them to advertise to children. See our{" "}
            <Link href="/privacy" className="text-violet underline">
              privacy policy
            </Link>
            .
          </p>
        </div>

        <div className="flex shrink-0 gap-3">
          {/* Equal visual weight, deliberately. */}
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => decide("denied")}
            className="flex-1 lg:flex-none"
          >
            Decline
          </Button>
          <Button
            type="button"
            variant="solid"
            size="md"
            onClick={() => decide("granted")}
            className="flex-1 lg:flex-none"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
