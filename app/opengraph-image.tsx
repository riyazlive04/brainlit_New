import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

/**
 * Default social share image.
 *
 * Generated rather than a static PNG so it stays in sync with the brand tokens
 * and never has to be re-exported by hand. Applies to every page that does not
 * define its own.
 *
 * Satori (which renders this) supports a subset of CSS: flexbox only, no
 * grid, and every element with more than one child needs an explicit display.
 * It also cannot load our webfonts without fetching the files, so this uses the
 * system sans — acceptable for an image nobody inspects closely.
 */
export const runtime = "edge";
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  // Precomputed as single strings. Satori counts each interpolation as a
  // separate child node, so `ages {min}–{max}` inside a plain <div> trips the
  // "more than one child needs explicit display" rule and the whole image
  // fails to render.
  const subline = `An AI Thinking Academy for ages ${SITE.ageRange.min}–${SITE.ageRange.max}. Live online, small batches.`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#ffffff",
          backgroundImage:
            "radial-gradient(circle at 82% 18%, rgba(198,142,220,0.30) 0%, transparent 55%)," +
            "radial-gradient(circle at 12% 78%, rgba(122,206,235,0.30) 0%, transparent 55%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              background: "linear-gradient(135deg, #3f5ba6 0%, #854fb4 100%)",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 34,
              fontWeight: 700,
              color: "#3f5ba6",
              letterSpacing: -0.5,
            }}
          >
            {SITE.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: -2.5,
              color: "#0b1020",
              maxWidth: 940,
            }}
          >
            {/* Must match the homepage <h1>. This is the image WhatsApp and
                Facebook show when the link is shared, and a share card that
                says something different from the page is a jarring arrival. */}
            {/* Literal capitals here, unlike the page, which does it in CSS.
                Satori renders to a flat PNG — there is no text layer for a
                screen reader or a search engine to misread, so the simpler
                thing is also the correct one. */}
            AI Literacy for NEXT GENERATION Thinkers and Leaders
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 30,
              color: "#4a5169",
              maxWidth: 820,
            }}
          >
            {subline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 24,
            color: "#854fb4",
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              background: "#f2a922",
              display: "flex",
            }}
          />
          brainlit.in
        </div>
      </div>
    ),
    size,
  );
}
