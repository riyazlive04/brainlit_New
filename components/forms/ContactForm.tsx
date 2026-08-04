"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, Honeypot } from "@/components/forms/Field";
import { phoneInputProps } from "@/components/forms/phoneInput";
import { Button } from "@/components/ui/Button";
import { leadSchema } from "@/lib/schemas";
import { readUtmParams, trackEvent } from "@/lib/analytics";
import { SITE } from "@/lib/site";
import type { LeadFormValues, LeadInput } from "@/lib/schemas";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "done" }
  | { kind: "error"; message: string };

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadFormValues, unknown, LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: { source: "contact", consent: false },
  });

  async function onSubmit(values: LeadInput) {
    setStatus({ kind: "submitting" });

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, ...readUtmParams() }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setStatus({
          kind: "error",
          message: data.error ?? "Something went wrong. Please try again.",
        });
        return;
      }

      trackEvent("lead_submit", { source: "contact" });
      setStatus({ kind: "done" });
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
      <div className="rounded-2xl border border-mist bg-white p-8">
        <h2 className="font-display text-[length:var(--text-h3)] text-ink">
          Thank you — we have your message.
        </h2>
        <p className="mt-3 text-[0.975rem] leading-relaxed text-slate">
          Someone from the team will get back to you. If it is urgent, WhatsApp
          is the fastest way to reach us.
        </p>
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
      <div className="space-y-5">
        <Field label="Your name" name="name" required error={errors.name?.message}>
          {(props) => (
            <input type="text" autoComplete="name" {...props} {...register("name")} />
          )}
        </Field>

        <Field label="Email" name="email" required error={errors.email?.message}>
          {(props) => (
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
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
          hint="10 digits."
          error={errors.phone?.message}
        >
          {(props) => (
            <input {...props} {...phoneInputProps(register("phone"))} />
          )}
        </Field>

        <Field
          label="Your child's age"
          name="childAge"
          hint="Optional."
          error={errors.childAge?.message}
        >
          {(props) => (
            <select {...props} defaultValue="" {...register("childAge")}>
              <option value="">Prefer not to say</option>
              {Array.from({ length: 11 }, (_, i) => i + 6).map((age) => (
                <option key={age} value={age}>
                  {age} years old
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field
          label="How can we help?"
          name="message"
          error={errors.message?.message}
        >
          {(props) => (
            <textarea rows={5} {...props} {...register("message")} />
          )}
        </Field>

        <div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0 rounded border-mist accent-violet"
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={
                errors.consent ? "contact-consent-error" : undefined
              }
              {...register("consent")}
            />
            <span className="text-sm leading-relaxed text-slate">
              I am the parent or guardian, and I agree to {SITE.name}{" "}
              contacting me about this enquiry.
            </span>
          </label>
          {errors.consent && (
            <p
              id="contact-consent-error"
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
        variant="solid"
        size="lg"
        disabled={submitting}
        className="mt-7 w-full"
      >
        {submitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
