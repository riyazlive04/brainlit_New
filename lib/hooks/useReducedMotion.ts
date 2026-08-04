"use client";

import { useSyncExternalStore } from "react";

/**
 * Tracks `prefers-reduced-motion`.
 *
 * Implemented with `useSyncExternalStore` rather than useState + useEffect.
 * matchMedia is an external store, and this is what the API is for: no
 * setState-inside-an-effect, no cascading render on mount, and a declared
 * server snapshot so hydration cannot tear.
 *
 * This is a WCAG 2.1 (2.3.3) obligation and a vestibular-safety issue, not a
 * styling preference. When true, the 3D scene holds itself near-static.
 */

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

/** The server cannot know the preference; assume motion is allowed and correct
 *  on the first client render, before anything has had time to animate. */
function getServerSnapshot() {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
