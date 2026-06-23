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
  const { data: applications, error: lookupError } = await supabase
    .from('affiliate_portal_partner_applications')
    .select('id,auth_user_id')
    .eq('status', 'declined')
    .lte('deletion_scheduled_at', new Date().toISOString())
    .limit(100);

  if (lookupError) {
    logServerError('affiliate_cleanup_lookup_failed', lookupError);
    return NextResponse.json({ processed: 0, failed: 1 }, { status: 500 });
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

  return NextResponse.json({ processed, failed });
}
