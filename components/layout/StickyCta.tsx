"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { whatsappHref } from "@/lib/site";
import { cn } from "@/lib/cn";

/**
 * Mobile-only sticky call to action.
 *
 * Most of this audience arrives on a phone from an ad and scrolls a long page.
 * Without this, the only route to the webinar is scrolling back to the hero or
 * all the way to the footer, and a conversion that requires hunting is a
 * conversion lost.
 *
 * Hidden until the hero has scrolled away so it never covers the primary CTA
 * while that CTA is still on screen.
 */
export function StickyCta() {
  const [visible, setVisible] = useState(false);
  const whatsapp = whatsappHref();

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.9);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-mist bg-white/95 backdrop-blur-md transition-transform duration-300 lg:hidden",
        "[transition-timing-function:var(--ease-out-expo)]",
        // pb keeps the bar clear of the iOS home indicator and Android gesture bar
        "px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        visible ? "translate-y-0" : "translate-y-full",
      )}
      // Inert while off-screen, so a hidden bar never takes a tab stop or gets
      // announced to a screen reader.
      aria-hidden={!visible}
      inert={!visible}
    >
      <div className="flex items-center gap-2">
        <Button href="/webinar" variant="spark" size="md" className="flex-1">
          Join the free webinar
        </Button>
        {whatsapp && (
          <Button href={whatsapp} external variant="outline" size="md">
            WhatsApp
          </Button>
        )}
      </div>
    </div>
  );
}
