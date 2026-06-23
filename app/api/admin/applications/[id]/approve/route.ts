import { NextResponse } from 'next/server';
import { z } from 'zod';
import { escapeHtml, sendEmail } from '@/lib/email';
import { getAuthenticatedUser, getPortalAdminContext } from '@/lib/portal-auth';
import {
  hasTrustedOrigin,
  logServerError,
  publicApiError,
} from '@/lib/server-security';
import { serverSupabase } from '@/lib/supabase';

const paramsSchema = z.object({ id: z.string().uuid() });
const createApprovalSchema = z.object({
  approval_mode: z.literal('create'),
  new_tracking_code: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{3,39}$/),
  selected_affiliate_id: z.string().optional(),
});
const linkApprovalSchema = z.object({
  approval_mode: z.literal('link'),
  selected_affiliate_id: z.string().uuid(),
  new_tracking_code: z.string().optional(),
});
const approvalSchema = z.discriminatedUnion('approval_mode', [
  createApprovalSchema,
  linkApprovalSchema,
]);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasTrustedOrigin(req)) {
    return publicApiError('invalid_origin', 403, 'Request origin was rejected.');
  }

  const parsedParams = paramsSchema.safeParse(await params);
  const parsedForm = approvalSchema.safeParse(Object.fromEntries(await req.formData()));
  if (!parsedParams.success || !parsedForm.success) {
    return publicApiError('invalid_approval', 400, 'Approval details are invalid.');
  }

  const authUser = await getAuthenticatedUser();
  if (!authUser) return publicApiError('authentication_required', 401, 'Authentication required.');
  if (!await getPortalAdminContext(authUser)) {
    return publicApiError('admin_required', 403, 'CRM admin access required.');
  }

  const supabase = await serverSupabase();
  const payload = parsedForm.data;
  const { data, error } = await supabase.rpc('affiliate_portal_approve_application', {
    p_application_id: parsedParams.data.id,
    p_approval_mode: payload.approval_mode,
    p_selected_affiliate_id: payload.approval_mode === 'link'
      ? payload.selected_affiliate_id
      : null,
    p_new_tracking_code: payload.approval_mode === 'create'
      ? payload.new_tracking_code
      : null,
  });

  if (error || !data?.[0]) {
    logServerError('affiliate_approval_transaction_failed', error);
    return publicApiError(
      'approval_failed',
      409,
      'Approval could not be completed. Verify email ownership and the selected CRM affiliate.',
    );
  }

  const { data: application } = await supabase
    .from('affiliate_portal_partner_applications')
    .select('first_name,email')
    .eq('id', parsedParams.data.id)
    .maybeSingle();
  if (application) {
    await Promise.allSettled([
      sendEmail({
        to: application.email,
        subject: 'Your Rapid Rise AI Partner Application Was Approved',
        html: `Hi ${escapeHtml(application.first_name)},<br/>Your dashboard is now active.`,
      }),
    ]);
  }

  return NextResponse.redirect(new URL('/admin/affiliates/applicants', req.url), 303);
}
