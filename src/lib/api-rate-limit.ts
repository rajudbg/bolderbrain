/** In-memory sliding window per key. For multi-instance production, use Redis. */
const buckets = new Map<string, number[]>();
const MAX_KEYS = 10_000;

/** Check if a request is within rate limits.
 * For multi-instance production deployments, replace this with a Redis-based rate limiter.
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Evict stale buckets if memory grows too large
  if (buckets.size > MAX_KEYS) {
    for (const k of buckets.keys()) {
      const stamps = buckets.get(k)?.filter((t) => t > windowStart) ?? [];
      if (stamps.length === 0) buckets.delete(k);
      if (buckets.size <= MAX_KEYS) break;
    }
  }

  const stamps = buckets.get(key)?.filter((t) => t > windowStart) ?? [];
  if (stamps.length >= maxRequests) {
    buckets.set(key, stamps);
    return false;
  }
  stamps.push(now);
  buckets.set(key, stamps);
  return true;
}

/** Clear all entries for a key (useful for testing). */
export function clearRateLimit(key: string) {
  buckets.delete(key);
}
