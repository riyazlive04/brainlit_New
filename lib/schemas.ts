import { z } from "zod";
import { isValidIndianMobile, normalizeIndianMobile } from "@/lib/phone";

/**
 * Validation schemas, shared between the client form and the API route.
 *
 * The server re-validates with these same schemas. Client-side validation is a
 * convenience for the user; it is not a security control.
 */

/**
 * Indian mobile number.
 *
 * Normalised to exactly ten digits BEFORE validation, so the database holds one
 * canonical form. The UI restricts typing to ten digits behind a fixed +91
 * prefix, but this still accepts a pasted country code or leading zero —
 * validation must not depend on the UI having behaved, since the API is
 * reachable directly.
 */
const phone = z
  .string()
  .transform(normalizeIndianMobile)
  .refine(isValidIndianMobile, {
    message: "Enter a valid 10-digit mobile number, starting with 6–9",
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
    /**
     * Honeypot. Bots fill every field they find; humans never see this one.
     *
     * Deliberately NOT constrained to an empty string. A `max(0)` here makes
     * validation fail with `company: "Too big"`, which hands whoever wrote the
     * bot the exact field name that caught them — and returns a 400 instead of
     * the silent success that makes a honeypot worth having. The route checks
     * this field and quietly discards; the cap is only to bound the payload.
     */
    company: z.string().max(200).optional(),
  })
  .merge(utm);

/**
 * Two types per schema, and the distinction matters.
 *
 * `*FormValues` is what the FORM holds — before `.default()` fills anything in
 * and before `coerce` turns the age <select>'s string into a number.
 * `*Input` is what comes OUT of validation, and what the server works with.
 *
 * react-hook-form needs both: it types its fields from the former and its
 * submit handler from the latter.
 */
export type LeadFormValues = z.input<typeof leadSchema>;
export type LeadInput = z.output<typeof leadSchema>;

export const webinarRegistrationSchema = leadSchema.extend({
  source: z.literal("webinar").default("webinar"),
  sessionId: z.uuid().optional(),
  /**
   * Required here, optional on a general enquiry.
   *
   * The "prefer not to say" escape hatch was removed at the client's request.
   * Worth knowing the trade: every required field on a conversion form costs
   * some completions. It is bought back by being able to tell a parent
   * honestly, before they spend anything, whether their child is ready — which
   * is what the session promises.
   */
  // The `error` option is load-bearing: without it, omitting the field fails
  // the type check first and surfaces Zod's own "expected number, received
  // undefined" — which means nothing to a parent looking at a row of buttons.
  // The .min/.max messages only ever run once a number is actually present.
  childAge: z.coerce
    .number({ error: "Please choose your child's age" })
    .int()
    .min(6, "Please choose your child's age")
    .max(16, "Please choose your child's age"),
});

export type WebinarFormValues = z.input<typeof webinarRegistrationSchema>;
export type WebinarRegistrationInput = z.output<
  typeof webinarRegistrationSchema
>;

export const newsletterSchema = z.object({
  email: z.email("Enter a valid email address").max(160),
  /** Honeypot — see the note on `leadSchema.company`. */
  company: z.string().max(200).optional(),
});
