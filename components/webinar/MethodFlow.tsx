import { cn } from "@/lib/cn";

/**
 * The seven-step method, as a readable sequence.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE COMPONENT, USED TWICE, WITH DIFFERENT WORDS.
 *
 * The method and the worked example are the same seven beats: the method names
 * them in the abstract, the example makes them concrete. Drawing them as two
 * separate diagrams put the same shape on screen twice in a row and made the
 * page feel longer without saying more. Same component, different `steps`, so
 * a change to the shape changes both.
 *
 * NOT AN <ol> OF ARROWS. A screen reader reading "Real-world problem, arrow,
 * Think, arrow" is being read punctuation. The arrows are decorative and hidden;
 * the list is an ordered list, which is what conveys the sequence.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function MethodFlow({
  steps,
  tone = "default",
}: {
  steps: readonly string[];
  /** `accent` for the coloured panel in the method section. */
  tone?: "default" | "accent";
}) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
      {steps.map((step, i) => (
        <li key={step} className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium",
              tone === "accent"
                ? "bg-white/90 text-ink ring-1 ring-white/60"
                : "bg-mist/50 text-ink ring-1 ring-mist",
            )}
          >
            {step}
          </span>
          {i < steps.length - 1 && (
            <span
              aria-hidden="true"
              className={cn(
                "text-sm",
                tone === "accent" ? "text-white/70" : "text-slate/60",
              )}
            >
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
