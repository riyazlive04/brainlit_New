"use client";

import { useEffect, useRef } from "react";
import { Container } from "@/components/ui/Container";
import { LogoCylinder, type LogoCylinderLogo } from "@/lib/logoCylinder";
import { YouTubeCard } from "@/components/sections/YouTubeCard";
import { publicStorageUrl } from "@/lib/storage";

/**
 * Session photographs on a slowly turning drum, with the testimonial below it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT IS ON THE DRUM AND WHAT IS NOT.
 *
 * The drum carries PHOTOGRAPHS. The video does not go on it, and that is not a
 * limitation of the drum — a video can be a texture. It is that a video on a
 * texture stops being a `<video>`: no native controls, no caption track, no
 * keyboard, and a file that decodes whether or not it is facing the camera. The
 * testimonial is the one thing in this section a parent is meant to press, so
 * it stays a real element, and the drum is the wall above it.
 *
 * `keyWhiteBackground` is FALSE here, and must stay false. The luminance key is
 * for logos — dark ink on white paper. Applied to a photograph it reads every
 * bright area as background and punches a hole through it: a face lit from one
 * side loses the lit half. See the note on it in lib/logoCylinder.ts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * CONSENT IS HELD for the Sanfort International School photographs, confirmed
 * by BrainLIT on 27 Aug 2026. Recorded here because these frames show
 * identifiable children with the school legible on their uniforms, and the
 * question is otherwise guaranteed to be asked again by whoever reads this next.
 *
 * REAL FILES ONLY. The six entries that were here originally were placeholders
 * describing sessions we had no photographs of, and every one rendered as a
 * tinted block carrying its own caption. This list is as long as the evidence.
 *
 * `repeat` IS ABOUT THE RADIUS, not about how many pictures there are.
 *
 * Radius is derived from the plate COUNT, and a bigger drum turns its front
 * plates more slowly past the camera - so more of them face it at once and
 * survive the facing fade. Fewer plates means a smaller drum, which means the
 * plates either side of centre are already edge-on and dimmed, and the band
 * reads as ONE photograph with two smudges beside it.
 *
 * That is not a guess. Five photographs at `repeat: 2` is ten plates, and it
 * renders as a single legible picture with two smudges beside it. At fifteen,
 * three read clearly with a fourth turning in. The plates round the back that
 * nobody sees are the price of the ones at the front being face-on.
 *
 * It is the PLATE COUNT that wants to stay in the mid-teens, and that is the
 * product of the two numbers - so `repeat` falls as the set grows. Eight
 * photographs wanted two wraps; fourteen want one.
 *
 * Adjacent plates step through the set, so the ones in view are always
 * different photographs; only the far side repeats. Adding a sixth means adding
 * a line here - and if the band ever looks sparse again, RAISE this number and
 * look, rather than reasoning about it.
 *
 * The labels are the sr-only captions further down as well as the fallback
 * text, so they describe THIS frame rather than the section's theme — a
 * caption that generalises is one a screen reader user cannot tell apart from
 * its neighbour.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 800px WEBP, AND THAT IS ALREADY GENEROUS. A NEW PHOTOGRAPH GETS THE SAME.
 *
 * The plate at the front of the drum is never wider than about 390 device
 * pixels. That is not a guess: the container caps at max-w-5xl (1024px), the
 * layout puts four plates across it, and `maxDpr` caps the pixel ratio at 1.75
 * - so 1024/4 x 1.75. A phone renders it smaller still. 800px is twice that,
 * which is the headroom three.js wants for a clean mipmap and no more.
 *
 * These arrived as 1400px JPEGs, 1.9MB for the set. At 800px WebP the same
 * fourteen are 591KB and no plate looks different, because the extra pixels
 * were being thrown away by the sampler either way.
 *
 * To add one:
 *   sharp(src).resize(800).webp({ quality: 78 }).toFile('session-NN.webp')
 * ─────────────────────────────────────────────────────────────────────────────
 */
const PHOTOS: LogoCylinderLogo[] = [
  { src: "/testimonials/session-01.webp", label: "Receiving a memento on stage at St Joseph's College for Women, Tirupur" },
  { src: "/testimonials/session-02.webp", label: "The BrainLIT team with the faculty who hosted the session" },
  { src: "/testimonials/session-03.webp", label: "The panel seated before the expert session begins" },
  { src: "/testimonials/session-04.webp", label: "The memento handed over as the session closes" },
  { src: "/testimonials/session-05.webp", label: "Speaking at the podium at IITM Research Park" },
  { src: "/testimonials/session-06.webp", label: "Taking a question from the room at IITM Research Park" },
  { src: "/testimonials/session-07.webp", label: "Pointing something out to the audience at IITM Research Park" },
  { src: "/testimonials/session-08.webp", label: "Making a point mid-talk at IITM Research Park" },
  { src: "/testimonials/session-09.webp", label: "Shaking hands with a student during the session at Sanfort International School" },
  { src: "/testimonials/session-10.webp", label: "The class during the BrainLIT session at Sanfort International School" },
  { src: "/testimonials/session-11.webp", label: "The BrainLIT team in front of the board at Sanfort International School" },
  { src: "/testimonials/session-12.webp", label: "Working through what AI stands for, on the board at Sanfort International School" },
  { src: "/testimonials/session-13.webp", label: "Teaching from the board and screen at Sanfort International School" },
  { src: "/testimonials/session-14.webp", label: "A student answering at the problem-solving board, Sanfort International School" },
];

/**
 * Every moving picture in this band, in ONE list so it renders as one row.
 *
 * They were two blocks: a pair of clips in a 3-column grid where one spanned
 * two columns, and the parent's card centred on its own below at `max-w-md`.
 * Three videos, three widths, two alignments. Uniform `aspect-video` cells in a
 * single grid is the whole fix.
 *
 * `object-cover`, not `contain`. One clip is 720x1280 - a phone held upright -
 * and containing it inside a 16:9 cell is precisely the black margin this is
 * meant to be rid of. Cover crops it to its middle band, which for a room of
 * people seated at a table is where everyone already is.
 *
 * The third cell here was a card captioned "Aakash · Parent · Chennai", and
 * the file behind it is a nine-second SCREEN RECORDING OF THIS WEBSITE - the
 * header, the webinar button, the hero gradient, and nobody in it. Every frame
 * sampled across its length is the same. A named parent from a named city
 * attached to footage of our own marquee is a fabricated testimonial, and the
 * consent rule this codebase applies to a real parent's face has no meaning
 * beside it. Restoring it means finding the video that card was supposed to
 * point at, not re-adding the pointer.
 *
 * POSTERS ARE NOT DECORATION. `preload="none"` is what keeps a 20MB file off
 * every visitor's connection, and its cost is that the element has nothing to
 * paint until someone presses play - which renders as a black rectangle and
 * reads as broken. A poster is the one frame that makes deferring the rest
 * free. Each was pulled from its own video, so it cannot misrepresent it.
 */
const CLIPS = [
  {
    bucket: "session-videos",
    path: "2026/st-josephs-tirupur-talk.mp4",
    poster: "/testimonials/poster-talk.webp",
    label: "A parent speaking to camera about what changed at home",
    name: null,
    caption: "A parent on what changed at home",
  },
  {
    bucket: "session-videos",
    path: "2026/st-josephs-tirupur-clip.mp4",
    poster: "/testimonials/poster-clip.webp",
    label:
      "A short clip filmed during the session at St Joseph's College for Women, Tirupur",
    name: null,
    caption: "Inside the session at St Joseph's College for Women, Tirupur",
  },
  {
    /**
     * A YOUTUBE SHORT, not a file in our bucket - hence `youtubeId` where the
     * others carry `bucket`/`path`. From
     * https://www.youtube.com/shorts/qwul0znoxaU the id is the last segment.
     *
     * Shorts are filmed PORTRAIT and this cell is 16:9. Handing that to the
     * embed produced YouTube's own pillarbox - a darkened, blown-up copy of the
     * frame down each side - so the card shows OUR poster instead and the embed
     * only appears once somebody presses play. See YouTubeCard.
     */
    youtubeId: "qwul0znoxaU",
    bucket: null,
    path: null,
    // OUR crop of the clip's original portrait frame. YouTube's own 16:9
    // thumbnail has the pillarbox blur baked into it, so it could not be used.
    poster: "/testimonials/poster-short.webp",
    label: "A parent talking about BrainLIT",
    name: null,
    caption: "Session in Sanfort International School",
  },
];

/** Every dial the drum is given. Module scope: it closes over nothing. */
function makeDrum(container: HTMLDivElement) {
  return new LogoCylinder({
    container,
    logos: PHOTOS,
    // Photographs, not line art. See the note above.
    keyWhiteBackground: false,
    spinSpeed: 0.24,
    // ONCE round, now that there are fourteen photographs. Fourteen plates is
    // already where the band wants to be; wrapping twice would be
    // twenty-eight, and every extra plate shrinks the ones at the front. See
    // the note on PHOTOS - it is the plate COUNT this controls, not the
    // number of pictures.
    repeat: 1,
    plateWidth: 2.4,
    aspect: 1.4,
    tilt: 0.12,
    logosInView: 4,
    reactToScroll: true,
    maxDpr: 1.75,
  });
}

/**
 * NOTHING HERE LOADS UNTIL THE BAND IS NEARLY ON SCREEN.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Constructing LogoCylinder is what fetches the photographs - `build()` in
 * lib/logoCylinder.ts hands every `src` to a TextureLoader - and it also opens
 * a WebGL context. Doing that on mount meant every visitor paid for fourteen
 * photographs before they had scrolled a pixel, including the ones who read the
 * hero and tapped WhatsApp. Measured on a throttled connection (400kbps,
 * 400ms RTT) the homepage had not finished loading after sixty seconds.
 *
 * The drum ALREADY had an IntersectionObserver, which is why this looks like a
 * duplicate and is not. That one pauses the animation loop when the band
 * scrolls away - it exists to stop burning a phone battery on a drum nobody is
 * looking at, and it can only do that once the drum exists. This one decides
 * whether the drum exists at all, so it has to sit outside it.
 *
 * The two are deliberately not merged. Starting is one-shot and cheap to get
 * wrong in one direction only; pausing is continuous and has to keep firing.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function TestimonialDrum() {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mount.current;
    if (!container) return;

    let drum: LogoCylinder | null = null;

    const build = () => {
      if (drum) return;
      drum = makeDrum(container);
    };

    // No IntersectionObserver (very old browser, or a test environment): build
    // immediately. Losing the saving is acceptable; losing the drum is not.
    if (typeof IntersectionObserver === "undefined") {
      build();
      return () => drum?.destroy();
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        // One-shot. The drum has its own observer for pausing the animation
        // when it scrolls away; this one exists only to decide when to START,
        // so it has nothing left to do afterwards.
        io.disconnect();
        build();
      },
      // 600px of warning. At the edge of the viewport the visitor would watch
      // an empty box fill in; 600px is roughly one flick of a thumb, which is
      // enough time for the first plates to arrive before the band is reached.
      { rootMargin: "600px 0px" },
    );
    io.observe(container);

    return () => {
      io.disconnect();
      drum?.destroy();
    };
  }, []);

  /**
   * #f8fafc is `bg-mist/30` FLATTENED against white, and it is opaque on
   * purpose. The tint the testimonials block below uses is 30% alpha, which is
   * fine down there and wrong here: this band sits close enough to the
   * cinematic zone that the fixed canvas is still behind it, and a translucent
   * background let it through as a visible tonal seam across the middle of the
   * section. Same colour, nothing showing through.
   */
  return (
    <section
      className="relative z-10 overflow-hidden bg-[#f8fafc] py-10 sm:py-14"
    >
      {/* TWO HEADINGS, because there are two different claims here.
          ─────────────────────────────────────────────────────────────
          This band ran under a single "Testimonials" title over content that
          was mostly not testimony: photographs of guest talks at colleges, and
          one parent video. The photographs were doing the work of proof while
          being labelled as something they are not.

          Split, each half says what it is. The drum is where BrainLIT has been
          invited to speak; the row below it is a parent describing what changed
          at home. Only the second is a testimonial, and now only the second
          claims to be. */}
      <Container size="wide">
        <h2 className="text-center font-display text-[length:var(--text-h2)] leading-tight font-semibold tracking-tight text-ink">
          BrainLIT momentum
        </h2>
      </Container>

      {/* `mt-10`, not the `mt-14` this had originally. The section's own padding
          was halved when the old headline came out, and a margin tuned against
          the larger padding reopens the gap it was cut to close. */}
      <div className="relative mt-10">
        {/* SHORTER THAN IT WAS (440 -> 340).
            The camera's fov is VERTICAL, so the world height it frames is fixed
            no matter how many pixels the canvas is given. A tall box therefore
            does not show more drum - it shows the same drum with more empty air
            above and below it, which on a wide desktop was reading as a blank
            band between the heading that used to be here and the videos. */}
        {/* CAPPED WIDTH, not `w-full`.
            The camera frames the drum by its own geometry, so a wider canvas
            does not make the drum bigger - it just adds empty air either side.
            Spanning the full 1900px of a desktop window left the plates
            clustered in the middle half with dead margins, which reads as a
            sparse band however many photographs are on it. Capping the box
            lets the drum fill what it is given. */}
        <div
          ref={mount}
          className="mx-auto h-[300px] w-full max-w-5xl sm:h-[340px]"
          aria-hidden="true"
        />

        {/* ── The accessible half of the wall ──────────────────────────────
            A photograph wall that exists only inside WebGL is invisible to a
            screen reader and to a crawler: the canvas is one element with no
            text in it. These are the same captions, in the DOM, hidden from
            sight only. */}
        <ul className="sr-only">
          {PHOTOS.map((photo) => (
            <li key={photo.src}>{photo.label}</li>
          ))}
        </ul>

        {/* BELOW the drum, never over it.
            ───────────────────────────────────────────────────────
            The first arrangement centred a card on the band, which put it
            exactly where the drum's FRONT plates are — the three or four at
            full opacity that the facing fade exists to protect. The wall was
            then legible only at its edges, where every plate is dimmed and
            foreshortened, and the one part worth seeing was behind a video.

            A band and a row in sequence lose nothing and hide nothing. */}
        <Container size="wide">
          {/* No `-mt-6` on the list any more: that negative margin existed to
              tuck the videos up under the drum when nothing sat between them.
              With a heading in the gap it would pull the row onto its own
              title. */}
          <h2 className="mt-14 text-center font-display text-[length:var(--text-h2)] leading-tight font-semibold tracking-tight text-ink">
            Testimonials
          </h2>
        </Container>

        <Container size="wide">
          <ul className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CLIPS.map((clip) => {
              // A hosted file needs a <video>; a YouTube id needs an <iframe>.
              // Nothing else about the card differs, so the branch is as small
              // as it can be and the figure below is shared.
              const src = clip.bucket
                ? publicStorageUrl(clip.bucket, clip.path)
                : null;
              if (!src && !clip.youtubeId) return null;

              return (
                // `flex` on the item and `h-full` on the figure: a grid row is
                // as tall as its tallest cell, and without these a two-line
                // caption leaves its neighbours' cards short with a strip of
                // page showing under them.
                <li key={clip.youtubeId ?? clip.path} className="flex">
                  <figure className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-paper shadow-[0_18px_40px_-24px_rgba(11,16,32,0.35)] ring-1 ring-mist">
                    {clip.youtubeId ? (
                      <YouTubeCard
                        videoId={clip.youtubeId}
                        poster={clip.poster ?? ""}
                        label={clip.label}
                        className="aspect-video w-full border-0"
                      />
                    ) : (
                      <video
                        src={src ?? undefined}
                        poster={clip.poster ?? undefined}
                        playsInline
                        preload="none"
                        controls
                        aria-label={clip.label}
                        className="aspect-video w-full bg-ink object-cover"
                      >
                        {/* Kept even with no file supplied. A video of a person
                            speaking needs captions; leaving the element out is
                            how that gets forgotten rather than scheduled. */}
                        <track kind="captions" srcLang="en" label="English" />
                      </video>
                    )}
                    <figcaption className="px-4 py-3 text-sm text-slate">
                      {clip.name ? (
                        <>
                          <span className="font-display font-semibold text-ink">
                            {clip.name}
                          </span>
                          {clip.caption}
                        </>
                      ) : (
                        clip.caption
                      )}
                    </figcaption>
                  </figure>
                </li>
              );
            })}
          </ul>
        </Container>
      </div>
    </section>
  );
}
