import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { hasTrustedOrigin, logServerError } from '@/lib/server-security';
import { serverSupabase } from '@/lib/supabase';

const ALLOWED_TYPES = new Set<EmailOtpType>([
  'recovery',
  'email',
  'signup',
  'magiclink',
  'email_change',
  'invite',
]);

function safeNext(raw: string) {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
    return null;
  }
  return raw;
}

// POST target for the /auth/confirm interstitial. Verification happens here, on a
// deliberate button press, so link prefetchers (mobile browsers, mail scanners)
// can never consume the single-use token by silently GETting the email link.
export async function POST(req: Request) {
  const fail = (target: string) => NextResponse.redirect(new URL(target, req.url), 303);
  if (!hasTrustedOrigin(req)) return fail('/partners/login?error=verification');

  const form = Object.fromEntries(await req.formData());
  const tokenHash = String(form.token_hash ?? '');
  const type = String(form.type ?? '') as EmailOtpType;
  const next = safeNext(String(form.next ?? ''));

  if (!tokenHash || !ALLOWED_TYPES.has(type)) {
    return fail('/partners/login?error=verification');
  }

  const supabase = await serverSupabase();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) {
    logServerError('affiliate_verify_otp_failed', error);
    // A genuinely expired/used token for recovery → send back to request a new one.
    return fail(
      type === 'recovery'
        ? '/partners/forgot?error=expired'
        : '/partners/login?error=verification',
    );
  }

  return fail(next ?? '/affiliate/dashboard?verified=1');
}
