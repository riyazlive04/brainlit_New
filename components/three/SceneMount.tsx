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

  const handleContextLost = useCallback(() => setContextLost(true), []);

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

  const showScene = webglAvailable && !contextLost;

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
