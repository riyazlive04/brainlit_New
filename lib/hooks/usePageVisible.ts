"use client";

import { useEffect, useState } from "react";

/**
 * Is this tab actually being looked at?
 *
 * The hero renders a WebGL scene continuously. An IntersectionObserver already
 * stops it once the canvas scrolls away, which covers the visitor who reads on
 * — but not the far more common case of a tab left open in the background for
 * an hour. `IntersectionObserver` does not fire for a hidden tab: as far as it
 * is concerned the canvas is still exactly where it was, so the scene keeps
 * drawing frames nobody can see.
 *
 * Browsers throttle `requestAnimationFrame` in background tabs, which softens
 * this but does not remove it, and the throttling is neither guaranteed nor
 * uniform. Stopping the loop outright is a promise; relying on the throttle is
 * a hope.
 *
 * Starts as `true` on the server and on the first client render, so nothing
 * flickers during hydration — a scene that mounted paused and then started
 * would be a worse bug than the one this fixes.
 */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const update = () => setVisible(!document.hidden);

    // Read once on mount: the tab can already be hidden by the time React gets
    // here, if the page was opened in a background tab.
    update();

    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return visible;
}
