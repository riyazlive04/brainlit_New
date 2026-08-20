"use client";

import { useEffect, useRef } from "react";
import { WEBINAR_HERO } from "@/content/webinar";
import { publicStorageUrl } from "@/lib/storage";

/**
 * The parent testimonial, opening the page.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A WINDOW ON A LONGER RECORDING, ENFORCED IN THE PLAYER.
 *
 * The clip worth showing is 01:07 to 01:43 of a 2m16s file, and no trimmed
 * version exists. So the element seeks to `start` before the first frame plays
 * and pauses itself at `end`.
 *
 * This is a stopgap and should be read as one. The scrubber still spans the
 * whole recording, so a viewer who drags it lands outside the window - and the
 * browser still downloads the whole file to play 36 seconds of it. Supply a cut
 * file, point `clip.path` at it and set start/end to null; the guards below
 * become no-ops on their own.
 *
 * `preload="metadata"`, not "none": seeking to 67s needs the duration and the
 * seek index, and with nothing preloaded the first press of play starts at zero
 * and jumps - which looks like a bug rather than a clip.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function HeroTestimonial() {
  const video = useRef<HTMLVideoElement>(null);
  const { clip } = WEBINAR_HERO;
  const src = publicStorageUrl(clip.bucket, clip.path);

  useEffect(() => {
    const el = video.current;
    if (!el || clip.start == null) return;

    const seekToStart = () => {
      // Only when it has not been moved deliberately - re-seeking on every
      // loadedmetadata would fight a viewer who has scrubbed on purpose.
      if (el.currentTime < clip.start) el.currentTime = clip.start;
    };

    const stopAtEnd = () => {
      if (clip.end != null && el.currentTime >= clip.end) {
        el.pause();
        // Back to the first frame of the window, so pressing play again
        // replays the clip rather than the tail of the recording.
        el.currentTime = clip.start;
      }
    };

    el.addEventListener("loadedmetadata", seekToStart);
    el.addEventListener("timeupdate", stopAtEnd);
    // Already loaded by the time the effect runs, on a warm cache.
    if (el.readyState >= 1) seekToStart();

    return () => {
      el.removeEventListener("loadedmetadata", seekToStart);
      el.removeEventListener("timeupdate", stopAtEnd);
    };
  }, [clip.start, clip.end]);

  if (!src) return null;

  return (
    <figure className="overflow-hidden rounded-2xl bg-paper shadow-[0_18px_40px_-24px_rgba(11,16,32,0.35)] ring-1 ring-mist">
      <p className="px-5 pt-4 font-display text-xs font-semibold tracking-[0.16em] text-violet uppercase">
        {WEBINAR_HERO.proofLabel}
      </p>

      {/* The summary sits ABOVE the video and is introduced as a summary.
          Without that line a reader takes it for a transcript, and it is not
          one - see the note on it in content/webinar.ts. */}
      <div className="px-5 pt-3 pb-4">
        <p className="text-xs text-slate">{WEBINAR_HERO.summaryIntro}</p>
        <p className="mt-1.5 font-display text-[1.05rem] leading-snug font-medium text-ink">
          {WEBINAR_HERO.summary}
        </p>
      </div>

      <video
        ref={video}
        src={src}
        poster={clip.poster}
        controls
        playsInline
        preload="metadata"
        aria-label={WEBINAR_HERO.caption}
        className="aspect-video w-full bg-ink object-cover"
      >
        {/* TODO: no caption file exists. If this recording is not in English,
            a hero most visitors cannot follow is a weak opening - and captions
            are what a deaf visitor has instead of the audio either way. */}
        <track kind="captions" srcLang="en" label="English" />
      </video>

      <figcaption className="px-5 py-4 text-sm leading-relaxed text-slate">
        {WEBINAR_HERO.caption}
      </figcaption>
    </figure>
  );
}
