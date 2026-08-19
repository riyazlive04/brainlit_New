"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { publicStorageUrl } from "@/lib/storage";

/**
 * An image, uploaded straight to Supabase Storage.
 *
 * Bucket, labels and preview crop come from the caller: a programme photograph
 * and a parent portrait want different ceilings, different advice and different
 * shapes, and everything else about getting a file into storage is identical.
 *
 * Sibling of VideoUpload, and deliberately its own component rather than a
 * generalisation of it. The two share about fifteen lines of upload plumbing
 * and disagree about everything that matters: the limits, the accepted types,
 * the advice, and whether a preview is worth showing. A `MediaUpload` taking
 * seven props to reconcile them would be longer than both and harder to read
 * than either.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IT SHOWS A PREVIEW, WHICH THE VIDEO ONE CANNOT AFFORD TO.
 *
 * A video preview means fetching tens of megabytes to render a thumbnail
 * nobody asked for. An image preview means fetching the image, which is the
 * thing that was just uploaded and is already in cache. It is also worth far
 * more here: the image is CROPPED to fit, and an admin who cannot see the crop
 * will find out what it cut off from the live site.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The browser talks to storage DIRECTLY, authorised by the admin's own session
 * and the bucket policies from its migration — the file never passes through a
 * server action, which would mean holding a request open for the whole upload.
 */

/**
 * Per-bucket ceilings, each matching what its own migration enforces.
 *
 * The browser check is a COURTESY, not the limit — the storage API is reachable
 * directly with the same session, which is why the real ceiling lives on the
 * bucket. This one exists so an admin who picks a 40MB photograph is told so
 * immediately rather than after a long upload fails.
 */
const LIMITS: Record<string, number> = {
  "course-images": 8 * 1024 * 1024,
  "testimonial-photos": 4 * 1024 * 1024,
};

/**
 * Above this a photograph is costing more than it earns. Not refused — a
 * genuinely large, genuinely good photograph is the admin's call — but said
 * out loud, because nobody notices a slow page they have already loaded.
 */
const COMFORTABLE_BYTES = 600 * 1024;

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

type State =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "done"; path: string; warn?: string }
  | { kind: "error"; message: string };

const kb = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;

export function ImageUpload({
  name,
  defaultPath,
  bucket,
  label,
  hint,
  aspect = "aspect-video",
}: {
  name: string;
  defaultPath?: string | null;
  /** Which Storage bucket to write to. Its ceiling comes from LIMITS above. */
  bucket: string;
  label: string;
  hint: string;
  /** Preview crop, so an admin sees the shape the live site will use. */
  aspect?: string;
}) {
  const maxBytes = LIMITS[bucket] ?? 4 * 1024 * 1024;
  const [state, setState] = useState<State>(
    defaultPath ? { kind: "done", path: defaultPath } : { kind: "idle" },
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const currentPath = state.kind === "done" ? state.path : (defaultPath ?? "");
  const previewUrl = publicStorageUrl(bucket, currentPath || null);

  async function handleFile(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      setState({ kind: "error", message: "Use a JPEG, PNG, WebP or AVIF file." });
      return;
    }

    if (file.size > maxBytes) {
      setState({
        kind: "error",
        message: `That file is ${kb(file.size)}. The limit is ${kb(maxBytes)} - export it for the web first.`,
      });
      return;
    }

    setState({ kind: "uploading" });

    try {
      const supabase = createClient();

      // Namespaced by year and a random suffix, so re-uploading a file called
      // "IMG_0042.jpg" never overwrites another programme's photograph.
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${extension}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { contentType: file.type, upsert: false });

      if (error) throw new Error(error.message);

      setState({
        kind: "done",
        path,
        warn:
          file.size > COMFORTABLE_BYTES
            ? `${kb(file.size)} is heavy for a card image. Around 200 KB is plenty at this size.`
            : undefined,
      });
    } catch (error) {
      setState({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Upload failed. Please try again.",
      });
    }
  }

  return (
    <div>
      <span className="block text-sm font-medium text-ink">{label}</span>
      <p className="mt-0.5 text-xs text-slate">{hint}</p>

      {/* Carries the saved value with the rest of the form. */}
      <input type="hidden" name={name} value={currentPath} />

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
          className="block w-full max-w-sm text-sm text-slate file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-mist file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-mist/70"
        />

        {currentPath && state.kind !== "uploading" && (
          <button
            type="button"
            onClick={() => {
              setState({ kind: "idle" });
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="text-sm text-slate transition-colors hover:text-red-600"
          >
            Remove
          </button>
        )}
      </div>

      {state.kind === "uploading" && (
        <p className="mt-2 text-sm text-slate">Uploading…</p>
      )}

      {state.kind === "error" && (
        <p className="mt-2 text-sm text-red-600">{state.message}</p>
      )}

      {previewUrl && state.kind !== "uploading" && (
        <div className="mt-3">
          {/* A plain <img>, not next/image. The source is a runtime value from
              a storage bucket that is not in `images.remotePatterns`, and the
              optimiser refuses unconfigured hosts — in the admin, where nobody
              is measuring LCP, the correct trade is the one that works. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={`Current ${label.toLowerCase()}`}
            className={`${aspect} w-full max-w-sm rounded-xl border border-mist object-cover`}
          />
          {state.kind === "done" && state.warn && (
            <p className="mt-2 text-xs text-slate">{state.warn}</p>
          )}
        </div>
      )}
    </div>
  );
}
