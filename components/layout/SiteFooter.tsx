import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/brand/Wordmark";
import { CookieSettingsLink } from "@/components/consent/CookieSettingsLink";
import { COMMUNITY, PODCAST } from "@/content/home";
import { LEGAL_LINKS, NAV_LINKS, SITE, whatsappHref } from "@/lib/site";

/**
 * Site footer.
 *
 * Every link here points at something that exists. Columns and individual
 * entries drop out when their destination is not configured — a "Podcast" link
 * to nothing, or a WhatsApp community with no invite URL, is a broken promise
 * in the most-crawled part of the site.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();
  const whatsapp = whatsappHref();

  const connect = [
    PODCAST.channelUrl && {
      href: PODCAST.channelUrl,
      label: "Podcast on YouTube",
      external: true,
    },
    COMMUNITY.inviteUrl && {
      href: COMMUNITY.inviteUrl,
      label: "Parent community",
      external: true,
    },
    whatsapp && { href: whatsapp, label: "Chat on WhatsApp", external: true },
    { href: "/contact", label: "Contact us", external: false },
  ].filter(Boolean) as { href: string; label: string; external: boolean }[];

  return (
    // `relative z-10` is not decorative. The homepage mounts a `fixed inset-0
    // z-0` canvas that never unmounts, and a positioned z-0 element paints
    // above a static one no matter where it sits in the document. Every
    // marketing section carries this pair for that reason; the footer did not,
    // so the canvas covered it and swallowed every click in here.
    <footer className="relative z-10 mt-auto border-t border-mist bg-paper">
      <Container size="wide" className="py-16">
        {/* ----------------------------------------------------------- Links */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Wordmark />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink">
              {SITE.description}
            </p>
            <p className="mt-4 font-display text-sm font-medium text-indigo">
              We don&apos;t teach children to depend on AI.
              <br />
              We teach them to think so they can lead AI.
            </p>
          </div>

          <nav aria-label="Footer">
            <h2 className="font-display text-sm font-semibold tracking-wide text-ink uppercase">
              Explore
            </h2>
            <ul className="mt-4 space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink transition-colors hover:text-violet"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-display text-sm font-semibold tracking-wide text-ink uppercase">
              Connect
            </h2>
            <ul className="mt-4 space-y-2.5">
              {connect.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-ink transition-colors hover:text-violet"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-ink transition-colors hover:text-violet"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold tracking-wide text-ink uppercase">
              Legal
            </h2>
            <ul className="mt-4 space-y-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink transition-colors hover:text-violet"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                {/* Withdrawing consent must be as easy as giving it — DPDP
                    requires it, and the Privacy Policy promises it. */}
                <CookieSettingsLink />
              </li>
            </ul>
          </div>
        </div>

        {/* Three items rather than two, so the build credit gets its own slot
            at the end of the row instead of being tacked onto the Chennai line.
            They stack in source order on a phone.

            `items-center` rather than `items-baseline` because the build credit
            is deliberately larger than the other two — see below. On baselines
            the size difference would drag the whole row's alignment around; on
            centres the three read as one line with one item emphasised. */}
        <div className="mt-12 flex flex-col gap-2 border-t border-mist pt-6 text-xs text-ink sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p>
            © {year} {SITE.legalName}. All rights reserved.
          </p>
          <p>Made for curious {SITE.city} minds </p>
          {/* Only the studio name is the link — "Developed by" is not part of
              the click target, and a two-word target is easier to hit than a
              four-word one on a phone.

              Set larger than the two credits beside it, on purpose: the lead-in
              at `text-sm` and the studio name a step above that at `text-base`.
              A build credit that matched the copyright line would be invisible,
              which is the one thing it cannot be — and the size step within the
              sentence puts the weight on the name rather than on "Developed by".

              The larger name also lifts the tap target well past the 44px floor
              the rest of this row still sits under. */}
          <p className="text-sm">
            Developed by{" "}
            <a
              href="https://sirahdigital.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-semibold text-ink transition-colors hover:text-violet"
            >
              Sirah Digital
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
}
