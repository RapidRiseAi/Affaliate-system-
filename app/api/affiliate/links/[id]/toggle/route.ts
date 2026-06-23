import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getPortalAffiliateContext } from '@/lib/portal-auth';
import { hasTrustedOrigin, logServerError, publicApiError } from '@/lib/server-security';
import { adminSupabase } from '@/lib/supabase';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasTrustedOrigin(req)) return publicApiError('invalid_origin', 403, 'Request origin was rejected.');
  const authUser = await getAuthenticatedUser();
  if (!authUser) return publicApiError('authentication_required', 401, 'Authentication required.');
  const context = await getPortalAffiliateContext(authUser);
  if (!context) return publicApiError('affiliate_required', 403, 'Active affiliate access required.');
  const { id } = await params;
  const supabase = adminSupabase();
  const { data: link, error: findError } = await supabase.from('affiliate_portal_tracking_links').select('id,is_active').eq('id', id).eq('affiliate_id', context.affiliate.id).maybeSingle();
  if (findError || !link) return publicApiError('tracking_link_not_found', 404, 'Tracking link was not found.');
  const { error } = await supabase.from('affiliate_portal_tracking_links').update({ is_active: !link.is_active }).eq('id', id).eq('affiliate_id', context.affiliate.id);
  if (error) {
    logServerError('affiliate_tracking_link_toggle_failed', error);
    return publicApiError('tracking_link_update_failed');
  }
  const { error: auditError } = await supabase.from('affiliate_portal_audit_events').insert({
    actor_auth_user_id: authUser.id,
    affiliate_id: context.affiliate.id,
    action_type: 'set_tracking_link_active',
    entity_type: 'affiliate_portal_tracking_link',
    entity_id: id,
    old_value: { is_active: link.is_active },
    new_value: { is_active: !link.is_active },
  });
  if (auditError) logServerError('affiliate_tracking_link_toggle_audit_failed', auditError);
  return NextResponse.redirect(new URL('/affiliate/links', req.url), 303);
}
