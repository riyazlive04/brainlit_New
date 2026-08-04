"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollState } from "@/lib/scrollState";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/**
 * Smooth scrolling, plus the single ScrollTrigger that drives the 3D scene.
 *
 * Lenis and ScrollTrigger both want to own the scroll position, so they are
 * explicitly married: Lenis is driven by GSAP's ticker (not its own rAF loop)
 * and reports every scroll to ScrollTrigger. Running two independent rAF loops
 * is the classic cause of jittery scroll-linked animation.
 *
 * Renders nothing — it exists for its effects.
 */
export function SmoothScroll() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Momentum scrolling is exactly the kind of motion that triggers vestibular
    // discomfort, so honour the preference by handing scrolling back to the
    // browser. Scroll progress still tracks, so the scene still responds.
    const lenis = reducedMotion
      ? null
      : new Lenis({
          duration: 1.05,
          // Touch devices already have native momentum; layering Lenis on top
          // feels laggy and fights the OS.
          syncTouch: false,
        });

    let tick: ((time: number) => void) | null = null;

    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);

      tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      // GSAP's lag smoothing pauses the ticker after a long frame, which makes
      // Lenis jump on scroll-heavy pages.
      gsap.ticker.lagSmoothing(0);
    }

    const zone = document.querySelector<HTMLElement>("[data-three-zone]");
    const trigger = zone
      ? ScrollTrigger.create({
          trigger: zone,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            scrollState.progress = self.progress;
          },
        })
      : null;

    const onPointerMove = (e: PointerEvent) => {
      scrollState.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      scrollState.pointerY = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // Listened for on the window rather than the canvas, because the canvas is
    // pointer-events-none — it must never intercept a click meant for a button
    // or a link. A ripple firing when someone taps the CTA is fine; a CTA that
    // does not submit because a decorative canvas swallowed the tap is not.
    const onPointerDown = (e: PointerEvent) => {
      scrollState.clickNdcX = (e.clientX / window.innerWidth) * 2 - 1;
      scrollState.clickNdcY = -((e.clientY / window.innerHeight) * 2 - 1);
      scrollState.clickSeq += 1;
    };
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      trigger?.kill();

      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
    };
  }, [reducedMotion]);

  return null;
}
