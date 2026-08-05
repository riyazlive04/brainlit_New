import type { PillarKey } from "@/lib/site";

/**
 * Iconography for the seven thinking skills.
 *
 * Hand-drawn on a 24px grid rather than pulled from an icon library. Three
 * reasons: a library is 40KB+ of tree-shaken JS for seven glyphs that never
 * change, none of the common sets has anything for "entrepreneurial mindset"
 * that is not a rocket or a lightbulb, and the geometry here matches the logo —
 * same round caps and same 1.5 stroke, so they sit with the wordmark instead of
 * next to it.
 *
 * Purely decorative: every icon sits beside its own visible heading, so they
 * are aria-hidden and carry no title. An icon that announces "critical
 * thinking" immediately before a heading reading "Critical Thinking" makes a
 * screen reader say it twice.
 */

const PATHS: Record<PillarKey, React.ReactNode> = {
  /* Magnifier — examine the answer before accepting it */
  "critical-thinking": (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.4 15.4L21 21" />
    </>
  ),

  /* Four-point spark — the "LIT" mark, and the only glyph that echoes it */
  creativity: (
    <path d="M12 3c0 4.5 1.5 6 4.5 6.6C13.5 10.2 12 11.7 12 16.2c0-4.5-1.5-6-4.5-6.6C10.5 9 12 7.5 12 3zM18.5 15.5c0 2.2.6 2.9 2 3.2-1.4.3-2 1-2 3.2 0-2.2-.6-2.9-2-3.2 1.4-.3 2-1 2-3.2z" />
  ),

  /* One square lifted out of four — break the hard thing into small things */
  "problem-solving": (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
      <path d="M14.5 7h6M17.5 4v6" />
    </>
  ),

  /* Rising line clearing a step — spot the problem, then climb it */
  "entrepreneurial-mindset": (
    <>
      <path d="M3 20.5h18" />
      <path d="M4 16l5-5 3.5 3.5L20 7" />
      <path d="M15.5 7H20v4.5" />
    </>
  ),

  /* Two overlapping bubbles — an idea that lands is an idea returned */
  communication: (
    <>
      <path d="M3.5 8.5a3 3 0 013-3h7a3 3 0 013 3v3a3 3 0 01-3 3H8l-4.5 3.5v-3.6a3 3 0 01-.03-.4z" />
      <path d="M16.5 10h1a3 3 0 013 3v2.5a3 3 0 01-2 2.8" />
    </>
  ),

  /* Shield with a check — know when to use it, and when not to */
  "ethical-ai": (
    <>
      <path d="M12 3l7.5 3v5.4c0 4.4-3 8.2-7.5 9.6-4.5-1.4-7.5-5.2-7.5-9.6V6z" />
      <path d="M9 11.8l2.2 2.2L15.5 9.7" />
    </>
  ),

  /* Folder holding finished work — leave with something you can show */
  portfolio: (
    <>
      <path d="M3.5 7.5a2 2 0 012-2h3.3a2 2 0 011.6.8l1 1.2h7.1a2 2 0 012 2v8a2 2 0 01-2 2h-13a2 2 0 01-2-2z" />
      <path d="M8.5 13.5h7" />
    </>
  ),
};

export function PillarIcon({
  pillar,
  className,
}: {
  pillar: PillarKey;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {PATHS[pillar]}
    </svg>
  );
}
