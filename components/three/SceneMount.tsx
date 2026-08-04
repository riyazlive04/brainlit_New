"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { hasWebGL } from "./lib/deviceTier";
import type { ScenePlacement } from "./Scene";

/**
 * Mounts the 3D scene behind the page content.
 *
 * The Canvas is dynamically imported with SSR disabled, which is both required
 * (three touches `window` at module scope) and desirable: the three.js chunk is
 * substantial and must not sit in front of the hero text. The headline, the CTA
 * and every word Google indexes are server-rendered and painted before this
 * module is even requested.
 */
const Scene = dynamic(() => import("./Scene").then((m) => m.Scene), {
  ssr: false,
  loading: () => null,
});

/** WebGL availability never changes within a page life, so there is nothing to
 *  subscribe to — but `useSyncExternalStore` still gives us a clean, tear-free
 *  "client knows, server doesn't" read without a setState-in-effect. */
const noopSubscribe = () => () => {};
const noWebGLOnServer = () => false;

export function SceneMount({
  pattern,
  offsetX,
  offsetY,
  scale,
}: ScenePlacement = {}) {
  const webglAvailable = useSyncExternalStore(
    noopSubscribe,
    hasWebGL,
    noWebGLOnServer,
  );

  const [contextLost, setContextLost] = useState(false);
  const [inView, setInView] = useState(true);

  /**
   * The 3D chunk is not requested until the browser is idle after load.
   *
   * Measured, not assumed: with the scene mounting as soon as React hydrated,
   * Lighthouse put mobile LCP at 3.6s — and the LCP element is the hero
   * PARAGRAPH, plain text that has been in the HTML since the first byte. It
   * was late purely because ~234KB of three.js was parsing and evaluating on
   * the same main thread the browser needed to paint.
   *
   * The scene is decorative; the headline and the CTA are the content. So the
   * content gets the main thread first and the decoration waits its turn. The
   * timeout is a backstop for browsers that never report idle.
   */
  const [idle, setIdle] = useState(false);

  const handleContextLost = useCallback(() => setContextLost(true), []);

  useEffect(() => {
    let cancelled = false;
    let idleHandle: number | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const begin = () => {
      if (!cancelled) setIdle(true);
    };

    const scheduleWhenIdle = () => {
      if (typeof window.requestIdleCallback === "function") {
        idleHandle = window.requestIdleCallback(begin, { timeout: 2500 });
      } else {
        // Safari before 16.4 has no requestIdleCallback.
        timeoutHandle = setTimeout(begin, 400);
      }
    };

    if (document.readyState === "complete") {
      scheduleWhenIdle();
    } else {
      window.addEventListener("load", scheduleWhenIdle, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", scheduleWhenIdle);
      if (idleHandle !== undefined && window.cancelIdleCallback) {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
    };
  }, []);

  // Pause the frame loop once the 3D zone scrolls away. Without this the GPU
  // keeps drawing tens of thousands of points behind opaque sections for the
  // entire rest of the page — invisible, but still draining the battery.
  useEffect(() => {
    const zone = document.querySelector("[data-three-zone]");
    if (!zone) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "15% 0px" },
    );
    observer.observe(zone);
    return () => observer.disconnect();
  }, []);

  const showScene = webglAvailable && !contextLost && idle;

  return (
    <div
      // Decorative. The mark's meaning is carried by the headline beside it, so
      // announcing it to a screen reader would only add noise.
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 transition-opacity duration-700 ${
        inView ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Always present: the static poster. It is what shows if WebGL is
          refused, while the chunk loads, and behind the canvas at all times. */}
      <div className="absolute inset-0 bg-canvas-fallback" />

      {showScene && (
        <Scene
          active={inView}
          onContextLost={handleContextLost}
          pattern={pattern}
          offsetX={offsetX}
          offsetY={offsetY}
          scale={scale}
        />
      )}
    </div>
  );
}
