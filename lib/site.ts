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
    "BrainLIT teaches children aged 10-14 to think before they use AI - building critical thinking, creativity, problem solving and ethical AI habits through live online programs.",
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
 * Where BrainLIT is, off this site.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE LIST, READ IN THREE PLACES: the footer's Connect column, the contact
 * page, and — the one that is easy to forget — `sameAs` in the Organization
 * schema. That last is not decoration. `sameAs` is how a search engine ties
 * this domain to those accounts and treats them as one entity, which is what
 * puts the right logo and the right profile links in a knowledge panel. A
 * social account the site links to but does not DECLARE is a relationship the
 * crawler has to guess at.
 *
 * Hard-coded rather than read from the environment, unlike WHATSAPP.number
 * below. These are public brand accounts, identical in every deployment, and a
 * preview build that silently drops them would be a worse failure than one that
 * shows them.
 *
 * THE WHATSAPP GROUP IS ONE OF THE FOUR, and it is defined here rather than in
 * content/home.ts even though a homepage section is built around it. It is one
 * URL with two jobs — an account to follow and the subject of a band of copy —
 * and a URL with two jobs written down twice is a URL that will eventually
 * disagree with itself. content/home.ts reads it from here; this file imports
 * nothing, so the dependency can only run in that direction.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export type SocialKey = "instagram" | "facebook" | "youtube" | "whatsapp";

export const SOCIAL_LINKS: readonly {
  key: SocialKey;
  label: string;
  href: string;
}[] = [
  {
    key: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/brainlit.kidsacademy/",
  },
  {
    key: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/brainlit.kidsacademy",
  },
  {
    key: "youtube",
    label: "YouTube",
    href: "https://www.youtube.com/@BrainLITofficial",
  },
  {
    key: "whatsapp",
    label: "WhatsApp community",
    // The environment still wins, so a fork or a preview can point the group
    // elsewhere without editing code. The literal is the real group, so a build
    // with nothing set links to it rather than hiding it.
    href:
      process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL ??
      "https://chat.whatsapp.com/FVIdUvaAgtjCuYpyvmzaEY",
  },
];

/** The group invite on its own, for the homepage band that is built round it. */
export const COMMUNITY_INVITE =
  SOCIAL_LINKS.find((link) => link.key === "whatsapp")?.href ?? null;

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
