import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hasTrustedOrigin } from '@/lib/server-security';
import { adminSupabase, serverSupabase } from '@/lib/supabase';

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
});

export async function POST(req: Request) {
  if (!hasTrustedOrigin(req)) {
    return NextResponse.redirect(new URL('/partners/login?error=origin', req.url), 303);
  }
  const parsed = loginSchema.safeParse(Object.fromEntries(await req.formData()));
  if (!parsed.success) {
    return NextResponse.redirect(new URL('/partners/login?error=invalid', req.url), 303);
  }

  const supabase = await serverSupabase();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    return NextResponse.redirect(new URL('/partners/login?error=invalid', req.url), 303);
  }

  const { data: portalLink } = await adminSupabase()
    .from('affiliate_portal_user_links')
    .select('crm_user_id')
    .eq('auth_user_id', data.user.id)
    .not('crm_user_id', 'is', null)
    .maybeSingle();
  const destination = portalLink?.crm_user_id
    ? '/admin/affiliates'
    : '/affiliate/dashboard';

  return NextResponse.redirect(new URL(destination, req.url), 303);
}
