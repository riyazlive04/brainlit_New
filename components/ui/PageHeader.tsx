import { Container } from "@/components/ui/Container";

type PageHeaderProps = {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  children?: React.ReactNode;
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
}: PageHeaderProps) {
  return (
    <section className="border-b border-mist bg-mist/20 pt-[calc(var(--header-h)+3rem)] pb-14 sm:pt-[calc(var(--header-h)+5rem)] sm:pb-20">
      <Container size="default">
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
