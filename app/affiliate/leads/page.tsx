import { redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { affiliateStatuses } from '@/lib/constants';
import { getAuthenticatedUser, getPortalAffiliateContext } from '@/lib/portal-auth';
import { adminSupabase } from '@/lib/supabase';

const stageLabels = new Map<string, string>(affiliateStatuses);

export default async function Page() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) redirect('/partners/login');
  const context = await getPortalAffiliateContext(authUser);
  if (!context) redirect('/affiliate/dashboard');

  const supabase = adminSupabase();
  const { data: referrals } = await supabase
    .from('referrals')
    .select('id,lead_id')
    .eq('affiliate_id', context.affiliate.id);
  const referralIds = (referrals ?? []).map(({ id }) => id);
  const { data: attributions } = referralIds.length
    ? await supabase
        .from('affiliate_portal_lead_attributions')
        .select('id,crm_referral_id,created_at')
        .in('crm_referral_id', referralIds)
        .order('created_at', { ascending: false })
    : { data: [] };
  const referralById = new Map((referrals ?? []).map((referral) => [referral.id, referral]));
  const leadIds = (attributions ?? []).flatMap(({ crm_referral_id }) => {
    const leadId = referralById.get(crm_referral_id)?.lead_id;
    return leadId ? [leadId] : [];
  });
  const { data: leads } = leadIds.length
    ? await supabase
        .from('leads')
        .select('id,service_interest,stage,created_at')
        .in('id', leadIds)
    : { data: [] };
  const leadById = new Map((leads ?? []).map((lead) => [lead.id, lead]));

  return (
    <Shell>
      <section className="glass rounded-[2rem] p-8">
        <span className="badge">Privacy-safe CRM status</span>
        <h1 className="mt-4 text-4xl font-black">Lead status</h1>
        <p className="mt-3 text-slate-300">
          Contact details stay in the CRM; the portal exposes only service, stage, and timing.
        </p>
        <table className="table mt-6">
          <thead><tr><th>Reference</th><th>Service</th><th>Stage</th><th>Attributed</th></tr></thead>
          <tbody>
            {attributions?.length ? attributions.map((attribution) => {
              const leadId = referralById.get(attribution.crm_referral_id)?.lead_id;
              const lead = leadId ? leadById.get(leadId) : null;
              return (
                <tr key={attribution.id}>
                  <td>{attribution.id.slice(0, 8)}</td>
                  <td>{lead?.service_interest ?? 'Pending CRM link'}</td>
                  <td>{lead ? stageLabels.get(lead.stage) ?? lead.stage : 'Pending'}</td>
                  <td>{new Date(attribution.created_at).toLocaleDateString('en-ZA')}</td>
                </tr>
              );
            }) : <tr><td colSpan={4}>No attributed leads yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}
