"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollState } from "@/lib/scrollState";

/**
 * Feeds native scroll position and pointer state to the 3D scene.
 * Renders nothing.
 *
 * THIS WAS SMOOTH SCROLLING VIA LENIS. That is gone, deliberately.
 *
 * Lenis works by preventing the default wheel event and animating the scroll
 * position itself. When anything upsets that — here, `overflow-x: hidden` on
 * <body> quietly making body the scroll container instead of the document —
 * the wheel event is still swallowed but nothing moves, and the page becomes
 * completely unscrollable. A catastrophic failure mode in exchange for eased
 * scrolling, on a site whose entire job is letting a parent read down a page.
 *
 * Scroll hijacking is also an accessibility problem in its own right: it
 * overrides the scroll speed someone set at the OS level and interacts badly
 * with assistive technology. And it cost ~15KB on the critical path.
 *
 * ScrollTrigger reads native scroll perfectly well, so the 3D beats are
 * unaffected. Native scrolling cannot break.
 */
export function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Two zones, at most one of which exists on any given route: the hero
    // cinematic on the homepage, and the older logo composition still used by
    // the /lab/* layout explorations.
    const zones: Array<[string, "progress" | "cinematic"]> = [
      ["[data-three-zone]", "progress"],
      ["[data-cinematic]", "cinematic"],
    ];

    const triggers = zones.flatMap(([selector, key]) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) return [];

      return [
        ScrollTrigger.create({
          trigger: element,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            scrollState[key] = self.progress;
          },
        }),
      ];
    });

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
      triggers.forEach((trigger) => trigger.kill());
    };
  }, []);

  return null;
}
