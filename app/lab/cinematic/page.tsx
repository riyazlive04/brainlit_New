"use client";

import { useEffect, useState } from "react";
import { CinematicMount } from "@/components/three/CinematicMount";
import { scrollState } from "@/lib/scrollState";
import { SHOTS, type ShotName } from "@/components/three/lib/shots";
import { cn } from "@/lib/cn";

/**
 * Shot scrubber for the hero cinematic.
 *
 * The sequence is normally driven by scrolling three and a half screens, which
 * makes it miserable to tune: to look at one frame of the burn twice you have to
 * find the same scroll position twice. This drives `scrollState.cinematic`
 * directly instead, so any frame is one drag or one click away.
 *
 * It is the real scene, not a mockup — the same components the homepage mounts,
 * reading the same value from the same module. If it looks right here it looks
 * right there.
 *
 * The page deliberately does not scroll. `SmoothScroll` puts a ScrollTrigger on
 * every `[data-cinematic]` element it finds, and that trigger would overwrite
 * whatever the slider had just set on the next wheel event. No scroll, no
 * conflict.
 *
 * `?p=0.64` sets the starting frame from the URL, which is what makes automated
 * screenshots of individual shots possible.
 */

const SHOT_LABELS: Record<ShotName, string> = {
  boy: "1 · The boy",
  throw: "2 · The throw",
  eyes: "3 · His eyes",
  burn: "4 · The burn",
  // The internal key is still `mark` from when this shot assembled the logo.
  // That beat was removed; renaming the key would touch the shot ranges, the
  // camera rig and every `shotProgress` call for no behavioural gain.
  mark: "5 · The fly-past",
};

export default function CinematicLab() {
  const [p, setP] = useState(0);

  // Read the opening frame from the URL once. `useState(() => ...)` would run
  // during render on the server too, where there is no location.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("p");
    if (fromUrl === null) return;

    const parsed = Number.parseFloat(fromUrl);
    if (Number.isFinite(parsed)) setP(Math.min(1, Math.max(0, parsed)));
  }, []);

  // The scene reads a plain module singleton, never React state — see the note
  // in lib/scrollState.ts. This is the one place the two are bridged, and it is
  // safe precisely because it happens on a user gesture rather than per frame.
  useEffect(() => {
    scrollState.cinematic = p;
  }, [p]);

  const current = (Object.keys(SHOTS) as ShotName[]).find(
    (name) => p >= SHOTS[name].start && p <= SHOTS[name].end,
  );

  return (
    <div data-cinematic className="relative h-[calc(100svh-3rem)] overflow-hidden">
      <CinematicMount />

      {/* Bottom LEFT, and no wider than it needs to be. Centred at the bottom it
          sat exactly where the boy stands and where the mark assembles, and
          "the shot is empty" turned out to mean "the shot is behind the panel"
          more than once. */}
      <div className="pointer-events-none relative z-10 flex h-full flex-col justify-end p-4">
        <div className="pointer-events-auto w-full max-w-sm rounded-2xl bg-white/90 p-5 shadow-[0_8px_40px_-20px_rgba(11,16,32,0.4)] backdrop-blur-md">
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="font-display text-[length:var(--text-h3)] font-semibold text-ink">
              {current ? SHOT_LABELS[current] : "-"}
            </h1>
            <p className="font-mono text-sm tabular-nums text-slate">
              {p.toFixed(3)}
            </p>
          </div>

          <label className="mt-4 block">
            <span className="sr-only">Scroll position through the cinematic</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={p}
              onChange={(e) => setP(Number.parseFloat(e.target.value))}
              className="w-full accent-violet"
            />
          </label>

          {/* Jump straight to the first frame of any shot. Tuning one beat means
              seeing its opening frame over and over. */}
          <div className="mt-4 flex flex-wrap gap-2">
            {(Object.keys(SHOTS) as ShotName[]).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setP(SHOTS[name].start)}
                aria-pressed={current === name}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  current === name
                    ? "bg-brand-gradient text-white"
                    : "border border-mist bg-white text-slate hover:border-violet/40 hover:text-ink",
                )}
              >
                {SHOT_LABELS[name]}
              </button>
            ))}
          </div>

          <p className="mt-4 text-[0.85rem] leading-relaxed text-slate">
            Drag to scrub. Every value here is exactly what the homepage computes
            at the same scroll position - the sequence is positional, so there is
            no playhead and no state to get out of sync. Append{" "}
            <code className="rounded bg-mist px-1.5 py-0.5 text-[0.8em]">?p=0.64</code>{" "}
            to open on a specific frame.
          </p>
        </div>
      </div>
    </div>
  );
}
