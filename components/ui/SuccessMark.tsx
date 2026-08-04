import { cn } from "@/lib/cn";

/**
 * Animated confirmation mark.
 *
 * Four things happen in sequence rather than at once: the disc pops in with a
 * slight overshoot, a ring expands away from it, the tick draws itself, and
 * only then does the text arrive. Simultaneous animation reads as a page swap;
 * a sequence reads as an event.
 *
 * The expanding ring is the same gesture as the click ripple in the 3D scene,
 * on purpose — one product, not two unrelated effects.
 *
 * Pure CSS. No animation library on the critical conversion path, and the
 * global prefers-reduced-motion rule flattens every one of these to near-zero
 * duration without any extra handling here.
 */
export function SuccessMark({ className }: { className?: string }) {
  return (
    <div className={cn("relative mx-auto size-14", className)}>
      {/* Expanding ring. Behind the disc and non-interactive. */}
      <span
        aria-hidden="true"
        className="success-ring absolute inset-0 rounded-full bg-spark"
      />

      <span className="success-mark relative grid size-14 place-items-center rounded-full bg-spark shadow-[0_8px_24px_-8px_rgba(252,208,87,0.9)]">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0b1020"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path className="success-check" d="M20 6 9 17l-5-5" />
        </svg>
      </span>
    </div>
  );
}
