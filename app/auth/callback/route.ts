import { NextResponse } from 'next/server';
import { logServerError } from '@/lib/server-security';
import { serverSupabase } from '@/lib/supabase';

// Only allow same-site relative paths as a post-exchange destination so the
// `next` parameter can never be turned into an open redirect.
function safeNext(raw: string | null) {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
    return null;
  }
  return raw;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeNext(url.searchParams.get('next'));
  if (!code) {
    return NextResponse.redirect(new URL('/partners/login?error=verification', url));
  }

  const supabase = await serverSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    logServerError('affiliate_email_verification_failed', error);
    return NextResponse.redirect(new URL('/partners/login?error=verification', url));
  }

  return NextResponse.redirect(new URL(next ?? '/affiliate/dashboard?verified=1', url));
}
