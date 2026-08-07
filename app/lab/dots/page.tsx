"use client";

import { useState } from "react";
import { SceneMount } from "@/components/three/SceneMount";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";
import type { FieldPattern } from "@/components/three/lib/logoSampler";

/**
 * Background pattern comparison.
 *
 * Switching remounts the scene and re-samples the cloud, so each pattern is the
 * real thing rather than a mockup. Scroll to see the logo form over each, and
 * click anywhere to fire the ripple — the ripple is the main reason the pattern
 * choice matters, because it deforms the lattice and each one deforms
 * differently.
 */

const PATTERNS: Array<{
  key: FieldPattern;
  label: string;
  blurb: string;
  detail: string;
}> = [
  {
    key: "grid",
    label: "Square grid",
    blurb: "Even rows and columns, 18px apart.",
    detail:
      "Calmest and most neutral. Reads as graph paper or a printed dot screen. The continuous horizontal and vertical lines are what some people find mechanical.",
  },
  {
    key: "stagger",
    label: "Staggered",
    blurb:
      "In use on the site. Alternate rows offset by half a cell - a triangular lattice.",
    detail:
      "Softer than a square grid because no unbroken horizontal or vertical line runs across the screen. Same regularity, less rigidity. This is how halftone printing actually lays out its dots.",
  },
  {
    key: "rings",
    label: "Concentric rings",
    blurb: "Circles radiating from the centre, evenly spaced.",
    detail:
      "The most distinctive and the most opinionated. Echoes the ripple, so a click feels like it belongs to the pattern rather than fighting it. Draws attention to the centre, which competes with the logo sitting there.",
  },
];

export default function DotPatternLab() {
  const [pattern, setPattern] = useState<FieldPattern>("stagger");
  const active = PATTERNS.find((p) => p.key === pattern)!;

  return (
    <div data-three-zone className="relative">
      {/* key forces a full remount so the cloud is rebuilt on every switch */}
      <SceneMount key={pattern} pattern={pattern} />

      <section className="relative z-10 flex min-h-[100svh] items-center">
        <Container size="default" className="py-24">
          <div className="max-w-xl rounded-3xl bg-white/85 p-8 backdrop-blur-md">
            <h1 className="text-[length:var(--text-h2)] text-ink">
              Background dot patterns
            </h1>
            <p className="mt-4 text-[0.975rem] leading-relaxed text-slate">
              Pick one. Then scroll - the logo forms over it - and click
              anywhere to fire the ripple.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {PATTERNS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPattern(p.key)}
                  aria-pressed={pattern === p.key}
                  className={cn(
                    "rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
                    pattern === p.key
                      ? "bg-brand-gradient text-white"
                      : "border border-mist bg-white text-slate hover:border-violet/40 hover:text-ink",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="mt-7 border-t border-mist pt-6">
              <h2 className="font-display text-[length:var(--text-h3)] text-ink">
                {active.label}
              </h2>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-violet">
                {active.blurb}
              </p>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-slate">
                {active.detail}
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Two more screens of scroll so the logo has room to form and ignite
          over the chosen pattern. */}
      <section className="relative z-10 flex min-h-[90svh] items-center">
        <Container size="narrow" className="text-center">
          <p className="text-[length:var(--text-lead)] leading-relaxed text-slate">
            Keep scrolling. The mark assembles here - watch how much the pattern
            behind it helps or distracts.
          </p>
        </Container>
      </section>

      <section className="relative z-10 flex min-h-[90svh] items-center">
        <Container size="narrow" className="text-center">
          <p className="font-display text-[length:var(--text-h2)] font-semibold text-ink">
            Click anywhere.
          </p>
          <p className="mt-4 text-[length:var(--text-lead)] leading-relaxed text-slate">
            The ripple deforms whichever lattice you picked. Rings answer it
            best; the square grid resists it most.
          </p>
        </Container>
      </section>
    </div>
  );
}
