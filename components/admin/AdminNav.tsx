"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/sessions", label: "Webinars" },
  { href: "/admin/programs", label: "Programmes" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/projects", label: "Student work" },
  { href: "/admin/settings", label: "Settings" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  // The login screen has no navigation to offer.
  if (pathname === "/admin/login") return null;

  return (
    <nav
      aria-label="Admin"
      // Scrolls horizontally rather than wrapping: seven items wrapping to two
      // rows on a phone pushes the actual content below the fold.
      className="mx-auto max-w-7xl overflow-x-auto px-5 sm:px-8"
    >
      <ul className="flex min-w-max gap-1 pb-2">
        {LINKS.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                // Prefetch on hover. For a dynamic route this fetches the
                // loading skeleton, so a click paints instantly instead of
                // waiting on the first server round trip.
                prefetch
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-mist text-ink"
                    : "text-slate hover:bg-mist/60 hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
