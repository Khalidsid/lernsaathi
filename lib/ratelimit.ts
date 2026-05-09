type Bucket = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const buckets = new Map<string, Bucket>();

function checkWithConfig(key: string, maxRequests: number, windowMs: number) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const next = {
      count: 1,
      resetAt: now + windowMs,
    };
    buckets.set(key, next);
    return {
      allowed: true,
      remaining: maxRequests - next.count,
      resetAt: next.resetAt,
    };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;

  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}

export function checkRateLimit(ip: string) {
  return checkWithConfig(`ip:${ip}`, MAX_REQUESTS, WINDOW_MS);
}

export function checkUserRateLimit(userId: string) {
  return checkWithConfig(`user:${userId}`, MAX_REQUESTS, WINDOW_MS);
}
