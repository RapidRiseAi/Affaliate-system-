import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hasTrustedOrigin, logServerError } from '@/lib/server-security';
import { getAuthenticatedUser } from '@/lib/portal-auth';
import { serverSupabase } from '@/lib/supabase';

const schema = z
  .object({
    password: z.string().min(8).max(128),
    confirm_password: z.string(),
  })
  .refine((value) => value.password === value.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export async function POST(req: Request) {
  const fail = (code: string) =>
    NextResponse.redirect(new URL(`/affiliate/reset-password?error=${code}`, req.url), 303);

  if (!hasTrustedOrigin(req)) return fail('origin');

  // The recovery link already created a session via /auth/callback. No valid
  // session means the link was never followed (or has expired) — send them back
  // to request a fresh one rather than silently failing.
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.redirect(new URL('/partners/forgot?error=expired', req.url), 303);
  }

  const parsed = schema.safeParse(Object.fromEntries(await req.formData()));
  if (!parsed.success) return fail('invalid');

  const supabase = await serverSupabase();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    logServerError('affiliate_password_update_failed', error);
    // Supabase rejects reuse of the current password and weak passwords here.
    return fail('weak');
  }

  return NextResponse.redirect(new URL('/partners/login?status=password-updated', req.url), 303);
}
