type Bucket = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const buckets = new Map<string, Bucket>();

export function checkRateLimit(ip: string) {
  const now = Date.now();
  const existing = buckets.get(ip);

  if (!existing || existing.resetAt <= now) {
    const next = {
      count: 1,
      resetAt: now + WINDOW_MS,
    };
    buckets.set(ip, next);
    return {
      allowed: true,
      remaining: MAX_REQUESTS - next.count,
      resetAt: next.resetAt,
    };
  }

  if (existing.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;

  return {
    allowed: true,
    remaining: MAX_REQUESTS - existing.count,
    resetAt: existing.resetAt,
  };
}
