import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getPortalAffiliateContext } from '@/lib/portal-auth';
import { hasTrustedOrigin, logServerError } from '@/lib/server-security';
import { adminSupabase } from '@/lib/supabase';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const fail = () => NextResponse.redirect(new URL('/affiliate/links?error=update', req.url), 303);
  if (!hasTrustedOrigin(req)) return fail();
  const authUser = await getAuthenticatedUser();
  if (!authUser) return NextResponse.redirect(new URL('/partners/login', req.url), 303);
  const context = await getPortalAffiliateContext(authUser);
  if (!context) return NextResponse.redirect(new URL('/affiliate/dashboard', req.url), 303);

  const { id } = await params;
  const supabase = adminSupabase();
  // Click/session/attribution rows reference the link with ON DELETE SET NULL,
  // so deleting a link preserves attribution history (the references just null out).
  const { error } = await supabase
    .from('affiliate_portal_tracking_links')
    .delete()
    .eq('id', id)
    .eq('affiliate_id', context.affiliate.id);
  if (error) {
    logServerError('affiliate_tracking_link_delete_failed', error);
    return fail();
  }
  const { error: auditError } = await supabase.from('affiliate_portal_audit_events').insert({
    actor_auth_user_id: authUser.id,
    affiliate_id: context.affiliate.id,
    action_type: 'delete_tracking_link',
    entity_type: 'affiliate_portal_tracking_link',
    entity_id: id,
    new_value: { deleted: true },
  });
  if (auditError) logServerError('affiliate_tracking_link_delete_audit_failed', auditError);
  return NextResponse.redirect(new URL('/affiliate/links?deleted=1', req.url), 303);
}
