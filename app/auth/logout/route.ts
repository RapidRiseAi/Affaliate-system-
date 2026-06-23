import { NextResponse } from 'next/server';
import { hasTrustedOrigin, publicApiError } from '@/lib/server-security';
import { serverSupabase } from '@/lib/supabase';

export async function POST(req: Request) {
  if (!hasTrustedOrigin(req)) return publicApiError('invalid_origin', 403, 'Request origin was rejected.');
  const supabase = await serverSupabase();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/partners/login', req.url), 303);
}
