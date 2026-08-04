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
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  required?: boolean;
  className?: string;
}) {
  const id = `af-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-violet">*</span>}
      </label>
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

/** Destructive, so it asks first. */
export function AdminDelete({ id, action }: { id: string; action: (form: FormData) => void }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-sm text-slate transition-colors hover:text-red-600"
      >
        Delete
      </button>
    </form>
  );
}
