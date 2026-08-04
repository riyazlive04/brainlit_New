"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";

type BackLinkProps = {
  /** Where to go when there is no in-site history to return to. */
  fallbackHref?: Route;
  label?: string;
};

/**
 * "Back" control for interior pages.
 *
 * Rendered as a real <Link>, not a <button>, and enhanced with an onClick
 * rather than replaced by one. That ordering matters:
 *
 * · Without JavaScript, or before hydration, it is still a working link to the
 *   fallback. A back control that does nothing until React loads is worse than
 *   no back control.
 * · Middle-click and ctrl-click keep working, because it is genuinely a link.
 * · Screen readers announce it as a link to a real destination.
 *
 * With JavaScript, it prefers `router.back()` — but only when the previous page
 * was on this site. A naive `history.back()` on a page someone landed on from
 * Google or an ad sends them straight back to the search results, which is the
 * opposite of what "back" means to them and, on an ad landing page, is money
 * spent to bounce a visitor.
 */
export function BackLink({ fallbackHref = "/", label = "Back" }: BackLinkProps) {
  const router = useRouter();

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    // Let the browser handle modified clicks — new tab, new window, download.
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    let cameFromThisSite = false;
    try {
      cameFromThisSite =
        Boolean(document.referrer) &&
        new URL(document.referrer).origin === window.location.origin;
    } catch {
      // A malformed referrer is not worth failing over; fall through to the
      // link's own href.
      cameFromThisSite = false;
    }

    if (cameFromThisSite && window.history.length > 1) {
      event.preventDefault();
      router.back();
    }
    // Otherwise: do nothing, and let the <Link> navigate to the fallback.
  }

  return (
    <Link
      href={fallbackHref}
      onClick={handleClick}
      className="group inline-flex items-center gap-2 text-sm font-medium text-slate transition-colors hover:text-violet"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="transition-transform duration-200 group-hover:-translate-x-0.5"
      >
        <path d="M10 3 5 8l5 5" />
      </svg>
      {label}
    </Link>
  );
}
