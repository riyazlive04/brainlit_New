"use client";

import { useEffect, useRef, useState } from "react";
import { CHAT_MEDIA } from "@/content/chatbot";

/**
 * The future-readiness film, as a miniplayer that knows when it has been seen.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THE IFRAME API AND NOT A PLAIN EMBED.
 *
 * The step is meant to unlock "after watching". A plain `<iframe>` embed cannot
 * report anything - the parent frame is not allowed to look inside it - so the
 * only options are the IFrame API or a timer. A timer is a lie: it unlocks for
 * someone who pressed play and put the phone down, and it stays locked for
 * someone who watched at 2x.
 *
 * `youtube-nocookie.com` is what the API uses here, so a visitor who never
 * presses play is not given an advertising cookie for scrolling past.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Minimal shape of the bits of the IFrame API this file touches. */
type YTPlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  playVideo: () => void;
  mute: () => void;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
        },
      ) => YTPlayer;
      PlayerState: { ENDED: number; PLAYING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

/**
 * Loads the API script once per page, however many players ask for it.
 *
 * The API calls a SINGLE global callback when it is ready, so a second
 * component appending a second script tag would overwrite the first one's
 * callback and the first player would never initialise.
 */
let apiReady: Promise<void> | null = null;

function loadApi(): Promise<void> {
  if (apiReady) return apiReady;

  apiReady = new Promise<void>((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }
    window.onYouTubeIframeAPIReady = () => resolve();
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });

  return apiReady;
}

export function YouTubeStep({
  videoId,
  onWatched,
}: {
  videoId: string;
  onWatched: () => void;
}) {
  const mount = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const [watched, setWatched] = useState(false);

  /* `fired` is a ref, not state. The poll below closes over it, and a state
     value would be the one captured when the interval was created - so the
     completion would fire on every tick after the threshold rather than once. */
  const fired = useRef(false);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | undefined;

    void loadApi().then(() => {
      if (cancelled || !mount.current || !window.YT) return;

      const complete = () => {
        if (fired.current) return;
        fired.current = true;
        setWatched(true);
        onWatched();
      };

      player.current = new window.YT.Player(mount.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1, autoplay: 1 },
        events: {
          /**
           * PLAYS ITSELF, WITH SOUND IF THE BROWSER ALLOWS IT.
           *
           * `autoplay: 1` alone is not enough - every browser blocks unmuted
           * autoplay unless the page has earned it. This one has: the visitor
           * pressed a button and typed a number seconds ago, which on Chrome is
           * usually sufficient. `playVideo()` asks explicitly rather than
           * relying on the parameter.
           *
           * When it is refused the player just sits there, which is exactly the
           * "it does not play" being fixed - so a second later, if it is still
           * not PLAYING, it is muted and asked again. Muted autoplay is allowed
           * everywhere. A silent start is a poor outcome for a film with a
           * voice in it, but a frozen thumbnail is a worse one, and the viewer
           * can unmute from the controls.
           */
          onReady: (event) => {
            event.target.playVideo();
            setTimeout(() => {
              const p = player.current;
              if (!p) return;
              // 1 is PLAYING. Anything else here means the browser said no.
              if (p.getPlayerState() !== 1) {
                p.mute();
                p.playVideo();
              }
            }, 1200);
          },
          onStateChange: (event) => {
            if (event.data === window.YT?.PlayerState.ENDED) complete();

            // Polling only while it is actually playing. The API has no
            // progress event, and an interval that runs against a paused video
            // is a timer wearing a costume.
            if (event.data === window.YT?.PlayerState.PLAYING && !poll) {
              poll = setInterval(() => {
                const p = player.current;
                if (!p) return;
                const duration = p.getDuration();
                if (!duration) return;
                if (p.getCurrentTime() / duration >= CHAT_MEDIA.watchedFraction) {
                  complete();
                }
              }, 1000);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
      player.current?.destroy();
      player.current = null;
    };
  }, [videoId, onWatched]);

  // The flow skips this step when there is no id, so this is belt and braces
  // rather than the normal path — but an empty embed is a worse failure than a
  // missing one, so it is guarded here too.
  if (!videoId) return null;

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-mist">
      <div className="aspect-video w-full bg-ink">
        <div ref={mount} className="size-full" />
      </div>
      <button
        type="button"
        onClick={() => {
          if (fired.current) return;
          fired.current = true;
          onWatched();
        }}
        // A FILLED BAR, not violet text on white.
        // This is the only way out of the step, and it was sitting directly
        // under a full-bleed video - against that much contrast a bare tinted
        // label reads as a caption, not a control. Solid fill, white type, and
        // the full width of the card so there is nothing to hunt for.
        className="w-full bg-violet px-3 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet/90 focus-visible:bg-violet/90"
      >
        {/* Always offered, not only once the threshold is met. A person who
            has seen enough, or who cannot play video at all, must still be able
            to reach the rest of the conversation. */}
        {watched ? "Continue" : "Skip and continue"}
      </button>
    </div>
  );
}
