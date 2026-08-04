"use client";

/**
 * Cookie consent.
 *
 * The Privacy Policy states that analytics and advertising tools load "only
 * after you consent — decline, and they are never loaded, not merely ignored."
 * This module is what makes that literally true: nothing is injected until a
 * choice is stored and that choice is "granted".
 *
 * The commoner pattern — load Google Tag Manager immediately with Consent Mode
 * defaults set to denied — is easier and is what most sites do. It is not what
 * our policy says, and under the DPDP Act a policy that misdescribes the actual
 * behaviour is the problem, not the behaviour. So: no script until consent.
 */

import { useSyncExternalStore } from "react";

export type ConsentChoice = "granted" | "denied";

const STORAGE_KEY = "brainlit.consent";

/**
 * Bumping this invalidates every stored choice and re-asks.
 * Do that when the set of vendors materially changes — consent given for one
 * set of processors is not consent for a different set.
 */
const CONSENT_VERSION = 1;

type StoredConsent = { version: number; choice: ConsentChoice; at: string };

/** Fired when the choice changes, so listeners can react without a reload. */
export const CONSENT_EVENT = "brainlit:consent";

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.version !== CONSENT_VERSION) return null;
    if (parsed.choice !== "granted" && parsed.choice !== "denied") return null;

    return parsed.choice;
  } catch {
    // Private browsing, disabled storage, or corrupted JSON. Treat as "not
    // asked" — failing closed means no tracking, which is the safe direction.
    return null;
  }
}

/**
 * Cached snapshot.
 *
 * `useSyncExternalStore` calls getSnapshot on every render and requires a
 * stable result. Re-reading and re-parsing localStorage each time would be
 * wasteful and, worse, a fresh parse per render is exactly the kind of thing
 * that makes the store look like it changed when it did not.
 */
let cachedConsent: ConsentChoice | null | undefined;

function getSnapshot(): ConsentChoice | null {
  if (cachedConsent === undefined) cachedConsent = readConsent();
  return cachedConsent;
}

/** The server cannot know the choice; assume not-yet-asked. */
function getServerSnapshot(): ConsentChoice | null {
  return null;
}

function subscribe(onChange: () => void) {
  const handler = () => {
    cachedConsent = undefined;
    onChange();
  };

  window.addEventListener(CONSENT_EVENT, handler);
  // Accepting in one tab should dismiss the banner in the others. `storage`
  // fires only in OTHER tabs, which is exactly the gap the custom event leaves.
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(CONSENT_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/** Current choice, or null if the visitor has not been asked yet. */
export function useConsent(): ConsentChoice | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function writeConsent(choice: ConsentChoice) {
  if (typeof window === "undefined") return;

  try {
    const payload: StoredConsent = {
      version: CONSENT_VERSION,
      choice,
      at: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // If we cannot persist the choice we still honour it for this session.
  }

  cachedConsent = choice;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
}

/**
 * Clears the stored choice so the banner reappears.
 *
 * Withdrawing consent must be as easy as giving it — that is an explicit DPDP
 * requirement, and it is why there is a "Cookie settings" link in the footer.
 *
 * Note the honest limitation: scripts already loaded in this page's lifetime
 * cannot be unloaded, so we reload. Anything less would leave a tag running on
 * a page where the user just said no.
 */
export function resetConsent() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing useful to do.
  }

  window.location.reload();
}
