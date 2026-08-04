import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SmoothScrollMount } from "@/components/providers/SmoothScrollMount";

/**
 * Shell for all standard marketing pages.
 *
 * `/webinar` deliberately sits OUTSIDE this group: an ad landing page converts
 * better with no global navigation competing with its single call to action.
 */
export default function MarketingLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <>
      {/* Skip link — first tab stop, lets keyboard users bypass the nav */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>

      <SmoothScrollMount />
      <SiteHeader />

      <main id="main" className="flex-1">
        {children}
      </main>

      <SiteFooter />
    </>
  );
}
