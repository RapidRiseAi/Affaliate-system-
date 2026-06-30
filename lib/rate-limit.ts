import 'server-only';

// Lightweight fixed-window rate limiter backed by Upstash Redis over its REST
// API. Implemented with plain fetch so there is no extra npm dependency and it
// runs anywhere (Edge or Node serverless).
//
// Configure with two env vars (Upstash console → REST API):
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
//
// FAIL-OPEN by design: if Upstash is not configured or is unreachable, requests
// are allowed. A limiter outage must never lock every partner out of signing in.
// It is defence-in-depth on top of Supabase Auth's own throttling, not the only
// gate.

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let warnedUnconfigured = false;

export type RateLimitResult = { ok: boolean; remaining: number };

/**
 * Increment a fixed-window counter for `key` and report whether the caller is
 * still under `limit` within `windowSeconds`.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  if (!REST_URL || !REST_TOKEN) {
    if (!warnedUnconfigured) {
      console.info('rate_limit_disabled', { code: 'upstash_not_configured' });
      warnedUnconfigured = true;
    }
    return { ok: true, remaining: limit };
  }

  // Bucket the key into the current window so the counter resets cleanly.
  const windowMs = windowSeconds * 1000;
  const redisKey = `rl:${key}`;

  try {
    // One pipelined round-trip: INCR the counter, and set its TTL only if it
    // does not already have one (NX) so the window stays fixed from first hit.
    const response = await fetch(`${REST_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', redisKey],
        ['PEXPIRE', redisKey, windowMs, 'NX'],
      ]),
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('rate_limit_backend_error', { code: `http_${response.status}` });
      return { ok: true, remaining: limit };
    }

    const results = (await response.json()) as Array<{ result?: number; error?: string }>;
    const count = Number(results?.[0]?.result ?? 0);
    if (!Number.isFinite(count) || count <= 0) return { ok: true, remaining: limit };

    return { ok: count <= limit, remaining: Math.max(0, limit - count) };
  } catch (error) {
    console.error('rate_limit_unavailable', {
      code: error instanceof Error ? error.name : 'unknown',
    });
    return { ok: true, remaining: limit };
  }
}

/** Best-effort client IP from the proxy headers Vercel/most hosts set. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}
