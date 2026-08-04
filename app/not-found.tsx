import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/brand/Wordmark";
import { NAV_LINKS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/**
 * 404.
 *
 * Lives at the app root rather than inside (marketing) so it also covers URLs
 * that match no route group at all — a mistyped /webinarr, an old link from an
 * ad, a stale share. Those are exactly the cases a 404 exists for, and a 404
 * scoped to one route group would miss them.
 *
 * It carries onward links rather than apologising. A parent who lands here from
 * a broken ad link is a lead you have already paid for; a dead end throws that
 * away.
 */
export default function NotFound() {
  return (
    <main className="flex flex-1 items-center py-24">
      <Container size="narrow" className="text-center">
        <Wordmark href="/" className="mx-auto" />

        <p className="mt-12 font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
          Error 404
        </p>

        <h1 className="mt-5 text-[length:var(--text-h1)] text-ink">
          This page has gone missing.
        </h1>

        <p className="mx-auto mt-6 max-w-lg text-[length:var(--text-lead)] leading-relaxed text-slate">
          The link may be out of date, or we may have moved something. Here is
          the way back.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href="/webinar" variant="spark" size="lg">
            Join the free webinar
          </Button>
          <Button href="/" variant="outline" size="lg">
            Go to the homepage
          </Button>
        </div>

        <nav aria-label="Site" className="mt-14">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-slate transition-colors hover:text-violet"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </main>
  );
}
