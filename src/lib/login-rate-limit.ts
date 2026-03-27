/** In-memory login throttling (per Node process). Use Redis for multi-instance production. */
const buckets = new Map<string, number[]>();

export function checkLoginRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  const stamps = buckets.get(key)?.filter((t) => t > windowStart) ?? [];
  if (stamps.length >= maxAttempts) {
    buckets.set(key, stamps);
    return false;
  }
  stamps.push(now);
  buckets.set(key, stamps);
  return true;
}
