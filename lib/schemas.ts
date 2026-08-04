import { z } from "zod";

/**
 * Validation schemas, shared between the client form and the API route.
 *
 * The server re-validates with these same schemas. Client-side validation is a
 * convenience for the user; it is not a security control.
 */

/** Indian mobile numbers: optional +91/0 prefix, then 10 digits starting 6–9. */
const PHONE_RE = /^(?:\+?91[-\s]?|0)?[6-9]\d{9}$/;

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => PHONE_RE.test(v), {
    message: "Enter a valid 10-digit Indian mobile number",
  });

const name = z
  .string()
  .trim()
  .min(2, "Please enter your name")
  .max(80, "That name is too long");

/**
 * UTM attribution. Captured server-side from the referring URL so ad spend can
 * be traced to enrolments. Length-capped because these arrive from the query
 * string and are attacker-controlled.
 */
const utm = z
  .object({
    utm_source: z.string().max(120).optional(),
    utm_medium: z.string().max(120).optional(),
    utm_campaign: z.string().max(160).optional(),
    utm_content: z.string().max(160).optional(),
  })
  .partial();

/**
 * DPDP Act 2023 note: we collect the PARENT's contact details. From the child
 * we store only a first name and an age — enough to personalise a conversation,
 * not enough to identify or contact a minor. Do not add child email or phone
 * fields here without a verifiable parental consent flow. See PLAN.md §10.
 */
export const leadSchema = z
  .object({
    name,
    email: z.email("Enter a valid email address").max(160),
    phone,
    childName: z
      .string()
      .trim()
      .max(60)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    childAge: z.coerce
      .number()
      .int()
      .min(6, "This program is designed for ages 10–14")
      .max(18, "This program is designed for ages 10–14")
      .optional(),
    message: z.string().trim().max(1200).optional(),
    consent: z
      .boolean()
      .refine((v) => v === true, {
        message: "Please confirm you are the parent or guardian",
      }),
    source: z
      .enum(["home", "webinar", "contact", "course", "footer"])
      .default("home"),
    /** Honeypot — must stay empty. Bots fill every field they find. */
    company: z.string().max(0).optional(),
  })
  .merge(utm);

export type LeadInput = z.infer<typeof leadSchema>;

export const webinarRegistrationSchema = leadSchema.extend({
  source: z.literal("webinar").default("webinar"),
  sessionId: z.uuid().optional(),
});

export type WebinarRegistrationInput = z.infer<
  typeof webinarRegistrationSchema
>;

export const newsletterSchema = z.object({
  email: z.email("Enter a valid email address").max(160),
  company: z.string().max(0).optional(),
});
