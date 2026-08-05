import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/brand/Wordmark";
import { CookieSettingsLink } from "@/components/consent/CookieSettingsLink";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
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
    <footer className="mt-auto border-t border-mist bg-paper">
      <Container size="wide" className="py-16">
        {/* ------------------------------------------------------ Newsletter */}
        <div className="grid gap-8 border-b border-mist pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-center lg:gap-16">
          <div>
            <h2 className="font-display text-[length:var(--text-h3)] text-ink">
              The AI parenting newsletter
            </h2>
            <p className="mt-2.5 max-w-md text-[0.95rem] leading-relaxed text-slate">
              Once a week: what changed in AI, what it means for a child, and
              what to do about it. Unsubscribe in one click.
            </p>
          </div>
          <NewsletterForm source="footer" />
        </div>

        {/* ----------------------------------------------------------- Links */}
        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Wordmark />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate">
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
                    className="text-sm text-slate transition-colors hover:text-violet"
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
                      className="text-sm text-slate transition-colors hover:text-violet"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-slate transition-colors hover:text-violet"
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
                    className="text-sm text-slate transition-colors hover:text-violet"
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

        <div className="mt-12 flex flex-col gap-2 border-t border-mist pt-6 text-xs text-slate sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE.legalName}. All rights reserved.
          </p>
          <p>Made for curious minds in {SITE.city}.</p>
        </div>
      </Container>
    </footer>
  );
}
