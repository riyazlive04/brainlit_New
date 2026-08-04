import { cn } from "@/lib/cn";

/**
 * Shared chrome for admin screens.
 *
 * The overview was redesigned first and the rest were left behind, so the panel
 * read as two different products. These primitives exist so a section cannot
 * drift again: page headers, cards, notices and empty states all come from one
 * place.
 */

export function AdminPageHeader({
  title,
  description,
  badge,
  action,
}: {
  title: string;
  description?: React.ReactNode;
  badge?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-[length:var(--text-h2)] text-ink">
            {title}
          </h1>
          {badge && (
            <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-medium text-slate">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-2 text-[0.95rem] leading-relaxed text-slate">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/**
 * A panel.
 *
 * `accent` puts a coloured bar across the top — used to mark the "add new"
 * panel on each screen, so the primary action is findable at a glance instead
 * of being one identical white box among several.
 */
export function AdminCard({
  title,
  description,
  accent,
  children,
  className,
}: {
  title?: string;
  description?: React.ReactNode;
  accent?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-mist bg-white",
        className,
      )}
    >
      {accent && <span className="block h-1 w-full bg-brand-gradient" />}
      {(title || description) && (
        <div className="border-b border-mist px-6 py-4">
          {title && (
            <h2 className="font-display font-semibold text-ink">{title}</h2>
          )}
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-slate">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="p-6">{children}</div>
    </section>
  );
}

/** A row in a list of editable records. */
export function AdminRecord({
  heading,
  meta,
  published,
  actions,
  children,
}: {
  heading: React.ReactNode;
  meta?: React.ReactNode;
  published?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-mist bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mist bg-mist/25 px-6 py-3.5">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
            <span className="truncate">{heading}</span>
            {published !== undefined && <PublishPill published={published} />}
          </p>
          {meta && <p className="mt-0.5 text-xs text-slate">{meta}</p>}
        </div>
        {actions}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export function PublishPill({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
        published
          ? "bg-violet/12 text-violet ring-1 ring-violet/25"
          : "bg-white text-slate ring-1 ring-mist",
      )}
    >
      {published ? "Live" : "Draft"}
    </span>
  );
}

/**
 * A notice.
 *
 * `warn` is reserved for things that are actually wrong or legally consequential
 * — a missing session, a consent requirement. If everything is yellow, nothing
 * is.
 */
export function AdminNotice({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border p-4",
        tone === "warn"
          ? "border-spark-deep/40 bg-spark/15"
          : "border-mist bg-mist/30",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
          tone === "warn" ? "bg-spark text-ink" : "bg-white text-slate",
        )}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d={tone === "warn" ? "M12 8v5M12 17h.01" : "M12 16v-5M12 8h.01"} />
        </svg>
      </span>
      <div className="text-sm leading-relaxed text-ink">{children}</div>
    </div>
  );
}

export function AdminEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-mist bg-white px-6 py-12 text-center">
      <p className="font-display font-semibold text-ink">{title}</p>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-[0.925rem] leading-relaxed text-slate">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Small heading above a list, with a count. */
export function AdminSectionHeading({
  children,
  count,
}: {
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <h2 className="mt-10 mb-4 flex items-center gap-2 font-display font-semibold text-ink">
      {children}
      {count !== undefined && (
        <span className="rounded-full bg-mist px-2 py-0.5 text-xs font-medium text-slate">
          {count}
        </span>
      )}
    </h2>
  );
}
