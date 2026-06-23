import { redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
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
  if (!context) redirect('/affiliate/dashboard');

  const supabase = adminSupabase();
  const { data: commissions } = await supabase
    .from('commissions')
    .select('id,amount_cents,status,commission_type,created_at,quotes(quote_number),projects(name),payments(reference)')
    .eq('affiliate_id', context.affiliate.id)
    .order('created_at', { ascending: false });
  const commissionIds = (commissions ?? []).map(({ id }) => id);
  const { data: snapshots } = commissionIds.length
    ? await supabase
        .from('affiliate_portal_commission_snapshots')
        .select('commission_id,base_amount_cents,rate_percent,commission_model,service_id,services(name)')
        .in('commission_id', commissionIds)
    : { data: [] };
  const snapshotByCommission = new Map(
    (snapshots ?? []).map((snapshot) => [snapshot.commission_id, snapshot]),
  );

  return (
    <Shell>
      <section className="glass rounded-[2rem] p-8">
        <span className="badge">CRM statements</span>
        <h1 className="mt-4 text-4xl font-black">Commissions</h1>
        <table className="table mt-6">
          <thead><tr><th>CRM record</th><th>Type</th><th>Base / rate</th><th>Amount</th><th>Status</th><th>Created</th></tr></thead>
          <tbody>
            {commissions?.length ? commissions.map((commission) => (
              <tr key={commission.id}>
                <td>{commission.quotes?.[0]?.quote_number ?? commission.projects?.[0]?.name ?? commission.payments?.[0]?.reference ?? '—'}</td>
                <td>{snapshotByCommission.get(commission.id)?.commission_model === 'BUILD_COST' ? 'Build cost' : snapshotByCommission.get(commission.id)?.commission_model === 'LIFETIME' ? 'Lifetime' : commission.commission_type}</td>
                <td>{snapshotByCommission.has(commission.id)
                  ? `${snapshotByCommission.get(commission.id)!.services?.[0]?.name ?? 'Product'} · ${formatZar(snapshotByCommission.get(commission.id)!.base_amount_cents)} at ${snapshotByCommission.get(commission.id)!.rate_percent}%`
                  : 'CRM amount only'}</td>
                <td>{formatZar(commission.amount_cents)}</td>
                <td>{commission.status}</td>
                <td>{new Date(commission.created_at).toLocaleDateString('en-ZA')}</td>
              </tr>
            )) : <tr><td colSpan={6}>No commissions yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}
