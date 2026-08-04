"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "testimonial-videos";
const MAX_BYTES = 100 * 1024 * 1024;
/** Above this, warn — it will be slow for a parent on mobile data. */
const COMFORTABLE_BYTES = 30 * 1024 * 1024;

const ACCEPTED = ["video/mp4", "video/webm", "video/quicktime"];

type State =
  | { kind: "idle" }
  | { kind: "uploading"; percent: number }
  | { kind: "done"; path: string; warn?: string }
  | { kind: "error"; message: string };

function mb(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

/**
 * Uploads a video straight from the browser to Supabase Storage.
 *
 * Deliberately NOT through a server action. Next caps action payloads at 1MB by
 * default, and raising that would mean streaming a 60MB file through the server
 * only to forward it on — doubling the transfer, holding a serverless function
 * open for the duration, and risking its timeout. The browser talks to storage
 * directly, authorised by the admin's own session and the bucket policies from
 * migration 0004.
 *
 * The resulting object path goes into a hidden input, so it saves with the rest
 * of the form rather than needing its own submit.
 */
export function VideoUpload({
  name,
  defaultPath,
}: {
  name: string;
  defaultPath?: string | null;
}) {
  const [state, setState] = useState<State>(
    defaultPath ? { kind: "done", path: defaultPath } : { kind: "idle" },
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const currentPath =
    state.kind === "done" ? state.path : (defaultPath ?? "");

  async function handleFile(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      setState({
        kind: "error",
        message: "Use an MP4, WebM or MOV file.",
      });
      return;
    }

    if (file.size > MAX_BYTES) {
      setState({
        kind: "error",
        message: `That file is ${mb(file.size)}. The limit is 100 MB — compress it first (HandBrake, "Fast 720p30").`,
      });
      return;
    }

    setState({ kind: "uploading", percent: 0 });

    try {
      const supabase = createClient();

      // Namespaced by date and a random suffix so re-uploading a file called
      // "IMG_0042.mov" never overwrites someone else's testimonial.
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
      const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${extension}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });

      if (error) throw new Error(error.message);

      setState({
        kind: "done",
        path,
        warn:
          file.size > COMFORTABLE_BYTES
            ? `${mb(file.size)} is large. Every parent who presses play downloads all of it — consider compressing to 720p.`
            : undefined,
      });
    } catch (error) {
      setState({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Upload failed. Please try again.",
      });
    }
  }

  return (
    <div>
      <span className="block text-sm font-medium text-ink">
        Video testimonial
      </span>
      <p className="mt-0.5 text-xs text-slate">
        MP4, WebM or MOV, up to 100 MB. Compress to 720p first — the file you
        upload is exactly what every visitor downloads.
      </p>

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
        <p role="status" className="mt-2 text-sm text-violet">
          Uploading… keep this tab open.
        </p>
      )}

      {state.kind === "done" && (
        <div className="mt-2">
          <p className="text-sm text-ink">
            <span className="font-medium">Video attached.</span>{" "}
            <span className="text-slate">
              Remember a consent reference — the database will not publish a
              video without one.
            </span>
          </p>
          {state.warn && (
            <p className="mt-1 text-xs text-spark-deep">{state.warn}</p>
          )}
        </div>
      )}

      {state.kind === "error" && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {state.message}
        </p>
      )}
    </div>
  );
}
