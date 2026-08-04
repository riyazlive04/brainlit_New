/**
 * Instant skeleton for every admin screen.
 *
 * This is the single biggest perceived-speed fix in the panel. Admin pages are
 * force-dynamic and each makes several Supabase round trips at ~250ms apiece, so
 * there was close to a second where clicking a nav item did nothing visible —
 * the browser kept showing the previous page and the click felt ignored.
 *
 * With a loading file, Next renders this the instant the navigation starts and
 * streams the real content in behind it. The total time is unchanged; the
 * experience is completely different, because the interface responds
 * immediately and shows the shape of what is coming.
 *
 * It also makes Next's link prefetching useful: for a dynamic route, the
 * prefetch fetches the loading state, so it is already in place on click.
 */
function Bar({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-mist ${className}`} />
  );
}

export default function AdminLoading() {
  return (
    // Announced politely rather than silently: a screen reader user gets "Loading"
    // instead of nothing happening after they activate a link.
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>

      <Bar className="h-9 w-56" />
      <Bar className="mt-3 h-4 w-72" />

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-mist bg-white"
          >
            <div className="h-1 w-full bg-mist" />
            <div className="p-5">
              <Bar className="h-4 w-28" />
              <Bar className="mt-3 h-9 w-16" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-mist bg-white p-5">
        <div className="flex gap-3">
          <Bar className="size-8 shrink-0 rounded-full" />
          <div className="flex-1">
            <Bar className="h-4 w-40" />
            <Bar className="mt-2 h-3 w-full max-w-md" />
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-mist bg-white">
        <div className="border-b border-mist px-5 py-4">
          <Bar className="h-4 w-32" />
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-mist px-5 py-4 last:border-0">
            <Bar className="size-9 shrink-0 rounded-full" />
            <div className="flex-1">
              <Bar className="h-4 w-36" />
              <Bar className="mt-2 h-3 w-56" />
            </div>
            <Bar className="hidden h-6 w-16 rounded-full sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
