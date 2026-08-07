import { SITE } from "@/lib/site";

/**
 * Configuration for the legal pages.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THESE PAGES ARE DRAFTS. I am not a lawyer.
 *
 * They are written to describe accurately what this site actually does — what
 * it collects, where it sends it, and how a parent withdraws consent — which is
 * the part a lawyer cannot write for you and the part most template policies
 * get wrong. But they must be reviewed by someone qualified before launch,
 * particularly the children's-data and refund sections.
 *
 * `IS_DRAFT` renders a visible banner on every legal page. Flip it to false
 * once the text has been reviewed and approved. Do not remove the banner
 * before that: an unreviewed policy that looks final is worse than one that
 * announces itself as a draft.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const IS_DRAFT = true;

/** NEEDS INPUT — set to the date the reviewed text goes live. */
export const EFFECTIVE_DATE = "2026-08-04";

/**
 * NEEDS INPUT — the DPDP Act 2023 requires a published Data Protection Officer
 * or grievance contact that a parent can actually reach. A generic info@ address
 * does not satisfy this; it needs a named role.
 */
export const GRIEVANCE = {
  role: "Grievance Officer",
  name: SITE.founder,
  email: "privacy@brainlit.in",
};

export const CONTACT_EMAIL = "support@brainlit.in";

/**
 * NEEDS INPUT — commercial terms, which are the client's decision and not
 * something I should invent. The values below are placeholders chosen to be
 * conventional, not researched. Confirm every one before launch.
 */
export const REFUND_TERMS = {
  coolingOffDays: 7,
  sessionsAttendedLimit: 2,
  processingDays: "7–10 business days",
};

export const JURISDICTION = {
  city: SITE.city,
  state: "Tamil Nadu",
  country: "India",
};

/** Third parties that receive personal data, disclosed as DPDP requires. */
export const PROCESSORS = [
  {
    name: "Supabase",
    purpose: "Database and authentication",
    data: "Name, email, phone, enquiry details",
  },
  {
    name: "Vercel",
    purpose: "Website hosting and delivery",
    data: "IP address, request logs",
  },
  {
    name: "Resend",
    purpose: "Transactional email",
    data: "Name, email address",
  },
  {
    name: "Zoom",
    purpose: "Live session delivery",
    data: "Name, email address",
  },
  {
    name: "Google Analytics & Google Tag Manager",
    purpose: "Website analytics",
    data: "Usage data, device and approximate location — only with consent",
  },
  {
    name: "Meta Pixel",
    purpose: "Advertising measurement",
    data: "Usage data — only with consent, and never for ads directed at children",
  },
  {
    name: "WhatsApp (Meta)",
    purpose: "Parent enquiries and reminders",
    data: "Phone number, message content",
  },
];
