"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger, in ms, for items revealed as a group */
  delay?: number;
  as?: "div" | "section" | "li" | "article";
};

/**
 * Fades and lifts content into view once, as it enters the viewport.
 *
 * Deliberately plain CSS transitions driven by an IntersectionObserver rather
 * than GSAP: GSAP is deferred off the critical path and only loaded for the 3D
 * scroll pipeline, and pulling it forward to fade a heading would undo that.
 *
 * The content is always present in the DOM and always visible to a crawler —
 * only opacity and transform change. Nothing here can hide text from Google or
 * from a screen reader.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: RevealProps) {
  // One component renders as div, li, section or article. Left as a union,
  // TypeScript intersects the four elements' prop types and collapses every
  // shared prop to `never`. Casting to a single permissive signature is the
  // pragmatic fix; a properly generic polymorphic component is far more
  // machinery than a fade-in warrants. At runtime this is just a tag name.
  const Tag = as as unknown as React.FC<
    React.HTMLAttributes<HTMLElement> & {
      ref?: React.Ref<HTMLElement>;
      children?: React.ReactNode;
    }
  >;
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          // Reveal is a one-way trip. Re-hiding content on scroll-up is
          // disorienting and makes long pages feel unstable.
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const visible = shown || reducedMotion;

  return (
    <Tag
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-700 [transition-timing-function:var(--ease-out-expo)] motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className,
      )}
      style={visible && delay ? undefined : { transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
