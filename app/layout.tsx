import type { Metadata, Viewport } from "next";
import { Outfit, Inter, Noto_Sans_Tamil, Fredoka } from "next/font/google";
import { SITE } from "@/lib/site";
import { Analytics } from "@/components/analytics/Analytics";
import { CookieConsent } from "@/components/consent/CookieConsent";
import { OrganizationSchema } from "@/components/seo/OrganizationSchema";
import "./globals.css";

/* Display face — rounded geometric, closest match to the BrainLIT wordmark */
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/* Body face — chosen for small-size legibility on mid-range Android screens */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/* Logo lockup only. The BrainLIT wordmark is a rounded geometric face and
   Fredoka is the closest available match — one weight, latin only, so the cost
   of matching the brand is a few kilobytes. */
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  display: "swap",
  weight: ["600"],
});

/* Loaded from day one: the audience is explicitly English- and Tamil-speaking,
   and multi-language is on the roadmap. Retrofitting a Tamil-capable face later
   would mean re-typesetting the entire site. */
const notoTamil = Noto_Sans_Tamil({
  variable: "--font-noto-tamil",
  subsets: ["tamil", "latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.legalName }],
  keywords: [
    "AI thinking academy",
    "critical thinking for children",
    "AI course for kids",
    "coding alternative for children",
    "AI education India",
    "Chennai",
  ],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    url: SITE.url,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  // Matches the page background so the Android browser chrome blends with the
  // site instead of framing it in a dark bar.
  themeColor: "#ffffff",
  /* Never lock zoom — pinch-zoom is an accessibility requirement (WCAG 1.4.4)
     and parents reading pricing on a phone will use it. */
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} ${notoTamil.variable} ${fredoka.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <OrganizationSchema />
        {children}
        {/* Both render nothing until there is something to render: Analytics
            waits for consent, the banner only appears if no choice is stored. */}
        <Analytics />
        <CookieConsent />
      </body>
    </html>
  );
}
