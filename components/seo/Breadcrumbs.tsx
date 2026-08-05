import Link from "next/link";
import type { Route } from "next";
import { SITE } from "@/lib/site";

export type Crumb = {
  label: string;
  /** Omit on the current page — the last crumb is never a link. */
  href?: Route;
};

/**
 * Breadcrumb trail, visible and marked up.
 *
 * Two jobs, and both need doing:
 *
 * 1. Google renders BreadcrumbList markup in place of the raw URL in search
 *    results — "BrainLIT › Programs › …" instead of brainlit.in/courses/…,
 *    which measurably improves click-through on deep pages.
 * 2. It orients a visitor who arrived from an ad on an interior page and has no
 *    idea what the rest of the site contains. That is most of the paid traffic
 *    this site will get.
 *
 * The URLs in the structured data are absolute, because Google requires it —
 * SITE.url resolves to whatever host this deployment is actually served from,
 * so a preview describes itself rather than claiming to be brainlit.in.
 *
 * `aria-current="page"` on the last item, and it is a <span> rather than a link
 * to nowhere.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const trail: Crumb[] = [{ label: "Home", href: "/" as Route }, ...items];

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.label,
      ...(crumb.href ? { item: `${SITE.url}${crumb.href}` } : {}),
    })),
  };

  return (
    <nav aria-label="Breadcrumb">
      <script
        type="application/ld+json"
        // Authored by us, not user input — nothing here can inject markup.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate">
        {trail.map((crumb, i) => {
          const isLast = i === trail.length - 1;

          return (
            <li key={crumb.label} className="flex items-center gap-2">
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="transition-colors hover:text-violet"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-ink">
                  {crumb.label}
                </span>
              )}

              {!isLast && (
                <span aria-hidden="true" className="text-slate/45">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
