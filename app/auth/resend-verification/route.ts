import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hasTrustedOrigin, logServerError, portalOrigin } from '@/lib/server-security';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { serverSupabase } from '@/lib/supabase';

const schema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});

export async function POST(req: Request) {
  if (!hasTrustedOrigin(req)) {
    return NextResponse.redirect(new URL('/partners/forgot?error=origin', req.url), 303);
  }

  // Neutral response: do not disclose whether the address has a pending signup.
  const done = NextResponse.redirect(new URL('/partners/forgot?status=resent', req.url), 303);

  // Limit verification resends: 5 per IP per 15 minutes.
  const limit = await rateLimit(`resend:${clientIp(req)}`, 5, 900);
  if (!limit.ok) return done;

  const parsed = schema.safeParse(Object.fromEntries(await req.formData()));
  if (!parsed.success) return done;

  const supabase = await serverSupabase();
  const base = portalOrigin(req);
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: parsed.data.email,
    options: { emailRedirectTo: `${base}/auth/callback` },
  });
  if (error) logServerError('affiliate_resend_verification_failed', error);
  return done;
}
