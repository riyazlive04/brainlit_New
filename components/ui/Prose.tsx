import { cn } from "@/lib/cn";

/**
 * Long-form text styling for legal and editorial pages.
 *
 * Hand-rolled rather than @tailwindcss/typography: the plugin brings its own
 * opinionated scale that would need overriding on nearly every element to match
 * this design system, and it is another dependency in a project whose audience
 * is on mobile data.
 */
export function Prose({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-none text-[1.0125rem] leading-[1.75] text-slate",
        "[&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-[length:var(--text-h3)] [&_h2]:text-ink",
        "[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-display [&_h3]:text-[1.0625rem] [&_h3]:font-semibold [&_h3]:text-ink",
        "[&_p]:mt-4",
        "[&_ul]:mt-4 [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul>li]:list-disc [&_ul>li]:marker:text-violet",
        "[&_ol]:mt-4 [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol>li]:list-decimal [&_ol>li]:marker:text-violet",
        "[&_a]:text-violet [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:no-underline",
        "[&_strong]:font-semibold [&_strong]:text-ink",
        "[&_table]:mt-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[0.925rem]",
        "[&_th]:border-b [&_th]:border-mist [&_th]:py-2.5 [&_th]:pr-4 [&_th]:text-left [&_th]:font-display [&_th]:font-semibold [&_th]:text-ink",
        "[&_td]:border-b [&_td]:border-mist [&_td]:py-2.5 [&_td]:pr-4 [&_td]:align-top",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Banner shown on unreviewed legal text.
 *
 * Deliberately loud. A policy that has not been through legal review must not
 * be mistaken for one that has — by a visitor, a regulator, or by whoever picks
 * this project up next.
 */
export function DraftNotice() {
  return (
    <div
      role="note"
      className="mb-10 rounded-2xl border border-spark-deep/40 bg-spark/15 p-5"
    >
      <p className="font-display text-sm font-semibold text-ink">
        Draft - pending legal review
      </p>
      <p className="mt-1.5 text-[0.925rem] leading-relaxed text-slate">
        This document describes how the site actually handles data, but it has
        not yet been reviewed by a qualified legal professional. It must be
        before launch. Remove this notice by setting{" "}
        <code className="rounded bg-white/70 px-1.5 py-0.5 text-[0.85em]">
          IS_DRAFT
        </code>{" "}
        to false in <code className="text-[0.85em]">lib/legal.ts</code>.
      </p>
    </div>
  );
}
