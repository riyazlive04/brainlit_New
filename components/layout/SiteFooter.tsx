import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/brand/Wordmark";
import { SocialIcon } from "@/components/brand/SocialIcon";
import { CookieSettingsLink } from "@/components/consent/CookieSettingsLink";
import { COMMUNITY, PODCAST } from "@/content/home";
import {
  LEGAL_LINKS,
  NAV_LINKS,
  SITE,
  SOCIAL_LINKS,
  whatsappHref,
} from "@/lib/site";

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

  /**
   * The four accounts are NOT in this column — they are the icon row under the
   * wordmark. Listing them here as well would put every one of them on the page
   * twice, three lines apart.
   *
   * `PODCAST.channelUrl` stays its own entry and stays null. It is tempting to
   * point it at the YouTube channel in SOCIAL_LINKS and call the job done, but
   * this label claims there is a podcast there. @BrainLITofficial is the brand
   * channel; whether it carries the podcast is not something this file knows.
   */
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

            {/* ── Where we are, off this site ──────────────────────────────
                Under the wordmark rather than in the Connect column, because
                these are the BRAND's accounts and this is the brand's block —
                and because four marks in a row is a shape people already know
                how to read, which four more text links in a list of text links
                is not.

                44px targets, `size-11`. The text links elsewhere in this footer
                are 17px tall and under the tap floor; these are the first ones
                that are not, and the pattern is worth copying when the rest are
                fixed.

                The accessible name is on the LINK and the icon is aria-hidden.
                Doing it the other way round — a titled SVG inside a bare link —
                is what produces "Instagram Instagram" in a screen reader. */}
            <ul className="mt-6 flex flex-wrap items-center gap-1">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.key}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="grid size-11 place-items-center rounded-full transition-colors hover:bg-mist/70"
                  >
                    <SocialIcon network={social.key} className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
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
