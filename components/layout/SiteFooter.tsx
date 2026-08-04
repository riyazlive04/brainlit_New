import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/brand/Wordmark";
import { LEGAL_LINKS, NAV_LINKS, SITE, whatsappHref } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const whatsapp = whatsappHref();

  return (
    <footer className="mt-auto border-t border-mist bg-paper">
      <Container size="wide" className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
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
            </ul>

            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex text-sm font-medium text-violet hover:underline"
              >
                Chat on WhatsApp
              </a>
            )}
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
