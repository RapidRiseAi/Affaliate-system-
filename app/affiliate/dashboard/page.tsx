import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, BadgePercent, Link2, ShieldCheck } from 'lucide-react';
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
  const [clicks, sessions, referrals, commissions, agreementResult] = await Promise.all([
    supabase.from('affiliate_portal_click_events').select('id', { count: 'exact', head: true }).eq('affiliate_id', affiliateId),
    supabase.from('affiliate_portal_referral_sessions').select('id', { count: 'exact', head: true }).eq('affiliate_id', affiliateId),
    supabase.from('referrals').select('id,lead_id').eq('affiliate_id', affiliateId),
    supabase.from('commissions').select('amount_cents,status').eq('affiliate_id', affiliateId),
    supabase.from('affiliate_portal_agreements').select('id,commission_model,default_rate_percent,status,effective_from,effective_to,signed_at,terms_summary,affiliate_portal_agreement_rates(rate_percent,notes,services(name))').eq('affiliate_id', affiliateId).eq('status', 'ACTIVE').maybeSingle(),
  ]);
  const agreement = agreementResult.data;
  const productRates = agreement?.affiliate_portal_agreement_rates ?? [];

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
      <section className="glass relative overflow-hidden rounded-[2rem] p-7 md:p-10">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6"><div><span className="badge"><ShieldCheck aria-hidden size={14} />Active CRM affiliate</span><h1 className="mt-5 text-4xl font-black tracking-[-.035em] md:text-5xl">Partner overview</h1><p className="mt-3 max-w-3xl text-slate-300">A privacy-safe view of your referral activity, pipeline progress and earned commission.</p></div><div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4"><p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Affiliate code</p><p className="mt-1 font-mono text-lg font-bold text-cyan-300">{context.affiliate.tracking_code}</p></div></div>
        <div className="relative mt-8 grid gap-3 sm:grid-cols-2"><Link href="/affiliate/links" className="btn btn-primary"><Link2 aria-hidden size={17} />Create referral link <ArrowRight aria-hidden size={17} /></Link><Link href="/affiliate/commissions" className="btn btn-muted"><BadgePercent aria-hidden size={17} />View commission statement</Link></div>
      </section>
      <section className="mt-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(([label, value]) => (
            <Metric key={label} label={String(label)} value={String(value)} />
          ))}
        </div>
        <section className="glass mt-6 rounded-[2rem] p-6 md:p-8">
          <p className="eyebrow">Commercial terms</p><h2 className="mt-2 section-title">Your commission agreement</h2>
          {agreement ? <div className="mt-5 grid gap-5 lg:grid-cols-[.7fr_1.3fr]"><div className="card"><p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">Commission model</p><p className="mt-2 text-xl font-black">{agreement.commission_model === 'BUILD_COST' ? 'Build-cost commission' : 'Lifetime commission'}</p><p className="mt-4 text-sm text-slate-400">Default rate</p><p className="mt-1 text-3xl font-black text-cyan-300">{agreement.default_rate_percent ? `${agreement.default_rate_percent}%` : 'By product'}</p></div><div className="card"><h3 className="font-bold">Negotiated terms</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{agreement.terms_summary ?? 'Refer to your signed agreement.'}</p>{productRates.length ? <div className="mt-5"><p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">Product-specific rates</p><ul className="mt-3 flex flex-wrap gap-2">{productRates.map((rate, index) => <li key={index} className="badge">{rate.services?.[0]?.name ?? 'Product'} · {rate.rate_percent}%</li>)}</ul></div> : null}</div></div> : <div className="card mt-5"><p className="text-slate-300">Your portal access is active, but no signed commission agreement is currently active. Rapid Rise AI will confirm your negotiated model and rates before commissions are created.</p></div>}
        </section>
      </section>
    </Shell>
  );
}
