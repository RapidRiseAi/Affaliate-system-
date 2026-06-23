import { redirect } from 'next/navigation';
import { Metric, Shell } from '@/components/Shell';
import {
  formatZar,
  getAuthenticatedUser,
  getPortalAffiliateContext,
} from '@/lib/portal-auth';
import { adminSupabase } from '@/lib/supabase';

export default async function Page() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) redirect('/partners/login');

  const context = await getPortalAffiliateContext(authUser);
  const supabase = adminSupabase();
  if (!context) {
    const { data: application } = await supabase
      .from('affiliate_portal_partner_applications')
      .select('status,rejection_reason,deletion_scheduled_at,submitted_at')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (!application) redirect('/partners/apply');
    return (
      <Shell>
        <section className="glass rounded-[2rem] p-8">
          <span className="badge">{application.status}</span>
          <h1 className="mt-4 text-4xl font-black">Partner application</h1>
          <p className="mt-3 text-slate-300">
            {application.status === 'declined'
              ? application.rejection_reason
              : 'Your application is under review.'}
          </p>
          {application.deletion_scheduled_at ? (
            <p className="mt-3 text-sm text-slate-400">
              Portal access is scheduled to close on{' '}
              {new Date(application.deletion_scheduled_at).toLocaleString('en-ZA')}.
            </p>
          ) : null}
        </section>
      </Shell>
    );
  }

  const affiliateId = context.affiliate.id;
  const [clicks, sessions, referrals, commissions] = await Promise.all([
    supabase.from('affiliate_portal_click_events').select('id', { count: 'exact', head: true }).eq('affiliate_id', affiliateId),
    supabase.from('affiliate_portal_referral_sessions').select('id', { count: 'exact', head: true }).eq('affiliate_id', affiliateId),
    supabase.from('referrals').select('id,lead_id').eq('affiliate_id', affiliateId),
    supabase.from('commissions').select('amount_cents,status').eq('affiliate_id', affiliateId),
  ]);

  const referralIds = (referrals.data ?? []).map(({ id }) => id);
  const { data: attributions } = referralIds.length
    ? await supabase
        .from('affiliate_portal_lead_attributions')
        .select('crm_referral_id')
        .in('crm_referral_id', referralIds)
    : { data: [] };
  const attributedReferralIds = new Set(
    (attributions ?? []).map(({ crm_referral_id }) => crm_referral_id),
  );
  const leadIds = (referrals.data ?? [])
    .filter(({ id, lead_id }) => attributedReferralIds.has(id) && lead_id)
    .map(({ lead_id }) => lead_id as string);
  const { data: leads } = leadIds.length
    ? await supabase.from('leads').select('id,stage').in('id', leadIds)
    : { data: [] };
  const pendingCommission = (commissions.data ?? [])
    .filter(({ status }) => status !== 'PAID' && status !== 'CANCELLED')
    .reduce((total, { amount_cents }) => total + amount_cents, 0);
  const paidCommission = (commissions.data ?? [])
    .filter(({ status }) => status === 'PAID')
    .reduce((total, { amount_cents }) => total + amount_cents, 0);
  const metrics = [
    ['Total clicks', clicks.count ?? 0],
    ['Unique sessions', sessions.count ?? 0],
    ['Attributed enquiries', attributedReferralIds.size],
    ['Discovery completed', (leads ?? []).filter(({ stage }) => stage === 'DISCOVERY_COMPLETED').length],
    ['Quotes sent', (leads ?? []).filter(({ stage }) => stage === 'QUOTE_SENT').length],
    ['Clients won', (leads ?? []).filter(({ stage }) => stage === 'WON').length],
    ['Commission pending', formatZar(pendingCommission)],
    ['Paid commission', formatZar(paidCommission)],
  ];

  return (
    <Shell>
      <div className="glass rounded-[2rem] p-8">
        <span className="badge">Active CRM affiliate</span>
        <h1 className="mt-4 text-4xl font-black">Referral overview</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Affiliate code: <strong>{context.affiliate.tracking_code}</strong>
        </p>
        <div className="mt-7 grid gap-4 md:grid-cols-4">
          {metrics.map(([label, value]) => (
            <Metric key={label} label={String(label)} value={String(value)} />
          ))}
        </div>
      </div>
    </Shell>
  );
}
