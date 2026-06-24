import { NextResponse } from 'next/server';
import {
  logServerError,
  secretsMatch,
} from '@/lib/server-security';
import { adminSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const authorization = request.headers.get('authorization');
  const providedSecret = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null;
  if (!secretsMatch(providedSecret, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = adminSupabase();
  const now = new Date().toISOString();
  const [signatureExpiry, linkExpiry] = await Promise.all([
    supabase.rpc('affiliate_portal_expire_signature_requests'),
    supabase
      .from('affiliate_portal_tracking_links')
      .update({ is_active: false, updated_at: now })
      .eq('is_active', true)
      .lte('expires_at', now)
      .select('id'),
  ]);
  if (signatureExpiry.error) logServerError('affiliate_signature_expiry_failed', signatureExpiry.error);
  if (linkExpiry.error) logServerError('affiliate_link_expiry_failed', linkExpiry.error);
  const { data: applications, error: lookupError } = await supabase
    .from('affiliate_portal_partner_applications')
    .select('id,auth_user_id')
    .eq('status', 'declined')
    .lte('deletion_scheduled_at', new Date().toISOString())
    .limit(100);

  if (lookupError) {
    logServerError('affiliate_cleanup_lookup_failed', lookupError);
    return NextResponse.json({ declinedAccountsDeleted: 0, failed: 1 }, { status: 500 });
  }

  let processed = 0;
  let failed = 0;
  for (const application of applications ?? []) {
    const { data: mappedAffiliate } = await supabase
      .from('affiliate_portal_user_links')
      .select('affiliate_id')
      .eq('auth_user_id', application.auth_user_id)
      .not('affiliate_id', 'is', null)
      .maybeSingle();
    if (mappedAffiliate) {
      failed += 1;
      console.error('affiliate_cleanup_mapping_conflict', { code: 'mapped_user' });
      continue;
    }

    const { error: deletionError } = await supabase.auth.admin.deleteUser(
      application.auth_user_id,
    );
    if (deletionError) {
      failed += 1;
      logServerError('affiliate_cleanup_auth_delete_failed', deletionError);
      continue;
    }

    processed += 1;
    const { error: auditError } = await supabase
      .from('affiliate_portal_audit_events')
      .insert({
        action_type: 'delete_declined_auth_account',
        entity_type: 'affiliate_portal_partner_application',
        entity_id: application.id,
        new_value: { reason: 'deletion_schedule_elapsed' },
      });
    if (auditError) logServerError('affiliate_cleanup_audit_failed', auditError);
  }

  return NextResponse.json({
    declinedAccountsDeleted: processed,
    expiredSignatureRequests: signatureExpiry.data ?? 0,
    expiredTrackingLinks: linkExpiry.data?.length ?? 0,
    failed: failed + Number(Boolean(signatureExpiry.error)) + Number(Boolean(linkExpiry.error)),
  });
}
