import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hasTrustedOrigin } from '@/lib/server-security';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { serverSupabase } from '@/lib/supabase';

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
});

export async function POST(req: Request) {
  if (!hasTrustedOrigin(req)) {
    return NextResponse.redirect(new URL('/partners/login?error=origin', req.url), 303);
  }

  // Throttle password guessing: 10 attempts per IP per 5 minutes.
  const limit = await rateLimit(`login:${clientIp(req)}`, 10, 300);
  if (!limit.ok) {
    return NextResponse.redirect(new URL('/partners/login?error=rate', req.url), 303);
  }
  const parsed = loginSchema.safeParse(Object.fromEntries(await req.formData()));
  if (!parsed.success) {
    return NextResponse.redirect(new URL('/partners/login?error=invalid', req.url), 303);
  }

  const supabase = await serverSupabase();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    if (error?.code === 'email_not_confirmed') {
      return NextResponse.redirect(new URL('/partners/login?error=unverified', req.url), 303);
    }
    return NextResponse.redirect(new URL('/partners/login?error=invalid', req.url), 303);
  }

  return NextResponse.redirect(new URL('/affiliate/dashboard', req.url), 303);
}
