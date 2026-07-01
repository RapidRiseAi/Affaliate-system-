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
  const { data: referrals, error: referralsError } = await supabase
    .from('referrals')
    .select('id,lead_id,status')
    .eq('affiliate_id', context.affiliate.id);
  const referralIds = (referrals ?? []).map(({ id }) => id);
  const { data: attributions, error: attributionsError } = referralIds.length
    ? await supabase
        .from('affiliate_portal_lead_attributions')
        .select('id,crm_referral_id,tracking_link_id,created_at,attribution_source')
        .in('crm_referral_id', referralIds)
        .order('created_at', { ascending: false })
    : { data: [], error: null };
  // A query failure must NOT look identical to "you have no referrals" — that
  // silent-empty state is exactly what made the tracking bug hard to trust.
  const loadError = referralsError || attributionsError;
  const referralById = new Map((referrals ?? []).map((referral) => [referral.id, referral]));
  const leadIds = (attributions ?? []).flatMap(({ crm_referral_id }) => {
    const leadId = referralById.get(crm_referral_id)?.lead_id;
    return leadId ? [leadId] : [];
  });
  const trackingLinkIds = (attributions ?? []).flatMap(({ tracking_link_id }) =>
    tracking_link_id ? [tracking_link_id] : [],
  );
  const [{ data: leads }, { data: trackingLinks }, { data: activityLogs }] = await Promise.all([
    leadIds.length
      ? supabase
          .from('leads')
          .select('id,service_interest,stage,next_action,updated_at,created_at')
          .in('id', leadIds)
      : Promise.resolve({ data: [] }),
    trackingLinkIds.length
      ? supabase
          .from('affiliate_portal_tracking_links')
          .select('id,private_reference,channel,destination_url')
          .in('id', trackingLinkIds)
      : Promise.resolve({ data: [] }),
    leadIds.length
      ? supabase
          .from('activity_logs')
          .select('lead_id,message,created_at')
          .in('lead_id', leadIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);
  const leadById = new Map((leads ?? []).map((lead) => [lead.id, lead]));
  const trackingLinkById = new Map((trackingLinks ?? []).map((link) => [link.id, link]));
  const latestActivityByLead = new Map<string, { message: string; created_at: string }>();
  for (const log of activityLogs ?? []) {
    if (log.lead_id && !latestActivityByLead.has(log.lead_id)) latestActivityByLead.set(log.lead_id, log);
  }

  return (
    <Shell>
      <section className="glass rounded-[2rem] p-7 md:p-9">
        <p className="eyebrow">Privacy-safe CRM status</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Referral pipeline</h1>
        <p className="mt-3 text-slate-300">
          Contact details stay in the CRM; affiliates see campaign, service, stage, and the latest safe progress note.
        </p>
        {loadError ? (
          <div className="mt-5 rounded-2xl border border-amber-300/25 bg-amber-300/[0.08] p-4 text-sm text-amber-100">
            We could not load your referrals right now. This is a temporary error on our side, not a sign that you have none — please refresh in a moment.
          </div>
        ) : null}
        <div className="table-wrap mt-6">
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Campaign</th>
                <th>Service</th>
                <th>Stage</th>
                <th>Last update</th>
                <th>Attributed</th>
              </tr>
            </thead>
            <tbody>
              {attributions?.length ? (
                attributions.map((attribution) => {
                  const referral = referralById.get(attribution.crm_referral_id);
                  const lead = referral?.lead_id ? leadById.get(referral.lead_id) : null;
                  const trackingLink = attribution.tracking_link_id
                    ? trackingLinkById.get(attribution.tracking_link_id)
                    : null;
                  const latestActivity = lead ? latestActivityByLead.get(lead.id) : null;
                  const lastUpdate = latestActivity?.message || lead?.next_action || 'Captured in CRM';
                  const lastUpdateAt = latestActivity?.created_at || lead?.updated_at || attribution.created_at;
                  return (
                    <tr key={attribution.id}>
                      <td>{attribution.id.slice(0, 8)}</td>
                      <td>
                        <span className="block font-bold">{trackingLink?.private_reference ?? 'Website referral'}</span>
                        <span className="text-xs text-slate-500">{trackingLink?.channel ?? attribution.attribution_source}</span>
                      </td>
                      <td>{lead?.service_interest ?? trackingLink?.destination_url ?? 'Pending CRM link'}</td>
                      <td>{lead ? stageLabels.get(lead.stage) ?? lead.stage : referral?.status ?? 'Pending'}</td>
                      <td>
                        <span className="block max-w-xs text-sm text-slate-300">{lastUpdate}</span>
                        <span className="text-xs text-slate-500">{new Date(lastUpdateAt).toLocaleString('en-ZA')}</span>
                      </td>
                      <td>{new Date(attribution.created_at).toLocaleDateString('en-ZA')}</td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={6}>{loadError ? 'Could not load referrals — please refresh.' : 'No attributed leads yet.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Shell>
  );
}
