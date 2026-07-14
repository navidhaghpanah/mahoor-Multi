// Minimal in-memory per-IP rate limiter for serverless functions.
// Not distributed (each warm lambda instance has its own counters), so this
// is a soft ceiling, not a hard guarantee — but it raises the bar enormously
// against casual abuse/quota-draining of Gemini-backed endpoints, which cost
// money per call, with zero added infrastructure.
import type { NextRequest } from 'next/server';

const buckets = new Map<string, { count: number; resetAt: number }>();

// Periodic cleanup so the map doesn't grow unbounded across a long-lived
// warm instance (best-effort; a cold start clears it anyway).
function sweep(now: number) {
  if (buckets.size < 2000) return;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Fixed-window limiter. Returns true if the request is ALLOWED,
 * false if it should be rejected (429).
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}
