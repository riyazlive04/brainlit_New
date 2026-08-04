"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, Honeypot } from "@/components/forms/Field";
import { phoneInputProps } from "@/components/forms/phoneInput";
import { AgePicker } from "@/components/forms/AgePicker";
import { Button } from "@/components/ui/Button";
import { SuccessMark } from "@/components/ui/SuccessMark";
import { webinarRegistrationSchema } from "@/lib/schemas";
import { readUtmParams, trackEvent } from "@/lib/analytics";
import { SITE, whatsappHref } from "@/lib/site";
import type {
  WebinarFormValues,
  WebinarRegistrationInput,
} from "@/lib/schemas";

type Props = { sessionId?: string | null };

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "done"; alreadyRegistered: boolean }
  | { kind: "error"; message: string };

export function WebinarForm({ sessionId }: Props) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const whatsapp = whatsappHref();

  // Three generics: the values the form holds, the (unused) context, and the
  // validated values the submit handler receives. Collapsing these into one
  // breaks because `source` has a default and `childAge` is coerced from the
  // select's string — so the form's shape and the validated shape genuinely
  // differ.
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WebinarFormValues, unknown, WebinarRegistrationInput>({
    resolver: zodResolver(webinarRegistrationSchema),
    defaultValues: { source: "webinar", consent: false },
  });

  async function onSubmit(values: WebinarRegistrationInput) {
    setStatus({ kind: "submitting" });

    try {
      const response = await fetch("/api/webinar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          sessionId: sessionId ?? undefined,
          // Read at submit time, not on mount: the parameters are on the
          // landing URL and must survive the user scrolling around first.
          ...readUtmParams(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setStatus({
          kind: "error",
          message: data.error ?? "Something went wrong. Please try again.",
        });
        return;
      }

      // Fired only on a confirmed server success. Tracking the click instead
      // would inflate the conversion count with every failed submission and
      // quietly corrupt your cost-per-lead.
      trackEvent("webinar_register", {
        already_registered: Boolean(data.alreadyRegistered),
      });

      setStatus({
        kind: "done",
        alreadyRegistered: Boolean(data.alreadyRegistered),
      });
    } catch {
      setStatus({
        kind: "error",
        message:
          "We could not reach the server. Please check your connection and try again.",
      });
    }
  }

  if (status.kind === "done") {
    return (
      <div
        className="rounded-2xl border border-mist bg-white p-8 text-center"
        // Announced as a whole once, when it replaces the form. Without this a
        // screen reader user who submitted gets no confirmation at all — the
        // form simply vanishes.
        role="status"
        aria-live="polite"
      >
        <SuccessMark />

        {/* Staggered so the words land after the mark, not with it. */}
        <h3
          className="success-rise mt-6 font-display text-[length:var(--text-h3)] text-ink"
          style={{ animationDelay: "420ms" }}
        >
          {status.alreadyRegistered
            ? "You are already registered."
            : "Your seat is booked."}
        </h3>

        <p
          className="success-rise mt-3 text-[0.975rem] leading-relaxed text-slate"
          style={{ animationDelay: "520ms" }}
        >
          {status.alreadyRegistered
            ? "We already have you on the list for this session. Check your inbox for the joining details."
            : "Check your email for confirmation and the joining link. If it has not arrived in a few minutes, look in your spam folder."}
        </p>

        {whatsapp && (
          <div
            className="success-rise mt-6"
            style={{ animationDelay: "620ms" }}
          >
            <Button href={whatsapp} external variant="outline" size="md">
              Any questions? Message us
            </Button>
          </div>
        )}
      </div>
    );
  }

  const submitting = status.kind === "submitting";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-2xl border border-mist bg-white p-6 sm:p-8"
    >
      <h3 className="font-display text-[length:var(--text-h3)] text-ink">
        Reserve your free seat
      </h3>
      <p className="mt-2 text-sm text-slate">
        For parents. Takes under a minute.
      </p>

      <div className="mt-6 space-y-5">
        <Field label="Your name" name="name" required error={errors.name?.message}>
          {(props) => (
            <input
              type="text"
              autoComplete="name"
              placeholder="Priya Raman"
              {...props}
              {...register("name")}
            />
          )}
        </Field>

        <Field label="Email" name="email" required error={errors.email?.message}>
          {(props) => (
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...props}
              {...register("email")}
            />
          )}
        </Field>

        <Field
          label="Mobile number"
          name="phone"
          required
          prefix="+91"
          hint="10 digits. So we can send the joining link on WhatsApp too."
          error={errors.phone?.message}
        >
          {(props) => (
            <input {...props} {...phoneInputProps(register("phone"))} />
          )}
        </Field>

        <AgePicker
          required
          registration={register("childAge")}
          error={errors.childAge?.message}
          hint="So we can tell you honestly whether they are ready."
        />

        <div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0 rounded border-mist accent-violet"
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? "consent-error" : undefined}
              {...register("consent")}
            />
            <span className="text-sm leading-relaxed text-slate">
              I am the parent or guardian, and I agree to {SITE.name}{" "}
              contacting me about this session.
            </span>
          </label>
          {errors.consent && (
            <p
              id="consent-error"
              role="alert"
              className="mt-1.5 text-sm text-red-600"
            >
              {errors.consent.message}
            </p>
          )}
        </div>

        <Honeypot register={register("company")} />
      </div>

      {status.kind === "error" && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {status.message}
        </p>
      )}

      <Button
        type="submit"
        variant="spark"
        size="lg"
        disabled={submitting}
        className="mt-7 w-full"
      >
        {submitting ? "Booking your seat…" : "Reserve my free seat"}
      </Button>

      <p className="mt-4 text-center text-xs leading-relaxed text-slate">
        We only collect your details, not your child&apos;s. Read our{" "}
        <a href="/privacy" className="underline hover:text-violet">
          privacy policy
        </a>
        .
      </p>
    </form>
  );
}
