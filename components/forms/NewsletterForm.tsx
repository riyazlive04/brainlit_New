"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";

type Status = "idle" | "sending" | "done" | "error";

/**
 * Newsletter signup.
 *
 * One field and no form library — react-hook-form on a single input is 12KB to
 * do what `required` and `type="email"` already do. The server re-validates
 * with `newsletterSchema` regardless; client validation here is a convenience.
 *
 * The success state replaces the form rather than sitting under it, because a
 * form still standing there after a successful submit is the single most common
 * cause of duplicate signups.
 */
export function NewsletterForm({
  source = "home",
  className,
}: {
  source?: "home" | "footer" | "resources" | "blog" | "webinar";
  className?: string;
}) {
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus("sending");
    setMessage(null);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(data.get("email") ?? ""),
          company: String(data.get("company") ?? ""),
          source,
        }),
      });

      const result = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        setStatus("error");
        setMessage(result.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("done");
    } catch {
      setStatus("error");
      setMessage(
        "We could not reach the server. Please check your connection and try again.",
      );
    }
  }

  if (status === "done") {
    return (
      <p
        role="status"
        className={cn(
          "success-rise rounded-2xl border border-indigo/25 bg-indigo/[0.04] p-5 text-[0.975rem] leading-relaxed text-ink",
          className,
        )}
      >
        <span className="font-display font-semibold">You&apos;re on the list.</span>{" "}
        The next issue will arrive in your inbox. Every email has an unsubscribe
        link, and one click is all it takes.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className={className} noValidate={false}>
      <label htmlFor={`${id}-email`} className="sr-only">
        Email address
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          disabled={status === "sending"}
          aria-describedby={message ? `${id}-error` : undefined}
          aria-invalid={status === "error" || undefined}
          className="min-h-11 flex-1 rounded-full border border-mist bg-paper px-5 text-[0.975rem] text-ink placeholder:text-slate/60 focus-visible:border-violet disabled:opacity-60"
        />

        {/* Honeypot. Hidden from sighted users AND from assistive technology —
            aria-hidden plus tabIndex, so a screen reader never announces a
            field its user is not meant to fill in. */}
        <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </div>

        <button
          type="submit"
          disabled={status === "sending"}
          className="min-h-11 rounded-full bg-brand-gradient px-7 font-display font-semibold text-white transition-[filter,transform] duration-200 [transition-timing-function:var(--ease-out-expo)] hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55"
        >
          {status === "sending" ? "Signing you up…" : "Subscribe"}
        </button>
      </div>

      {message && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-3 text-sm text-ink"
        >
          {message}
        </p>
      )}
    </form>
  );
}
