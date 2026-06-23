import { redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { getAuthenticatedUser, getPortalAdminContext } from '@/lib/portal-auth';
import { adminSupabase } from '@/lib/supabase';

export default async function Page() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) redirect('/partners/login');
  if (!await getPortalAdminContext(authUser)) redirect('/affiliate/dashboard');

  const supabase = adminSupabase();
  const { data: attributions } = await supabase
    .from('affiliate_portal_lead_attributions')
    .select('id,crm_referral_id,attribution_source,fraud_flag,created_at')
    .order('created_at', { ascending: false });

  const referralIds = (attributions ?? []).map(({ crm_referral_id }) => crm_referral_id);
  const { data: referrals } = referralIds.length
    ? await supabase.from('referrals').select('id,lead_id,affiliate_id').in('id', referralIds)
    : { data: [] };
  const referralById = new Map((referrals ?? []).map((referral) => [referral.id, referral]));
  const leadIds = [...new Set((referrals ?? []).flatMap(({ lead_id }) => lead_id ? [lead_id] : []))];
  const affiliateIds = [...new Set((referrals ?? []).map(({ affiliate_id }) => affiliate_id))];
  const [leadsResult, affiliatesResult] = await Promise.all([
    leadIds.length
      ? supabase.from('leads').select('id,company_name,contact_name,service_interest,stage').in('id', leadIds)
      : Promise.resolve({ data: [] }),
    affiliateIds.length
      ? supabase.from('affiliates').select('id,name,tracking_code').in('id', affiliateIds)
      : Promise.resolve({ data: [] }),
  ]);
  const leads = new Map((leadsResult.data ?? []).map((lead) => [lead.id, lead]));
  const affiliates = new Map((affiliatesResult.data ?? []).map((affiliate) => [affiliate.id, affiliate]));

  return (
    <Shell nav="admin">
      <section className="glass rounded-[2rem] p-8">
        <h1 className="text-4xl font-black">Referred leads and attribution</h1>
        <table className="table mt-6">
          <thead>
            <tr><th>Lead</th><th>Service</th><th>Affiliate</th><th>Source</th><th>Stage</th><th>Flag</th></tr>
          </thead>
          <tbody>
            {attributions?.length ? attributions.map((attribution) => {
              const referral = referralById.get(attribution.crm_referral_id);
              const lead = referral?.lead_id ? leads.get(referral.lead_id) : null;
              const affiliate = referral ? affiliates.get(referral.affiliate_id) : null;
              return (
                <tr key={attribution.id}>
                  <td>{lead?.company_name ?? lead?.contact_name ?? attribution.crm_referral_id}</td>
                  <td>{lead?.service_interest ?? '—'}</td>
                  <td>{affiliate?.name ?? affiliate?.tracking_code ?? referral?.affiliate_id ?? 'Unknown'}</td>
                  <td>{attribution.attribution_source}</td>
                  <td>{lead?.stage ?? 'Unknown'}</td>
                  <td>{attribution.fraud_flag ? 'Review' : 'Clear'}</td>
                </tr>
              );
            }) : <tr><td colSpan={6}>No attributed leads.</td></tr>}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}
