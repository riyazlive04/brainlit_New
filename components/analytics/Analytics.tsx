"use client";

import { useEffect } from "react";
import { useConsent } from "@/lib/consent";

/**
 * Loads Google Tag Manager, and only ever after consent.
 *
 * GA4 and the Meta Pixel are configured INSIDE the GTM container, not here.
 * One container means one place to add or remove a vendor, and — the part that
 * matters legally — one gate that covers all of them. Calling vendor SDKs from
 * component code makes consistent consent enforcement impossible.
 *
 * Renders nothing.
 */
export function Analytics() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const consent = useConsent();

  useEffect(() => {
    if (!gtmId || consent !== "granted") return;
    // Guard against a double injection if consent changes twice in one session.
    if (document.getElementById("gtm-script")) return;

    // dataLayer must exist before GTM loads, so events queued earlier in the
    // page's life — a form submit on a fast connection — are not dropped.
    const w = window as Window & { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer ?? [];
    w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

    const script = document.createElement("script");
    script.id = "gtm-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
    document.head.appendChild(script);
  }, [gtmId, consent]);

  // Deliberately no <noscript><iframe> GTM fallback. It fires before any
  // consent decision can be read, which would track users who have not agreed
  // and directly contradict our Privacy Policy.
  return null;
}
