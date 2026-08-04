"use client";

import { useRef } from "react";
import { updateLeadStatus } from "@/app/admin/actions";

const OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "registered", label: "Registered" },
  { value: "enrolled", label: "Enrolled" },
  { value: "lost", label: "Lost" },
] as const;

/**
 * Inline status change, saved on selection.
 *
 * Submits the surrounding form on change rather than offering a Save button.
 * Updating a lead's status is a single low-risk field that someone will do
 * dozens of times in a sitting; making each one a two-step interaction is how
 * a CRM stops being used and the statuses stop meaning anything.
 *
 * A plain <select> inside a <form> with a server action, so it still works
 * without JavaScript — the change handler is the enhancement.
 */
export function LeadStatusSelect({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={updateLeadStatus} className="flex gap-2">
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        onChange={() => formRef.current?.requestSubmit()}
        aria-label="Lead status"
        className="min-h-9 rounded-lg border border-mist bg-white px-2.5 py-1.5 text-sm text-ink transition-colors focus:outline-none focus-visible:border-violet"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {/* Visible only when JavaScript has not taken over. */}
      <noscript>
        <button
          type="submit"
          className="rounded-lg border border-mist px-2.5 py-1.5 text-sm"
        >
          Save
        </button>
      </noscript>
    </form>
  );
}
