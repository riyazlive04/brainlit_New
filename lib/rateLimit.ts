import "server-only";

/**
 * In-memory, per-instance rate limiter.
 *
 * HONEST LIMITATION, read before relying on this.
 *
 * Serverless functions scale horizontally and this Map lives inside one
 * instance. Two requests routed to two instances each see an empty bucket, and
 * the counter resets whenever an instance is recycled. So this is a speed bump
 * against casual abuse and accidental double-submits — NOT a defence against a
 * determined attacker.
 *
 * That is a deliberate trade for launch: it costs nothing, adds no dependency,
 * and stops the common cases. Before running paid traffic at scale, move this
 * to Upstash Redis (or Vercel KV), which is shared across instances. The call
 * sites do not change — only the body of `checkRateLimit`.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Stop the Map growing without bound in a long-lived instance. */
const MAX_TRACKED_KEYS = 10_000;

export type RateLimitResult = {
  allowed: boolean;
  /** Seconds until the window resets, for a Retry-After header */
  retryAfter: number;
};

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    if (buckets.size >= MAX_TRACKED_KEYS) {
      // Cheapest safe eviction: drop everything already expired, and if that
      // frees nothing, clear the lot. Losing counters fails open, which for a
      // speed bump is the right direction to fail.
      for (const [k, v] of buckets) {
        if (now >= v.resetAt) buckets.delete(k);
      }
      if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
    }

    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  existing.count += 1;

  if (existing.count > limit) {
    return {
      allowed: false,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  return { allowed: true, retryAfter: 0 };
}

/**
 * Best-effort client IP.
 *
 * `x-forwarded-for` is a client-settable header and is only trustworthy because
 * Vercel's proxy overwrites it. Behind any other host, verify that assumption
 * before treating this as identity.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
