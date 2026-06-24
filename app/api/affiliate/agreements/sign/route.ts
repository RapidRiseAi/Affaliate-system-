import { NextResponse } from 'next/server';
import { z } from 'zod';
import { escapeHtml, sendPortalNotification } from '@/lib/email';
import { getAuthenticatedUser, getPortalAffiliateContext } from '@/lib/portal-auth';
import { hasTrustedOrigin, logServerError } from '@/lib/server-security';
import { adminSupabase } from '@/lib/supabase';

const pointSchema = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).strict();
const signSchema = z.object({
  agreement_id: z.string().uuid(),
  signer_name: z.string().trim().min(2).max(200),
  consent: z.literal(true),
  signature_strokes: z.array(z.array(pointSchema).min(2).max(1000)).min(1).max(200),
}).superRefine((value, context) => {
  const totalPoints = value.signature_strokes.reduce((total, stroke) => total + stroke.length, 0);
  if (totalPoints > 10000) context.addIssue({ code: 'custom', path: ['signature_strokes'], message: 'Signature drawing is too large.' });
});

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: 'Request origin was rejected.' }, { status: 403 });
  const authUser = await getAuthenticatedUser();
  if (!authUser) return NextResponse.json({ error: 'Sign in again before signing.' }, { status: 401 });
  const context = await getPortalAffiliateContext(authUser);
  if (!context) return NextResponse.json({ error: 'An active affiliate account is required.' }, { status: 403 });
  const parsed = signSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Check the signature details.' }, { status: 400 });

  const { data, error } = await adminSupabase().rpc('affiliate_portal_sign_agreement', {
    p_auth_user_id: authUser.id,
    p_agreement_id: parsed.data.agreement_id,
    p_signer_name: parsed.data.signer_name,
    p_signature_strokes: parsed.data.signature_strokes,
  });
  if (error) {
    logServerError('affiliate_agreement_sign_failed', error);
    const conflict = error.code === '23505' || error.code === '55000';
    return NextResponse.json({ error: conflict ? 'This agreement was already signed or is no longer available.' : 'The signature could not be secured. Refresh and try again.' }, { status: conflict ? 409 : 500 });
  }
  const result = data?.[0] as { agreement_sha256?: string } | undefined;
  try {
    await sendPortalNotification({
      authUserId: authUser.id,
      preference: 'agreement_updates',
      subject: 'Your Rapid Rise AI affiliate agreement is signed',
      html: `<h1>Agreement signed</h1><p>Hi ${escapeHtml(parsed.data.signer_name)},</p><p>Your affiliate agreement has been signed and activated.</p><p>Evidence hash: <code>${escapeHtml(result?.agreement_sha256 ?? 'Recorded in your portal')}</code></p>`,
    });
  } catch (emailError) {
    logServerError('affiliate_signature_confirmation_email_failed', emailError);
  }
  return NextResponse.json({ ok: true });
}
