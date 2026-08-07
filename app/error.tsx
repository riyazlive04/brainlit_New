"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { whatsappHref } from "@/lib/site";

/**
 * Route-level error boundary.
 *
 * Shows a recovery path, never the error. A stack trace or database message on
 * screen is both useless to a parent and a genuine information leak — Postgres
 * errors carry table and constraint names.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const whatsapp = whatsappHref(
    "Hi BrainLIT, I hit an error on your website and could not complete what I was doing.",
  );

  useEffect(() => {
    // Next strips the message in production and leaves only `digest`, which is
    // the handle for correlating this with the server log. Logging it here is
    // what makes a user's "it broke" report traceable.
    console.error("[error boundary]", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="flex flex-1 items-center py-24">
      <Container size="narrow" className="text-center">
        <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
          Something went wrong
        </p>

        <h1 className="mt-5 text-[length:var(--text-h1)] text-ink">
          That did not work as it should have.
        </h1>

        <p className="mx-auto mt-6 max-w-lg text-[length:var(--text-lead)] leading-relaxed text-slate">
          The fault is ours, not yours. Try again - and if it keeps happening,
          tell us and we will sort it out directly.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button type="button" variant="spark" size="lg" onClick={reset}>
            Try again
          </Button>
          {whatsapp ? (
            <Button href={whatsapp} external variant="outline" size="lg">
              Tell us on WhatsApp
            </Button>
          ) : (
            <Button href="/contact" variant="outline" size="lg">
              Contact us
            </Button>
          )}
        </div>

        {error.digest && (
          <p className="mt-10 text-xs text-slate">
            Reference: <code>{error.digest}</code>
          </p>
        )}
      </Container>
    </main>
  );
}
