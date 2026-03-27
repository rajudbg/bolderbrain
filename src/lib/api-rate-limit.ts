/** In-memory sliding window per key. For multi-instance production, use Redis. */
const buckets = new Map<string, number[]>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  const stamps = buckets.get(key)?.filter((t) => t > windowStart) ?? [];
  if (stamps.length >= maxRequests) {
    buckets.set(key, stamps);
    return false;
  }
  stamps.push(now);
  buckets.set(key, stamps);
  return true;
}
