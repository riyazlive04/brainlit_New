import { cn } from "@/lib/cn";

/**
 * Small form primitives for the admin panel.
 *
 * Kept separate from the public site's Field component. The public forms are
 * conversion surfaces built for a nervous parent on a phone — generous spacing,
 * hints, careful error copy. These are working tools for someone entering their
 * fortieth record, where density beats hand-holding.
 */

const CONTROL =
  "w-full rounded-lg border border-mist bg-white px-3 py-2 text-base text-ink " +
  "transition-colors focus:outline-none focus-visible:border-violet sm:text-sm";

export function AdminField({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
  hint,
  min,
  max,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  min?: number;
  max?: number;
  className?: string;
}) {
  const id = `af-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-violet">*</span>}
      </label>
      {hint && <p className="mt-0.5 text-xs text-slate">{hint}</p>}
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        className={cn("mt-1.5", CONTROL)}
      />
    </div>
  );
}

export function AdminTextarea({
  label,
  name,
  defaultValue,
  rows = 3,
  required,
  /**
   * Matches AdminField, which has had one all along. Two textareas that differ
   * only in how long the writing should be — a card summary and a page-length
   * description — are indistinguishable without it.
   */
  hint,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  required?: boolean;
  hint?: string;
  className?: string;
}) {
  const id = `af-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-violet">*</span>}
      </label>
      {hint && <p className="mt-0.5 text-xs text-slate">{hint}</p>}
      <textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? undefined}
        required={required}
        className={cn("mt-1.5", CONTROL)}
      />
    </div>
  );
}

export function AdminCheckbox({
  label,
  name,
  defaultChecked,
  hint,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 shrink-0 rounded border-mist accent-violet"
      />
      <span>
        <span className="text-sm font-medium text-ink">{label}</span>
        {hint && <span className="block text-xs text-slate">{hint}</span>}
      </span>
    </label>
  );
}

export function AdminSubmit({ children = "Save" }: { children?: string }) {
  return (
    <button
      type="submit"
      className="min-h-10 rounded-full bg-brand-gradient px-6 py-2 text-sm font-semibold text-white transition-[filter] hover:brightness-110"
    >
      {children}
    </button>
  );
}

/**
 * Delete, as a button on the record's own edit form.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IT MUST NOT BE A `<form>`, AND IT USED TO BE ONE.
 *
 * Every caller renders this inside the edit form for the same record, so a
 * nested `<form>` is what came out — which HTML does not allow. The parser does
 * not error on it, it DROPS the inner form and re-parents its children, so the
 * button was left as an ordinary submit control of the outer form. Delete ran
 * save. It also mismatched at hydration, because React's tree still had the
 * nesting the DOM had just thrown away, and Next reported both.
 *
 * `formAction` is the mechanism HTML provides for exactly this: one form, one
 * set of fields, more than one thing that can be done with them. The `id` comes
 * from the hidden input the edit form already carries, which is why this takes
 * no `id` of its own — a second field of that name would be submitted on save
 * as well.
 *
 * THE COROLLARY: this only works INSIDE a form that carries the record's id.
 * Standing on its own it is a button attached to nothing.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function AdminDelete({ action }: { action: (form: FormData) => void }) {
  return (
    <button
      type="submit"
      formAction={action}
      /**
       * `formNoValidate`, because this button is inside the edit form and
       * therefore inherits its `required` fields. Without it the browser
       * refuses to delete a record whose title someone has just cleared —
       * blocking the one action that does not care what the fields say.
       */
      formNoValidate
      className="text-sm text-slate transition-colors hover:text-red-600"
    >
      Delete
    </button>
  );
}
