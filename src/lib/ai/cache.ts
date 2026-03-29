import { createHash } from "crypto";
import Redis from "ioredis";

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis === null) return null;
  if (redis !== undefined) return redis;
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    redis = null;
    return null;
  }
  try {
    const r = new Redis(url, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      enableReadyCheck: true,
    });
    redis = r;
    return r;
  } catch {
    redis = null;
    return null;
  }
}

export function generateCacheKey(input: object): string {
  return `ai:${createHash("md5").update(JSON.stringify(input)).digest("hex")}`;
}

export async function getCache(key: string): Promise<string | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    if (r.status !== "ready") {
      await r.connect().catch(() => null);
    }
    return await r.get(key);
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: string, ttlSeconds: number): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    if (r.status !== "ready") {
      await r.connect().catch(() => null);
    }
    await r.setex(key, ttlSeconds, value);
  } catch {
    // ignore cache write failures
  }
}

export async function clearCache(pattern: string = "ai:*"): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    if (r.status !== "ready") {
      await r.connect().catch(() => null);
    }
    const keys = await r.keys(pattern);
    if (keys.length > 0) {
      await r.del(...keys);
    }
  } catch {
    // ignore
  }
}

/** One-shot dedupe for cron reminders (e.g. avoid hourly duplicate emails). */
export async function trySetDedupeKey(key: string, ttlSeconds: number): Promise<boolean> {
  const r = getRedis();
  if (!r) {
    return true;
  }
  try {
    if (r.status !== "ready") {
      await r.connect().catch(() => null);
    }
    const res = await r.set(key, "1", "EX", ttlSeconds, "NX");
    return res === "OK";
  } catch {
    return true;
  }
}
