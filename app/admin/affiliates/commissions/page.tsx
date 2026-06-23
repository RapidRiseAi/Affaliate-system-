import { redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
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
  const { data: commissions } = await supabase
    .from('commissions')
    .select('id,amount_cents,status,commission_type,created_at,affiliates(name,tracking_code),quotes(quote_number,title),projects(name),payments(reference)')
    .order('created_at', { ascending: false });
  const commissionIds = (commissions ?? []).map(({ id }) => id);
  const { data: snapshots } = commissionIds.length
    ? await supabase
        .from('affiliate_portal_commission_snapshots')
        .select('commission_id,base_amount_cents,rate_percent')
        .in('commission_id', commissionIds)
    : { data: [] };
  const snapshotByCommission = new Map(
    (snapshots ?? []).map((snapshot) => [snapshot.commission_id, snapshot]),
  );

  return (
    <Shell nav="admin">
      <section className="glass rounded-[2rem] p-8">
        <h1 className="text-4xl font-black">Commission tracker</h1>
        <table className="table mt-6">
          <thead>
            <tr><th>Affiliate</th><th>CRM record</th><th>Type</th><th>Base / rate</th><th>Amount</th><th>Status</th></tr>
          </thead>
          <tbody>
            {commissions?.length ? commissions.map((commission) => (
              <tr key={commission.id}>
                <td>{commission.affiliates?.[0]?.name ?? commission.affiliates?.[0]?.tracking_code ?? 'Unknown'}</td>
                <td>{commission.quotes?.[0]?.quote_number ?? commission.projects?.[0]?.name ?? commission.payments?.[0]?.reference ?? '—'}</td>
                <td>{commission.commission_type}</td>
                <td>{snapshotByCommission.has(commission.id)
                  ? `${formatZar(snapshotByCommission.get(commission.id)!.base_amount_cents)} at ${snapshotByCommission.get(commission.id)!.rate_percent}%`
                  : 'No calculation snapshot'}</td>
                <td>{formatZar(commission.amount_cents)}</td>
                <td>{commission.status}</td>
              </tr>
            )) : <tr><td colSpan={6}>No commissions yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}
