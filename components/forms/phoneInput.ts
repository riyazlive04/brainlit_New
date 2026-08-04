"use client";

import type { UseFormRegisterReturn } from "react-hook-form";
import { normalizeIndianMobile } from "@/lib/phone";

/**
 * Makes a phone field accept only a ten-digit Indian mobile number.
 *
 * Rejecting bad input on submit is not enough. A parent who types their number
 * with a country code, gets an error, and has to work out what the form wanted
 * is a parent who may not bother — and this form is the entire conversion path.
 * Far better that the wrong thing cannot be typed at all.
 *
 * Wraps react-hook-form's own onChange rather than replacing it: the value is
 * normalised on the element first, then handed to RHF, so validation and the
 * displayed text can never disagree.
 *
 * `maxLength` alone would not do this. It caps length but still permits letters
 * and punctuation, and it truncates a pasted "+919876543210" to the first ten
 * characters — silently producing a completely different, wrong number.
 * `normalizeIndianMobile` strips the country code before truncating.
 */
export function phoneInputProps(registration: UseFormRegisterReturn) {
  return {
    ...registration,
    type: "tel" as const,
    // Numeric keypad on mobile, without the +*# of a full phone pad.
    inputMode: "numeric" as const,
    autoComplete: "tel-national" as const,
    maxLength: 10,
    placeholder: "98765 43210",
    onChange(event: React.ChangeEvent<HTMLInputElement>) {
      event.target.value = normalizeIndianMobile(event.target.value);
      return registration.onChange(event);
    },
  };
}
