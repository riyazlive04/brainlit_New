import type { Route } from "next";
import { Container } from "@/components/ui/Container";
import { BackLink } from "@/components/ui/BackLink";

type PageHeaderProps = {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  children?: React.ReactNode;
  /** Where the back control falls back to when there is no in-site history. */
  backHref?: Route;
  backLabel?: string;
  /** Set false to hide the back control entirely. */
  showBack?: boolean;
};

/**
 * Shared header for interior pages.
 *
 * Extra top padding clears the fixed site header, which is 4.5rem tall and
 * overlays the page rather than occupying space in the flow.
 */
export function PageHeader({
  eyebrow,
  title,
  lead,
  children,
  backHref = "/",
  backLabel = "Back",
  showBack = true,
}: PageHeaderProps) {
  return (
    <section className="border-b border-mist bg-mist/20 pt-[calc(var(--header-h)+2rem)] pb-14 sm:pt-[calc(var(--header-h)+3.5rem)] sm:pb-20">
      <Container size="default">
        {showBack && (
          <div className="mb-8">
            <BackLink fallbackHref={backHref} label={backLabel} />
          </div>
        )}

        {eyebrow && (
          <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-5 max-w-3xl text-[length:var(--text-h1)] text-ink">
          {title}
        </h1>
        {lead && (
          <p className="mt-6 max-w-2xl text-[length:var(--text-lead)] leading-relaxed text-slate">
            {lead}
          </p>
        )}
        {children}
      </Container>
    </section>
  );
}
