"use client";

import { Component, type ReactNode } from "react";

/**
 * Falls back to `children`'s alternative when a model fails to load.
 *
 * A class, because catching a render error is the one thing hooks still cannot
 * do. It exists for a specific and entirely expected failure: `public/boy.glb`
 * is not committed, so on any checkout without it — and on any visitor whose
 * download of it fails — `useGLTF` throws. That must cost the visitor nothing.
 *
 * Deliberately catches EVERYTHING rather than sniffing for a 404. A model that
 * arrives corrupt, or that trips a three.js parser bug, is exactly as fatal to
 * the hero as one that never arrives, and both have the same right answer.
 */
type Props = {
  children: ReactNode;
  fallback: ReactNode;
  /** Dev-only, so a real problem with a real file is not swallowed silently. */
  label?: string;
};

type State = { failed: boolean };

export class ModelBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[${this.props.label ?? "ModelBoundary"}] Falling back - the model did not load.`,
        error,
      );
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default ModelBoundary;
