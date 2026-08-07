/**
 * Shared animation state between the scroll layer and the WebGL frame loop.
 *
 * Deliberately a plain module singleton and not React state or context: these
 * values change on every frame, and routing them through React would trigger a
 * re-render per frame and destroy the frame budget. The scroll layer writes,
 * `useFrame` reads, React never sees it.
 */
export const scrollState = {
  /** 0..1 across the 3D zone of the page */
  progress: 0,
  /**
   * 0..1 across the hero cinematic zone.
   *
   * Separate from `progress` rather than replacing it: the two zones are
   * different elements with different heights, and `/lab/*` still drives the old
   * logo composition from `progress`. Both are written by the same effect and
   * only one of them is ever non-zero on a given route.
   *
   * This is the ONLY input to the cinematic. Everything the camera, the boy, the
   * rocket and the mark do is computed from this number — see the note in
   * components/three/lib/shots.ts for why nothing there may use a clock.
   */
  cinematic: 0,
  /** Cursor position, normalised to -1..1 from the viewport centre */
  pointerX: 0,
  pointerY: 0,

  /**
   * Click ripple. `seq` increments on every click; the render loop compares it
   * against the last value it saw and starts a new wave when it changes.
   *
   * A counter rather than a timestamp because the scene needs to know "is this
   * a click I have not handled yet", which a monotonically increasing integer
   * answers exactly, with no clock skew and no dropped repeat clicks at the
   * same position.
   */
  clickSeq: 0,
  clickNdcX: 0,
  clickNdcY: 0,
};
