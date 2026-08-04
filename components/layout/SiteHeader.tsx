"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { NAV_LINKS } from "@/lib/site";
import { cn } from "@/lib/cn";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Solid background only once the user leaves the hero, so the 3D scene is
  // unobstructed at the top of the page.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu on navigation — otherwise it stays open over the new page.
  // Adjusted during render rather than in an effect: an effect would paint the
  // new page with the menu still open for one frame, and React flags the
  // cascading render. This also covers back/forward, which an onClick would not.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  // Escape closes the menu — expected of any modal surface.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300",
        scrolled || menuOpen
          ? "bg-white/85 shadow-[0_1px_0_0_rgba(11,16,32,0.06)] backdrop-blur-md"
          : "bg-transparent",
      )}
      style={{ height: "var(--header-h)" }}
    >
      <Container size="wide" className="flex h-full items-center justify-between">
        <Wordmark />

        {/* Desktop navigation */}
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-[0.925rem] font-medium transition-colors",
                  active
                    ? "text-violet"
                    : "text-slate hover:bg-mist/70 hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button href="/webinar" variant="spark" size="sm" className="hidden sm:inline-flex">
            Join free webinar
          </Button>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-mist/70 lg:hidden"
          >
            <span className="relative block h-3.5 w-5">
              <span
                className={cn(
                  "absolute left-0 block h-0.5 w-5 rounded bg-current transition-transform duration-300",
                  menuOpen ? "top-1.5 rotate-45" : "top-0",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-1.5 block h-0.5 w-5 rounded bg-current transition-opacity duration-200",
                  menuOpen ? "opacity-0" : "opacity-100",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 block h-0.5 w-5 rounded bg-current transition-transform duration-300",
                  menuOpen ? "top-1.5 -rotate-45" : "top-3",
                )}
              />
            </span>
          </button>
        </div>
      </Container>

      {/* Mobile navigation panel */}
      <div
        id="mobile-nav"
        hidden={!menuOpen}
        className="border-t border-mist bg-white/95 backdrop-blur-md lg:hidden"
      >
        <Container size="wide" className="flex flex-col gap-1 py-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={cn(
                "rounded-xl px-4 py-3 text-base font-medium transition-colors",
                pathname === link.href
                  ? "bg-mist/70 text-violet"
                  : "text-ink hover:bg-mist/60",
              )}
            >
              {link.label}
            </Link>
          ))}
          <Button href="/webinar" variant="spark" size="md" className="mt-2 w-full">
            Join free webinar
          </Button>
        </Container>
      </div>
    </header>
  );
}
