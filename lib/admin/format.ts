/**
 * Small display helpers for the admin panel.
 */

/**
 * "3 minutes ago", "yesterday".
 *
 * A lead's age is the thing that decides whether to call now or later, and
 * "4 Aug, 8:47 pm" forces the reader to do that subtraction in their head every
 * single row. Absolute time is still shown on the leads table, where scanning a
 * column matters more than urgency.
 */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const seconds = Math.round((Date.now() - then) / 1000);

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["second", 60],
    ["minute", 60],
    ["hour", 24],
    ["day", 7],
    ["week", 4.35],
    ["month", 12],
    ["year", Number.POSITIVE_INFINITY],
  ];

  const formatter = new Intl.RelativeTimeFormat("en-IN", { numeric: "auto" });

  let value = seconds;
  for (const [unit, step] of units) {
    if (Math.abs(value) < step) {
      return formatter.format(-Math.round(value), unit);
    }
    value /= step;
  }

  return formatter.format(-Math.round(value), "year");
}

/** Two letters from a name, for the avatar. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Colour per funnel stage.
 *
 * Deliberately not a rainbow. Only two states carry a signal worth colouring:
 * `new` needs action, `lost` is closed. Everything between is neutral, so the
 * eye lands on the rows that need something doing.
 */
export const STATUS_STYLES: Record<string, string> = {
  new: "bg-spark/25 text-ink ring-1 ring-spark-deep/30",
  contacted: "bg-mist text-slate",
  registered: "bg-mist text-slate",
  enrolled: "bg-violet/12 text-violet ring-1 ring-violet/25",
  lost: "bg-transparent text-slate/70 ring-1 ring-mist",
};

export function statusStyle(status: string): string {
  return STATUS_STYLES[status] ?? "bg-mist text-slate";
}
