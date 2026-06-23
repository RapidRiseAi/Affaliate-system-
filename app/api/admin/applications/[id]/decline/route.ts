import { NextResponse } from 'next/server';
import { z } from 'zod';
import { escapeHtml, sendEmail } from '@/lib/email';
import { getAuthenticatedUser, getPortalAdminContext } from '@/lib/portal-auth';
import {
  hasTrustedOrigin,
  logServerError,
  publicApiError,
} from '@/lib/server-security';
import { adminSupabase } from '@/lib/supabase';

const paramsSchema = z.object({ id: z.string().uuid() });
const declineSchema = z.object({
  reason: z.string().trim().min(1).max(2000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasTrustedOrigin(req)) {
    return publicApiError('invalid_origin', 403, 'Request origin was rejected.');
  }

  const parsedParams = paramsSchema.safeParse(await params);
  const parsedForm = declineSchema.safeParse(Object.fromEntries(await req.formData()));
  if (!parsedParams.success || !parsedForm.success) {
    return publicApiError('invalid_decline', 400, 'Decline details are invalid.');
  }

  const authUser = await getAuthenticatedUser();
  if (!authUser) return publicApiError('authentication_required', 401, 'Authentication required.');
  const actor = await getPortalAdminContext(authUser);
  if (!actor) return publicApiError('admin_required', 403, 'CRM admin access required.');

  const supabase = adminSupabase();
  const { data: application, error: applicationError } = await supabase
    .from('affiliate_portal_partner_applications')
    .select('id,auth_user_id,first_name,email,status')
    .eq('id', parsedParams.data.id)
    .maybeSingle();

  if (applicationError) {
    logServerError('affiliate_decline_lookup_failed', applicationError);
    return publicApiError('decline_failed');
  }
  if (!application) return publicApiError('application_not_found', 404, 'Application not found.');
  if (application.status !== 'pending_review') {
    return publicApiError('already_reviewed', 409, 'Application has already been reviewed.');
  }

  const deletionScheduledAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const { error: updateError } = await supabase
    .from('affiliate_portal_partner_applications')
    .update({
      status: 'declined',
      rejection_reason: parsedForm.data.reason,
      reviewed_at: new Date().toISOString(),
      reviewed_by_crm_user_id: actor.crmUserId,
      deletion_scheduled_at: deletionScheduledAt,
    })
    .eq('id', parsedParams.data.id)
    .eq('status', 'pending_review');

  if (updateError) {
    logServerError('affiliate_decline_update_failed', updateError);
    return publicApiError('decline_failed');
  }

  const { error: auditError } = await supabase
    .from('affiliate_portal_audit_events')
    .insert({
      actor_auth_user_id: authUser.id,
      actor_crm_user_id: actor.crmUserId,
      action_type: 'decline_application',
      entity_type: 'affiliate_portal_partner_application',
      entity_id: parsedParams.data.id,
      new_value: {
        reason: parsedForm.data.reason,
        deletion_scheduled_at: deletionScheduledAt,
      },
    });
  if (auditError) logServerError('affiliate_decline_audit_failed', auditError);

  await Promise.allSettled([
    sendEmail({
      to: application.email,
      subject: 'Update on Your Rapid Rise AI Partner Application',
      html: `Hi ${escapeHtml(application.first_name)},<br/>Reason: ${escapeHtml(parsedForm.data.reason)}<br/>Access remains for 48 hours.`,
    }),
  ]);

  return NextResponse.redirect(new URL('/admin/affiliates/applicants', req.url), 303);
}
