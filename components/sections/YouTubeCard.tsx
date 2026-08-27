"use client";

import { useState } from "react";

/**
 * A YouTube clip that does not look like a YouTube clip until you press it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY A FACADE RATHER THAN THE EMBED.
 *
 * Dropping the iframe straight into the card put YouTube's furniture on the
 * page: a title bar, the channel avatar, a share chip, the red play lozenge -
 * none of it ours, all of it louder than the two cards beside it. And because
 * this clip is a portrait SHORT in a 16:9 cell, YouTube filled the sides with a
 * darkened, blown-up copy of the same frame. That blur is baked into its own
 * 16:9 thumbnail too, so there was no version of the embed that looked calm.
 *
 * So nothing loads until somebody asks. Until then this is our own poster - cut
 * from the clip's ORIGINAL portrait frame, not YouTube's pillarboxed one - with
 * a play badge in the site's own colours. The iframe appears on click, with
 * `autoplay=1`, so the press that swaps it in is also the press that starts it.
 *
 * The side effect is performance: an embed costs several hundred kilobytes and
 * a set of third-party connections on page load. This costs one 57KB image, and
 * only the visitors who actually want the clip pay for the rest.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function YouTubeCard({
  videoId,
  poster,
  label,
  className,
}: {
  videoId: string;
  poster: string;
  /** Describes the clip, for the button and then the iframe title. */
  label: string;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <iframe
        // youtube-nocookie, and only reached once somebody has chosen to watch.
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
        title={label}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        className={className}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play: ${label}`}
      className={`group relative block overflow-hidden bg-ink ${className ?? ""}`}
    >
      {/* Plain <img>, not next/image: this is a fixed-size decorative poster
          inside a button, and the fill/sizes dance buys nothing here. */}
      <img
        src={poster}
        alt=""
        // This card is a long way below the fold everywhere it is used, and on
        // a slow connection the poster was competing with the copy above it for
        // the same few kilobits. `decoding="async"` for the same reason: there
        // is nothing here worth blocking a paint on.
        loading="lazy"
        decoding="async"
        className="size-full object-cover transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] group-hover:scale-[1.03]"
      />

      {/* A scrim, so the badge holds against a bright frame. Weak enough that
          the picture still reads as the picture. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent"
      />

      <span
        aria-hidden="true"
        className="absolute inset-0 grid place-items-center"
      >
        <span className="grid size-14 place-items-center rounded-full bg-white/95 shadow-lg shadow-black/25 transition-transform duration-300 group-hover:scale-110">
          {/* Nudged right by a pixel: a triangle centred on its bounding box
              reads as sitting left of centre inside a circle. */}
          <svg viewBox="0 0 24 24" className="ml-0.5 size-6 fill-violet">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
