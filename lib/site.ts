/**
 * Site-wide configuration.
 *
 * Anything the marketing team may want to change often (WhatsApp number, next
 * webinar date) moves to the `site_settings` table in Phase 2 so it is editable
 * without a deploy. Until then it lives here.
 */

/**
 * The origin this deployment is actually served from.
 *
 * Order matters. An explicit NEXT_PUBLIC_SITE_URL always wins, so production
 * can be pinned to the real domain. Otherwise Vercel's own variables are used,
 * which means a preview deployment describes ITSELF in its canonical URLs, OG
 * tags and sitemap rather than claiming to be brainlit.in — a preview that
 * points every canonical at the live domain is how a staging copy ends up
 * competing with production in search results.
 *
 * PRODUCTION_URL is the stable project domain; VERCEL_URL changes on every
 * single deployment, so it is only the last resort.
 */
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;

  const productionHost = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (productionHost) return `https://${productionHost}`;

  const deploymentHost = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (deploymentHost) return `https://${deploymentHost}`;

  return "http://localhost:3003";
}

/** True only when this deployment is serving the real customer-facing domain. */
export const IS_CANONICAL_HOST = resolveSiteUrl().includes("brainlit.in");

export const SITE = {
  /**
   * Canonical spelling: "BrainLIT" everywhere — logo lockup, page titles,
   * prose, structured data. The supplied artwork renders it "Brainlit"; the
   * written form was confirmed as correct, so the artwork is the outlier and
   * should be updated by the designer.
   */
  name: "BrainLIT",
  /** Used in <title> templates and structured data */
  legalName: "BrainLIT",
  tagline: "AI Thinking Academy for children",
  description:
    "BrainLIT teaches children aged 10–14 to think before they use AI — building critical thinking, creativity, problem solving and ethical AI habits through live online programs.",
  url: resolveSiteUrl(),
  locale: "en_IN",
  ageRange: { min: 10, max: 14 },
  founder: "Haja Najmudeen",
  city: "Chennai",
  country: "IN",
} as const;

/** Primary navigation — Phase 1 routes only. */
export const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/courses", label: "Programs" },
  { href: "/webinar", label: "Free Webinar" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/refund", label: "Refund Policy" },
] as const;

/**
 * The seven pillars of the BrainLIT curriculum.
 * Each one lights a node in the 3D neural-pathway sequence, so the order here
 * drives the order of the animation.
 */
export const PILLARS = [
  {
    key: "critical-thinking",
    title: "Critical Thinking",
    blurb: "Question the answer before accepting it.",
  },
  {
    key: "creativity",
    title: "Creativity",
    blurb: "Make something that did not exist this morning.",
  },
  {
    key: "problem-solving",
    title: "Problem Solving",
    blurb: "Break a hard thing into small solvable things.",
  },
  {
    key: "entrepreneurial-mindset",
    title: "Entrepreneurial Mindset",
    blurb: "Spot a real problem worth solving.",
  },
  {
    key: "communication",
    title: "Communication",
    blurb: "Explain an idea so it lands.",
  },
  {
    key: "ethical-ai",
    title: "Ethical AI Usage",
    blurb: "How to use AI responsibly and Ethically  with our data",
  },
  {
    key: "portfolio",
    title: "Portfolio Building",
    blurb: "Leave with a portfolio of your work and what you are capable of.",
  },
] as const;

/** Drives the icon lookup in components/brand/PillarIcon.tsx. */
export type PillarKey = (typeof PILLARS)[number]["key"];

/**
 * WhatsApp deep link. Number is a placeholder until the client supplies the
 * real business number — see PLAN.md §12.
 */
export const WHATSAPP = {
  /** International format, digits only, no + */
  number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  defaultMessage:
    "Hi BrainLIT, I would like to know more about your AI Thinking programs for my child.",
} as const;

export function whatsappHref(message: string = WHATSAPP.defaultMessage) {
  if (!WHATSAPP.number) return null;
  return `https://wa.me/${WHATSAPP.number}?text=${encodeURIComponent(message)}`;
}
