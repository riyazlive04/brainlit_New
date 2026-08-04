import { cn } from "@/lib/cn";

/**
 * Form field primitives.
 *
 * Errors are wired with `aria-invalid` and `aria-describedby` and announced via
 * `role="alert"`. A red border alone tells a screen reader user nothing, and
 * tells a colour-blind user very little — which on a lead form means a parent
 * who cannot work out why their registration will not submit, and leaves.
 */

type FieldProps = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
    className: string;
  }) => React.ReactNode;
};

const CONTROL_CLASSES =
  "w-full rounded-xl border bg-white px-4 py-3 text-[0.975rem] text-ink " +
  "placeholder:text-slate/60 transition-colors " +
  // 16px minimum on mobile, otherwise iOS Safari zooms the whole page on focus
  "text-base sm:text-[0.975rem] " +
  "focus:outline-none focus-visible:border-violet";

export function Field({
  label,
  name,
  error,
  hint,
  required,
  children,
}: FieldProps) {
  const id = `field-${name}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div>
      <label
        htmlFor={id}
        className="block font-display text-sm font-medium text-ink"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-violet">
            *
          </span>
        )}
      </label>

      {hint && (
        <p id={hintId} className="mt-1 text-xs text-slate">
          {hint}
        </p>
      )}

      <div className="mt-2">
        {children({
          id,
          "aria-invalid": Boolean(error),
          "aria-describedby": describedBy,
          className: cn(
            CONTROL_CLASSES,
            error ? "border-red-500" : "border-mist hover:border-slate/40",
          ),
        })}
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function Honeypot({
  register,
}: {
  register: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label htmlFor="field-company">Company</label>
      <input
        id="field-company"
        type="text"
        // Not `display:none` — some bots skip hidden inputs. Off-screen but
        // still in the layout catches more of them.
        tabIndex={-1}
        autoComplete="off"
        {...register}
      />
    </div>
  );
}
