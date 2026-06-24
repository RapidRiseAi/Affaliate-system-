import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/portal-auth';
import { hasTrustedOrigin, logServerError } from '@/lib/server-security';
import { serverSupabase } from '@/lib/supabase';

const preferencesSchema = z.object({
  application_updates: z.boolean(),
  agreement_updates: z.boolean(),
  referral_updates: z.boolean(),
  commission_created: z.boolean(),
  commission_status_updates: z.boolean(),
  commission_paid: z.boolean(),
  payout_summaries: z.boolean(),
}).strict();

export async function PUT(request: Request) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: 'Request origin was rejected.' }, { status: 403 });
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Sign in again to save your choices.' }, { status: 401 });
  const parsed = preferencesSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Check the notification choices.' }, { status: 400 });
  const supabase = await serverSupabase();
  const { error } = await supabase.from('affiliate_portal_notification_preferences').upsert({ auth_user_id: user.id, ...parsed.data }, { onConflict: 'auth_user_id' });
  if (error) {
    logServerError('notification_preferences_save_failed', error);
    return NextResponse.json({ error: 'Notification choices could not be saved.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
