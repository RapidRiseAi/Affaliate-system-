import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser, getPortalAffiliateContext } from '@/lib/portal-auth';
import { hasTrustedOrigin, logServerError } from '@/lib/server-security';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { adminSupabase } from '@/lib/supabase';

const schema = z.object({
  account_holder: z.string().trim().min(2).max(200),
  bank_name: z.string().trim().min(2).max(120),
  account_number: z.string().trim().regex(/^[0-9 -]{4,34}$/, 'Enter a valid account number'),
  branch_code: z.string().trim().regex(/^[0-9A-Za-z -]{3,20}$/, 'Enter a valid branch code'),
  tax_number: z.string().trim().max(50).optional().or(z.literal('')),
  paypal_email: z.string().trim().email().max(200).optional().or(z.literal('')),
});

export async function POST(req: Request) {
  const fail = (code: string) =>
    NextResponse.redirect(new URL(`/affiliate/settings?payout=${code}`, req.url), 303);
  if (!hasTrustedOrigin(req)) return fail('error');

  const authUser = await getAuthenticatedUser();
  if (!authUser) return NextResponse.redirect(new URL('/partners/login', req.url), 303);
  const context = await getPortalAffiliateContext(authUser);
  if (!context) return NextResponse.redirect(new URL('/affiliate/dashboard', req.url), 303);

  const limit = await rateLimit(`payout:${clientIp(req)}`, 10, 600);
  if (!limit.ok) return fail('error');

  const parsed = schema.safeParse(Object.fromEntries(await req.formData()));
  if (!parsed.success) return fail('invalid');

  const supabase = adminSupabase();
  const { error } = await supabase
    .from('affiliate_portal_payout_methods')
    .upsert(
      {
        affiliate_id: context.affiliate.id,
        account_holder: parsed.data.account_holder,
        bank_name: parsed.data.bank_name,
        account_number: parsed.data.account_number,
        branch_code: parsed.data.branch_code,
        tax_number: parsed.data.tax_number || null,
        paypal_email: parsed.data.paypal_email || null,
        updated_by_auth_user_id: authUser.id,
      },
      { onConflict: 'affiliate_id' },
    );

  if (error) {
    logServerError('affiliate_payout_method_save_failed', error);
    return fail('error');
  }

  const { error: auditError } = await supabase.from('affiliate_portal_audit_events').insert({
    actor_auth_user_id: authUser.id,
    affiliate_id: context.affiliate.id,
    action_type: 'update_payout_method',
    entity_type: 'affiliate_portal_payout_method',
    entity_id: context.affiliate.id,
    // No banking values in the audit log — only that it changed.
    new_value: { updated: true },
  });
  if (auditError) logServerError('affiliate_payout_method_audit_failed', auditError);

  return NextResponse.redirect(new URL('/affiliate/settings?payout=saved', req.url), 303);
}
