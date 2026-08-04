import { cn } from "@/lib/cn";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /**
   * Stagger for items revealed as a group, 0–100. Expressed as a scroll offset
   * rather than a time delay, because scroll-driven animations are positional:
   * there is no clock to delay against.
   */
  delay?: number;
  as?: "div" | "section" | "li" | "article";
};

/**
 * Fades and lifts content into view as it is scrolled to.
 *
 * A SERVER component. It ships no JavaScript at all — the animation is CSS
 * scroll-driven (see the `reveal` utility in globals.css).
 *
 * This was previously a client component running an IntersectionObserver per
 * instance. With roughly twenty on the homepage, that hydration work was
 * competing with the browser's attempt to paint the very text being revealed,
 * and Lighthouse attributed real render delay to it.
 *
 * Content is visible by default and always present in the DOM, so nothing here
 * can hide text from a crawler, a screen reader, or a browser that does not
 * support scroll-driven animation.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: RevealProps) {
  return (
    <Tag
      className={cn("reveal", className)}
      style={
        delay
          ? // Clamped: past ~30% the item would still be waiting to appear
            // well after the reader has arrived at it.
            ({
              "--reveal-start": `${Math.min(delay / 8, 30)}%`,
            } as React.CSSProperties)
          : undefined
      }
    >
      {children}
    </Tag>
  );
}
