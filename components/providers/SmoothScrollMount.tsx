"use client";

import dynamic from "next/dynamic";

/**
 * Defers GSAP + Lenis off the critical path.
 *
 * `SmoothScroll` renders nothing — it only installs scroll behaviour and the
 * ScrollTrigger that feeds the 3D scene. Both of those are worthless until the
 * user actually scrolls, and the scene they drive is itself lazily loaded, so
 * there is no reason for ~50KB of animation library to sit in front of the
 * hero on a 4G connection.
 *
 * Until it loads, scrolling is simply native. Nothing is broken, just less
 * smooth for the first moment.
 */
const SmoothScroll = dynamic(
  () => import("./SmoothScroll").then((m) => m.SmoothScroll),
  { ssr: false },
);

export function SmoothScrollMount() {
  return <SmoothScroll />;
}
