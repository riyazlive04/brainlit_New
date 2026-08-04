"use client";

/**
 * Conversion tracking.
 *
 * Events are pushed to the GTM dataLayer rather than calling GA4 or the Meta
 * Pixel directly. One container, one place to add or remove a tag, and — the
 * part that matters legally — one place where cookie consent can gate every
 * vendor at once. Calling vendor SDKs from component code makes consent
 * impossible to enforce consistently.
 *
 * Safe to call before GTM loads: the dataLayer array is created if absent and
 * GTM replays whatever is already queued when it initialises.
 */

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] };

export function trackEvent(
  event: string,
  params: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;

  const w = window as DataLayerWindow;
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({ event, ...params });
}

export type UtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
};

/**
 * Reads UTM parameters from the current URL.
 *
 * These necessarily come from the browser — the landing URL only exists there.
 * The server re-validates and length-caps them, because anything sourced from a
 * query string is attacker-controlled and ends up in your reporting.
 */
export function readUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const pick = (key: keyof UtmParams) => params.get(key) ?? undefined;

  return {
    utm_source: pick("utm_source"),
    utm_medium: pick("utm_medium"),
    utm_campaign: pick("utm_campaign"),
    utm_content: pick("utm_content"),
  };
}
