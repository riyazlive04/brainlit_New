/**
 * Indian mobile number handling.
 *
 * Numbers are stored as exactly ten digits, with no country code, no spaces and
 * no punctuation. One canonical form means a lookup by phone number actually
 * finds the parent, and WhatsApp links can be built reliably — a table holding
 * "+91 98765 43210", "09876543210" and "9876543210" as three different values
 * is three different people as far as any query is concerned.
 */

/**
 * Reduces anything a parent might type or paste to ten digits.
 *
 * Handles the realistic paste cases: a number copied from WhatsApp
 * ("+91 98765 43210"), from a contact card ("091-98765-43210"), or typed with
 * the country code already included. Stripping non-digits alone is not enough —
 * that turns "+919876543210" into twelve digits, and naively truncating to the
 * first ten would silently produce a wrong number.
 */
export function normalizeIndianMobile(raw: string): string {
  let digits = raw.replace(/\D/g, "");

  // Country code, with or without a leading 0 before it.
  if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  // A lone trunk prefix.
  if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);

  return digits.slice(0, 10);
}

/** Indian mobile numbers are ten digits and never start below 6. */
export const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;

export function isValidIndianMobile(value: string): boolean {
  return INDIAN_MOBILE_RE.test(value);
}

/** Ten stored digits -> the form WhatsApp and international dialling expect. */
export function toInternational(tenDigits: string): string {
  return `91${tenDigits}`;
}
