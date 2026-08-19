"use client";

import { useEffect, useRef } from "react";

/**
 * Makes the browser enforce the consent rule, in the form, before anything is
 * sent.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE RULE WAS ONLY EVER ENFORCED AFTER THE FACT, AND THAT IS WHY IT KEPT
 * CATCHING PEOPLE.
 *
 * Publishing a testimonial that names a child or carries a video needs a
 * consent reference. The database refuses it, and the server action explains
 * it — but only once the form has been submitted, the page has navigated, and
 * the explanation has been printed at the TOP of a page whose record you were
 * editing near the BOTTOM. Tick, save, scroll back, still a draft, no visible
 * reason. Reported three times as "it is not saving".
 *
 * A `required` attribute solves it outright: the browser refuses to submit,
 * scrolls to the offending field itself, and says so in a bubble pointing at
 * the box that needs filling. No round trip, no banner to miss, and the
 * message arrives attached to the thing it is about.
 *
 * It cannot be a static `required`, because the field is only required in one
 * combination — published, AND a child named or a video attached. So it is set
 * live from the other three controls, which is what this component is for.
 *
 * It renders nothing. It is a behaviour, and it has to live INSIDE the form it
 * governs so it can find its siblings.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function ConsentRequirement({
  publishName = "is_published",
  consentName = "consent_ref",
  childName = "child_first_name",
  videoName = "video_path",
  photoName = "photo_path",
}: {
  publishName?: string;
  consentName?: string;
  childName?: string;
  videoName?: string;
  photoName?: string;
}) {
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (!form) return;

    const field = (name: string) =>
      form.elements.namedItem(name) as HTMLInputElement | null;

    const publish = field(publishName);
    const consent = field(consentName);
    if (!publish || !consent) return;

    const sync = () => {
      // Read live rather than from props: a video can be attached, or a
      // child's name typed, without the page reloading — so a value captured
      // at render would already be out of date by the time it mattered.
      const named = Boolean(field(childName)?.value.trim());
      const hasVideo = Boolean(field(videoName)?.value.trim());
      const hasPhoto = Boolean(field(photoName)?.value.trim());
      const needed = publish.checked && (named || hasVideo || hasPhoto);

      consent.required = needed;
      consent.setCustomValidity(
        needed && !consent.value.trim()
          ? "This testimonial names a child, or has a video or a photo, so publishing it needs a consent reference - a note saying where the parent's permission is recorded."
          : "",
      );
    };

    sync();
    // `input` covers typing and programmatic changes that dispatch it; `change`
    // covers the checkbox and the file picker. Listening on the form catches
    // all four fields with one pair of handlers, and keeps working if any of
    // them is re-rendered underneath us.
    form.addEventListener("input", sync);
    form.addEventListener("change", sync);
    return () => {
      form.removeEventListener("input", sync);
      form.removeEventListener("change", sync);
      // Leaving a stale `required` behind would block a form this component no
      // longer governs.
      consent.required = false;
      consent.setCustomValidity("");
    };
  }, [publishName, consentName, childName, videoName, photoName]);

  return <span ref={anchor} hidden />;
}
