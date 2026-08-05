import type { Route } from "next";
import { Container } from "@/components/ui/Container";
import { BackLink } from "@/components/ui/BackLink";
import { Breadcrumbs, type Crumb } from "@/components/seo/Breadcrumbs";

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
  /**
   * Trail after "Home". Supplying it adds a visible breadcrumb and emits
   * BreadcrumbList structured data; omit it and neither appears.
   */
  breadcrumbs?: Crumb[];
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
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <section className="border-b border-mist bg-mist/20 pt-[calc(var(--header-h)+2rem)] pb-14 sm:pt-[calc(var(--header-h)+3.5rem)] sm:pb-20">
      <Container size="default">
        {(showBack || breadcrumbs) && (
          <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            {showBack && (
              <BackLink fallbackHref={backHref} label={backLabel} />
            )}
            {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
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
