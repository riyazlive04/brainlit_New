"use client";

/**
 * Last-resort error boundary.
 *
 * Catches failures in the root layout itself, which is the one case the
 * route-level boundary cannot help with. Because the root layout is what
 * failed, this must render its own <html> and <body>.
 *
 * Styling is inline rather than Tailwind classes: if the root layout blew up,
 * the stylesheet it imports may not have loaded either, and an error page that
 * renders unstyled is only marginally better than a blank one.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          background: "#ffffff",
          color: "#0b1020",
        }}
      >
        <div style={{ maxWidth: "32rem", textAlign: "center" }}>
          <p
            style={{
              fontSize: "0.8125rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#854fb4",
              fontWeight: 600,
            }}
          >
            BrainLIT
          </p>

          <h1
            style={{
              marginTop: "1.5rem",
              fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            The site hit an unexpected problem.
          </h1>

          <p
            style={{
              marginTop: "1.25rem",
              fontSize: "1.0625rem",
              lineHeight: 1.7,
              color: "#4a5169",
            }}
          >
            Please try again. If it keeps happening, email{" "}
            {/* brainLit, not brainit — the domain has an L in it. Hard-coded
                rather than read from CONTACT_EMAIL in lib/legal.ts on purpose:
                this is the boundary that catches a failure in the root layout,
                so it imports as close to nothing as it can. That is exactly why
                the typo below survived — nothing links the two spellings. */}
            <a href="mailto:support@brainlit.in" style={{ color: "#854fb4" }}>
              support@brainlit.in
            </a>{" "}
            and we will help you directly.
          </p>

          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "2rem",
              padding: "0.875rem 2rem",
              fontSize: "1rem",
              fontWeight: 600,
              color: "#0b1020",
              background: "#fcd057",
              border: "none",
              borderRadius: "999px",
              cursor: "pointer",
              minHeight: "44px",
            }}
          >
            Try again
          </button>

          {error.digest && (
            <p
              style={{
                marginTop: "2rem",
                fontSize: "0.75rem",
                color: "#4a5169",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
