import type { Metadata } from "next";
import Link from "next/link";
import { SmoothScrollMount } from "@/components/providers/SmoothScrollMount";

/**
 * Internal layout lab. Not part of the site.
 *
 * Four arrangements of the same copy over the same 3D scene, so the layout can
 * be judged by scrolling it rather than from a mockup.
 *
 * Delete this route before launch, or leave it — `noindex` keeps it out of
 * search either way.
 */
export const metadata: Metadata = {
  title: "Layout lab",
  robots: { index: false, follow: false },
};

const VARIANTS = [
  { href: "/lab/split", label: "1 · Split" },
  { href: "/lab/stacked", label: "2 · Stacked" },
  { href: "/lab/scrim", label: "3 · Scrim" },
  { href: "/lab/aside", label: "4 · Quiet aside" },
  { href: "/lab/dots", label: "Dot patterns" },
];

export default function LabLayout({ children }: LayoutProps<"/lab">) {
  return (
    <>
      <SmoothScrollMount />

      <nav
        aria-label="Layout variants"
        className="fixed inset-x-0 top-0 z-50 border-b border-mist bg-white/90 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-2.5">
          <Link
            href="/lab"
            className="mr-2 font-display text-sm font-semibold text-ink"
          >
            Layout lab
          </Link>
          {VARIANTS.map((v) => (
            <Link
              key={v.href}
              href={v.href}
              className="rounded-full px-3 py-1.5 text-sm text-slate transition-colors hover:bg-mist hover:text-ink"
            >
              {v.label}
            </Link>
          ))}
          <Link
            href="/"
            className="ml-auto rounded-full px-3 py-1.5 text-sm text-violet hover:underline"
          >
            ← Live site
          </Link>
        </div>
      </nav>

      <main className="pt-12">{children}</main>
    </>
  );
}
