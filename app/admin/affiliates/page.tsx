import { redirect } from 'next/navigation';
import { Metric, Shell } from '@/components/Shell';
import {
  formatZar,
  getAuthenticatedUser,
  getPortalAdminContext,
} from '@/lib/portal-auth';
import { adminSupabase } from '@/lib/supabase';

export default async function Page() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) redirect('/partners/login');
  if (!await getPortalAdminContext(authUser)) redirect('/affiliate/dashboard');

  const supabase = adminSupabase();
  const [
    applications,
    affiliates,
    clicks,
    attributions,
    referrals,
    commissions,
    fraud,
  ] = await Promise.all([
    supabase.from('affiliate_portal_partner_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
    supabase.from('affiliates').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    supabase.from('affiliate_portal_click_events').select('id', { count: 'exact', head: true }),
    supabase.from('affiliate_portal_lead_attributions').select('id', { count: 'exact', head: true }),
    supabase.from('referrals').select('id', { count: 'exact', head: true }).not('client_id', 'is', null),
    supabase.from('commissions').select('amount_cents,status'),
    supabase.from('affiliate_portal_lead_attributions').select('id', { count: 'exact', head: true }).eq('fraud_flag', true),
  ]);

  const commissionOwed = (commissions.data ?? [])
    .filter(({ status }) => status !== 'PAID' && status !== 'CANCELLED')
    .reduce((total, { amount_cents }) => total + amount_cents, 0);
  const metrics = [
    ['New applications', applications.count ?? 0],
    ['Active affiliates', affiliates.count ?? 0],
    ['Total clicks', clicks.count ?? 0],
    ['Attributed enquiries', attributions.count ?? 0],
    ['Clients won', referrals.count ?? 0],
    ['Commission owed', formatZar(commissionOwed)],
    ['Suspicious flags', fraud.count ?? 0],
  ];

  return (
    <Shell nav="admin">
      <div className="glass rounded-[2rem] p-8">
        <span className="badge">CRM-authorized admin</span>
        <h1 className="mt-4 text-4xl font-black">Affiliate operations</h1>
        <div className="mt-7 grid gap-4 md:grid-cols-4">
          {metrics.map(([label, value]) => (
            <Metric key={label} label={String(label)} value={String(value)} />
          ))}
        </div>
      </div>
    </Shell>
  );
}
