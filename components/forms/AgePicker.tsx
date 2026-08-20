"use client";

import type { UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";

/**
 * Age selector, as a row of pills rather than a dropdown.
 *
 * A native <select> was the wrong control here. It renders as raw OS chrome
 * that ignores the design system entirely, it takes two taps on mobile (open,
 * then scroll and pick), and it hides every option until opened — so a parent
 * cannot see at a glance that this programme is aimed at their child's age.
 *
 * Pills show the whole range at once, take one tap, and make the 10–14 focus
 * legible without a word of explanation: the in-range ages are visually
 * emphasised, the ones either side are still selectable but quieter.
 *
 * Built on radio inputs, not buttons. Arrow keys move between options, the
 * group is announced as a group, and it submits without JavaScript. A div with
 * click handlers would give up all three.
 */

/**
 * The default spread. Wider than the programme's own 10-14 ON PURPOSE: a parent
 * of a nine-year-old can still register and be told honestly whether to wait,
 * which is what the "older or younger" FAQ promises.
 *
 * A caller can narrow it - /webinar does, because that page states 10-14 and
 * offering ages the copy does not serve is a contradiction a parent notices at
 * exactly the wrong moment.
 */
const DEFAULT_AGES = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

type AgePickerProps = {
  registration: UseFormRegisterReturn;
  error?: string;
  /** Shown under the legend */
  hint?: string;
  /** Overrides the default spread. Values outside it cannot be chosen. */
  ages?: readonly number[];
  required?: boolean;
};

export function AgePicker({
  registration,
  error,
  hint,
  required,
  ages = DEFAULT_AGES,
}: AgePickerProps) {
  const errorId = "child-age-error";
  const hintId = "child-age-hint";

  return (
    <fieldset
      aria-describedby={
        [error ? errorId : null, hint ? hintId : null]
          .filter(Boolean)
          .join(" ") || undefined
      }
    >
      <legend className="font-display text-sm font-medium text-ink">
        Your child&apos;s age
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-violet">
            *
          </span>
        )}
      </legend>

      {hint && (
        <p id={hintId} className="mt-1 text-xs text-slate">
          {hint}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {ages.map((age) => {
          const inRange =
            age >= SITE.ageRange.min && age <= SITE.ageRange.max;

          return (
            <label key={age} className="cursor-pointer">
              <input
                type="radio"
                value={age}
                {...registration}
                // Visually hidden but focusable, so the pill can be styled
                // while the radio keeps its keyboard and semantic behaviour.
                className="peer sr-only"
              />
              <span
                className={cn(
                  "grid h-11 min-w-11 place-items-center rounded-xl border px-3.5",
                  "text-[0.975rem] font-medium transition-colors",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-violet peer-focus-visible:ring-offset-2",
                  // Ages the programme is actually for read as the default
                  // choice; the rest stay available but quieter.
                  inRange
                    ? "border-mist bg-white text-ink hover:border-violet/50"
                    : "border-mist/70 bg-mist/20 text-slate hover:border-violet/40",
                  "peer-checked:border-violet peer-checked:bg-violet peer-checked:text-white",
                  error && "border-red-300",
                )}
              >
                {age}
              </span>
            </label>
          );
        })}
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
