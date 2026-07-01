import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser, getPortalAffiliateContext } from '@/lib/portal-auth';
import { hasTrustedOrigin, logServerError } from '@/lib/server-security';
import { adminSupabase } from '@/lib/supabase';

const schema = z.object({
  private_reference: z.string().trim().min(1).max(250),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const fail = () => NextResponse.redirect(new URL('/affiliate/links?error=update', req.url), 303);
  if (!hasTrustedOrigin(req)) return fail();
  const authUser = await getAuthenticatedUser();
  if (!authUser) return NextResponse.redirect(new URL('/partners/login', req.url), 303);
  const context = await getPortalAffiliateContext(authUser);
  if (!context) return NextResponse.redirect(new URL('/affiliate/dashboard', req.url), 303);

  const { id } = await params;
  const parsed = schema.safeParse(Object.fromEntries(await req.formData()));
  if (!parsed.success) return fail();

  const supabase = adminSupabase();
  const { error } = await supabase
    .from('affiliate_portal_tracking_links')
    .update({ private_reference: parsed.data.private_reference, notes: parsed.data.notes || null })
    .eq('id', id)
    .eq('affiliate_id', context.affiliate.id);
  if (error) {
    logServerError('affiliate_tracking_link_update_failed', error);
    return fail();
  }
  return NextResponse.redirect(new URL('/affiliate/links?updated=1', req.url), 303);
}
