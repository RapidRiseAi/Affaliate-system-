import 'server-only';

import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

type ErrorWithCode = { code?: unknown; name?: unknown };

// The portal's OWN serving origin — for auth callbacks (email verification,
// password reset). This is deliberately NOT NEXT_PUBLIC_SITE_URL: that points at
// the marketing website (so referral links resolve there), and sending auth
// links to the website would break verification + reset. Prefer an explicit
// NEXT_PUBLIC_PORTAL_URL, then the forwarded host the request actually arrived
// on, then the request URL origin.
export function portalOrigin(request: Request) {
  if (process.env.NEXT_PUBLIC_PORTAL_URL) {
    return process.env.NEXT_PUBLIC_PORTAL_URL.replace(/\/$/, '');
  }
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

export function hasTrustedOrigin(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin
    : requestOrigin;
  const origin = request.headers.get('origin');
  if (origin) return origin === configuredOrigin || origin === requestOrigin;

  const referer = request.headers.get('referer');
  if (!referer) return false;
  const refererOrigin = new URL(referer).origin;
  return refererOrigin === configuredOrigin || refererOrigin === requestOrigin;
}

export function logServerError(event: string, error: unknown) {
  const candidate = error && typeof error === 'object'
    ? error as ErrorWithCode
    : null;
  console.error(event, {
    code: typeof candidate?.code === 'string' ? candidate.code : 'unknown',
    type: typeof candidate?.name === 'string' ? candidate.name : 'unknown',
  });
}

export function publicApiError(
  code: string,
  status = 500,
  message = 'The request could not be completed.',
) {
  return NextResponse.json({ error: message, code }, { status });
}

export function secretsMatch(provided: string | null, expected: string | undefined) {
  if (!provided || !expected || expected.length < 32) return false;
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  return providedBytes.length === expectedBytes.length
    && timingSafeEqual(providedBytes, expectedBytes);
}
