"use client";

import { resetConsent } from "@/lib/consent";

/**
 * Footer link that reopens the consent choice.
 *
 * Withdrawing consent has to be as easy as giving it — that is explicit in the
 * DPDP Act, and our Privacy Policy promises "you can change your choice at any
 * time from the cookie banner". Without this link that sentence is false,
 * because the banner never returns once a choice is stored.
 */
export function CookieSettingsLink() {
  if (!process.env.NEXT_PUBLIC_GTM_ID) return null;

  return (
    <button
      type="button"
      onClick={resetConsent}
      className="text-sm text-slate transition-colors hover:text-violet"
    >
      Cookie settings
    </button>
  );
}
