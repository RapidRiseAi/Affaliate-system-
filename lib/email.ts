import 'server-only';

import { adminSupabase } from '@/lib/supabase';

export type NotificationPreferenceKey =
  | 'application_updates'
  | 'agreement_updates'
  | 'referral_updates'
  | 'commission_created'
  | 'commission_status_updates'
  | 'commission_paid'
  | 'payout_summaries';

type Email = { to: string; subject: string; html: string };
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}
export async function sendEmail(email: Email) {
  if (!process.env.RESEND_API_KEY) {
    console.info('email_delivery_skipped', { code: 'provider_not_configured' });
    return { skipped: true };
  }
  const res = await fetch('https://api.resend.com/emails', { method:'POST', headers:{ Authorization:`Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type':'application/json' }, body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Rapid Rise AI <team@rapidriseai.com>', ...email }) });
  if (!res.ok) {
    const error = new Error('Email delivery failed') as Error & { code: string };
    error.code = `email_http_${res.status}`;
    throw error;
  }
  return res.json();
}

export async function notificationEnabled(
  authUserId: string,
  preference: NotificationPreferenceKey,
) {
  const { data, error } = await adminSupabase()
    .from('affiliate_portal_notification_preferences')
    .select(preference)
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  if (error) {
    console.error('notification_preference_lookup_failed', { code: error.code });
    return false;
  }
  return data ? (data as unknown as Record<string, boolean>)[preference] !== false : true;
}

export async function sendPortalNotification({
  authUserId,
  preference,
  subject,
  html,
}: {
  authUserId: string;
  preference: NotificationPreferenceKey;
  subject: string;
  html: string;
}) {
  if (!(await notificationEnabled(authUserId, preference))) {
    return { skipped: true, reason: 'disabled_by_user' };
  }
  const { data, error } = await adminSupabase().auth.admin.getUserById(authUserId);
  if (error || !data.user?.email) {
    console.error('notification_recipient_lookup_failed', { code: error?.code ?? 'missing_email' });
    return { skipped: true, reason: 'recipient_unavailable' };
  }
  return sendEmail({ to: data.user.email, subject, html });
}
