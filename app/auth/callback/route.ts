import { NextResponse } from 'next/server';
import { logServerError } from '@/lib/server-security';
import { serverSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/partners/login?error=verification', url));
  }

  const supabase = await serverSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    logServerError('affiliate_email_verification_failed', error);
    return NextResponse.redirect(new URL('/partners/login?error=verification', url));
  }

  return NextResponse.redirect(new URL('/affiliate/dashboard?verified=1', url));
}
