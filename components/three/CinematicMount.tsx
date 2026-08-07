"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { detectDeviceTier, hasWebGL } from "./lib/deviceTier";
import {
  CHARACTER_MODEL_URL,
  MODEL_TIERS,
  MODEL_USES_DRACO,
} from "./lib/modelAssets";
import { usePageVisible } from "@/lib/hooks/usePageVisible";

/**
 * Mounts the hero cinematic behind the page content.
 *
 * The Canvas is dynamically imported with SSR disabled, which is both required
 * (three touches `window` at module scope) and desirable: the three.js chunk is
 * substantial and must not sit in front of the hero text.
 */
const CinematicScene = dynamic(
  () => import("./CinematicScene").then((m) => m.CinematicScene),
  { ssr: false, loading: () => null },
);

/**
 * Start the character download as soon as the page hydrates.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DELIBERATELY OUTSIDE THE IDLE GATE BELOW, and that is the entire point.
 * Nothing used to ask for boy.glb until the Canvas mounted, so an 841KB
 * download the hero cannot do without did not START until ~2.0s. The fetch was
 * queued behind a gate that exists to protect the MAIN THREAD, not the network.
 * Those are different resources and they need not contend: bytes can be in
 * flight while the CPU is busy painting text.
 *
 * `useGLTF.preload` RATHER THAN `<link rel="preload">`. The link tag has to
 * match GLTFLoader's request mode exactly or the browser fetches the file
 * twice and warns about an unused preload. This goes through the same loader
 * and the same cache `useGLTF` in BoyModel reads from, so the hit is
 * guaranteed by construction — provided MODEL_USES_DRACO is passed, which is
 * part of drei's cache key. See modelAssets.ts.
 *
 * TIER-GATED, and NOT optional. `MODEL_TIERS` excludes low-tier devices, which
 * render the procedural boy and never touch the GLB. An unconditional preload
 * therefore ships 841KB to exactly the phones the gate was written to protect,
 * which is worse than the problem being fixed.
 *
 * DYNAMIC IMPORT, so drei stays out of the eager bundle. A static import here
 * would pull three into the chunk the homepage loads before it paints — the
 * 234KB of parse work the idle gate below exists to defer. The chunk is on its
 * way regardless; this only stops it blocking the hero text.
 *
 * ONLY THE BOY. The rocket and the aeroplane are requested at the same late
 * moment he is, but they are 380KB and 879KB. Preloading all three makes them
 * share the pipe and the boy arrives LATER than he does today. He is on screen
 * first; the other two have until shot 2 and shot 4, with a procedural
 * stand-in until then.
 * ─────────────────────────────────────────────────────────────────────────────
 */
function usePreloadCharacter() {
  useEffect(() => {
    if (!MODEL_TIERS.includes(detectDeviceTier())) return;

    let cancelled = false;
    void import("@react-three/drei").then(({ useGLTF }) => {
      if (!cancelled) useGLTF.preload(CHARACTER_MODEL_URL, MODEL_USES_DRACO);
    });
    return () => {
      cancelled = true;
    };
  }, []);
}

/** WebGL availability never changes within a page life, so there is nothing to
 *  subscribe to — but `useSyncExternalStore` still gives us a clean, tear-free
 *  "client knows, server doesn't" read without a setState-in-effect. */
const noopSubscribe = () => () => {};
const noWebGLOnServer = () => false;

export function CinematicMount() {
  usePreloadCharacter();

  const webglAvailable = useSyncExternalStore(
    noopSubscribe,
    hasWebGL,
    noWebGLOnServer,
  );

  const [contextLost, setContextLost] = useState(false);
  const [inView, setInView] = useState(true);

  /**
   * A hidden tab does not scroll, so the IntersectionObserver below never fires
   * for it — the canvas is still exactly where it was. Without this the scene
   * renders forever behind whatever the visitor switched to.
   */
  const pageVisible = usePageVisible();

  /**
   * The 3D chunk is not requested until the browser is idle after load.
   *
   * DO NOT REMOVE THIS TO MAKE THE CINEMATIC START SOONER. It is the single
   * measure protecting the number that decides whether this feature ships.
   *
   * Measured, not assumed: with the previous scene mounting as soon as React
   * hydrated, Lighthouse put mobile LCP at 3.6s — and the LCP element is the
   * hero PARAGRAPH, plain text that has been in the HTML since the first byte.
   * It was late purely because ~234KB of three.js was parsing and evaluating on
   * the same main thread the browser needed to paint.
   *
   * The cinematic is decorative; the headline and the CTA are the content. So
   * the content gets the main thread first and the film waits its turn. Nobody
   * has scrolled far enough to see shot 2 in the first 300ms anyway.
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

  // Pause the frame loop once the cinematic zone scrolls away. Without this the
  // GPU keeps rendering the whole scene behind opaque sections for the entire
  // rest of the page — invisible, but still draining the battery.
  useEffect(() => {
    const zone = document.querySelector("[data-cinematic]");
    if (!zone) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "15% 0px" },
    );
    observer.observe(zone);
    return () => observer.disconnect();
  }, []);

  const showScene = webglAvailable && !contextLost && idle;

  // Drawing is stopped for BOTH reasons; the fade below tracks only the scroll
  // one, because a tab coming back into focus should not cost a fade-in.
  const drawing = inView && pageVisible;

  return (
    <div
      // Decorative. The story it tells is carried in words by the headline and
      // the sections below, so announcing it to a screen reader would only add
      // noise to a page a parent is trying to read.
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 transition-opacity duration-700 ${
        inView ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Always present. It is what shows if WebGL is refused, while the chunk
          loads, and behind the canvas at all times.

          NEEDS INPUT: this is still the generic brand wash. The plan calls for a
          real rendered still of shot 1 here, so that a visitor who never gets
          the canvas sees the boy holding the rocket rather than a gradient. It
          can only be rendered once the character model exists. */}
      <div className="absolute inset-0 bg-canvas-fallback" />

      {showScene && (
        <CinematicScene active={drawing} onContextLost={handleContextLost} />
      )}
    </div>
  );
}
