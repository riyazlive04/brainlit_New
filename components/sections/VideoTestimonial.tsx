"use client";

import { useState } from "react";

type Props = {
  src: string;
  parentName: string;
  city: string | null;
};

/**
 * Uploaded video testimonial, click to play.
 *
 * The <video> element carries preload="none" and the poster is drawn from brand
 * tokens rather than a still frame. Together that means ZERO bytes of video are
 * fetched until a visitor deliberately presses play.
 *
 * That is not polish. Supabase Storage does not transcode, so the file served
 * is exactly the file uploaded — commonly 30MB or more. On a page that may show
 * several testimonials, to an audience on Indian mobile data, preloading even
 * metadata for each one would be the heaviest thing on the site, paid for by
 * every visitor including the majority who never press play.
 *
 * Controls appear only once playing, so the facade stays clean until it is a
 * real player.
 */
export function VideoTestimonial({ src, parentName, city }: Props) {
  const [playing, setPlaying] = useState(false);

  const label = `Play video testimonial from ${parentName}${city ? `, ${city}` : ""}`;

  if (playing) {
    return (
      <video
        src={src}
        controls
        autoPlay
        playsInline
        // Without this, iOS Safari takes the video fullscreen on play and
        // throws the visitor out of the page they were reading.
        className="aspect-video w-full rounded-2xl bg-ink"
        aria-label={label}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={label}
      className="group relative block aspect-video w-full overflow-hidden rounded-2xl bg-canvas-fallback ring-1 ring-mist transition-shadow hover:shadow-[0_12px_32px_-12px_rgba(11,16,32,0.25)] focus-visible:ring-2 focus-visible:ring-violet focus-visible:outline-none"
    >
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-16 place-items-center rounded-full bg-spark shadow-[0_8px_28px_-8px_rgba(252,208,87,0.95)] transition-transform duration-300 [transition-timing-function:var(--ease-out-expo)] group-hover:scale-110">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="#0b1020"
            aria-hidden="true"
            // Nudged right: a play triangle centred by its bounding box always
            // reads as sitting slightly left.
            className="ml-1"
          >
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        </span>
      </span>

      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/95 to-transparent p-4 pt-10 text-left">
        <span className="block font-display text-sm font-semibold text-ink">
          {parentName}
        </span>
        <span className="block text-xs text-slate">
          {city ? `${city} · ` : ""}Watch their story
        </span>
      </span>
    </button>
  );
}
