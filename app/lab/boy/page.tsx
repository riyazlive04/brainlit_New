"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/**
 * Character inspector for CartoonBoy.
 *
 * In the cinematic he is roughly a sixth of the frame's height, which is far too
 * small to judge a face by — every facial problem this page has been used to fix
 * was invisible at the size he actually ships at and obvious the moment he was
 * framed like this.
 *
 * `?f=head` frames the face; `?f=body` (default) frames the whole figure.
 * `?turn=0.6` yaws him, for checking the silhouette off-axis.
 */
const BoyStage = dynamic(() => import("./BoyStage").then((m) => m.BoyStage), {
  ssr: false,
  loading: () => null,
});

export default function BoyLab() {
  const [framing, setFraming] = useState<"body" | "head">("body");
  const [turn, setTurn] = useState(0);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("f") === "head") setFraming("head");
    const t = Number.parseFloat(q.get("turn") ?? "");
    if (Number.isFinite(t)) setTurn(t);
  }, []);

  return (
    <div className="relative h-[calc(100svh-3rem)] bg-white">
      <BoyStage framing={framing} turn={turn} />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/90 p-2 shadow-[0_8px_40px_-20px_rgba(11,16,32,0.4)] backdrop-blur-md">
          {(["body", "head"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFraming(f)}
              className={
                framing === f
                  ? "rounded-full bg-brand-gradient px-4 py-2 text-sm font-medium text-white"
                  : "rounded-full px-4 py-2 text-sm font-medium text-slate"
              }
            >
              {f}
            </button>
          ))}
          <input
            type="range"
            min={-1.2}
            max={1.2}
            step={0.01}
            value={turn}
            onChange={(e) => setTurn(Number.parseFloat(e.target.value))}
            className="w-40 accent-violet"
            aria-label="Turn"
          />
        </div>
      </div>
    </div>
  );
}
