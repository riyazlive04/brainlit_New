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
