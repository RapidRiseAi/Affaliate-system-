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

  // Neutral response either way: never reveal whether an email is registered.
  const done = NextResponse.redirect(new URL('/partners/forgot?status=sent', req.url), 303);

  // Limit reset-email requests: 5 per IP per 15 minutes (also curbs mail abuse).
  const limit = await rateLimit(`reset:${clientIp(req)}`, 5, 900);
  if (!limit.ok) return done;

  const parsed = schema.safeParse(Object.fromEntries(await req.formData()));
  if (!parsed.success) return done;

  const supabase = await serverSupabase();
  const base = portalOrigin(req);
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${base}/auth/callback?next=/affiliate/reset-password`,
  });
  if (error) logServerError('affiliate_password_reset_request_failed', error);
  return done;
}
