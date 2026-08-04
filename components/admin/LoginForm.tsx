"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, type ActionState } from "@/app/admin/actions";

function SubmitButton() {
  // useFormStatus must be called from a component INSIDE the form — it reads
  // the status of the form above it in the tree, so it returns nothing useful
  // if called in the same component that renders the <form>.
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 min-h-11 w-full rounded-full bg-brand-gradient px-6 py-3 font-display font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    signIn,
    null,
  );

  const inputClasses =
    "w-full rounded-xl border border-mist bg-white px-4 py-3 text-base text-ink " +
    "transition-colors focus:outline-none focus-visible:border-violet sm:text-[0.975rem]";

  return (
    <form action={formAction} className="mt-7">
      <input type="hidden" name="next" value={next} />

      <div className="space-y-4">
        <div>
          <label
            htmlFor="admin-email"
            className="block font-display text-sm font-medium text-ink"
          >
            Email
          </label>
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className={`mt-2 ${inputClasses}`}
          />
        </div>

        <div>
          <label
            htmlFor="admin-password"
            className="block font-display text-sm font-medium text-ink"
          >
            Password
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={`mt-2 ${inputClasses}`}
          />
        </div>
      </div>

      {state?.error && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
