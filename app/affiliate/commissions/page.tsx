import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Download } from 'lucide-react';
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
  const { data: payoutItems } = commissionIds.length
    ? await supabase
        .from('affiliate_portal_payout_items')
        .select('commission_id,affiliate_portal_payout_batches(reference,status,scheduled_for,paid_at)')
        .in('commission_id', commissionIds)
    : { data: [] };
  const payoutByCommission = new Map(
    (payoutItems ?? []).map((item) => [item.commission_id, item.affiliate_portal_payout_batches?.[0]]),
  );

  return (
    <Shell>
      <section className="glass rounded-[2rem] p-7 md:p-9">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">CRM statements</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Commission statement</h1>
            <p className="mt-3 max-w-2xl text-slate-300">Every amount is backed by the agreement model, product rate and source CRM record used for calculation.</p>
          </div>
          <Link href="/affiliate/commissions/print" className="btn btn-muted min-h-10 px-4 text-sm"><Download aria-hidden size={15} />Download PDF</Link>
        </div>
        <div className="table-wrap mt-6"><table className="table">
          <thead><tr><th>CRM record</th><th>Type</th><th>Base / rate</th><th>Amount</th><th>Status</th><th>Payout</th><th>Created</th></tr></thead>
          <tbody>
            {commissions?.length ? commissions.map((commission) => (
              <tr key={commission.id}>
                <td>{commission.quotes?.[0]?.quote_number ?? commission.projects?.[0]?.name ?? commission.payments?.[0]?.reference ?? '—'}</td>
                <td>{snapshotByCommission.get(commission.id)?.commission_model === 'BUILD_COST' ? 'Build cost' : snapshotByCommission.get(commission.id)?.commission_model === 'LIFETIME' ? 'Lifetime' : snapshotByCommission.get(commission.id)?.commission_model === 'RECURRING' ? 'Recurring' : commission.commission_type}</td>
                <td>{snapshotByCommission.has(commission.id)
                  ? `${snapshotByCommission.get(commission.id)!.services?.[0]?.name ?? 'Product'} · ${formatZar(snapshotByCommission.get(commission.id)!.base_amount_cents)} at ${snapshotByCommission.get(commission.id)!.rate_percent}%`
                  : 'CRM amount only'}</td>
                <td>{formatZar(commission.amount_cents)}</td>
                <td>{commission.status}</td>
                <td>{payoutByCommission.get(commission.id) ? <><span className="block font-bold">{payoutByCommission.get(commission.id)?.reference}</span><span className="text-xs text-slate-500">{payoutByCommission.get(commission.id)?.status}</span></> : 'Not batched'}</td>
                <td>{new Date(commission.created_at).toLocaleDateString('en-ZA')}</td>
              </tr>
            )) : <tr><td colSpan={7}>No commissions yet.</td></tr>}
          </tbody>
        </table></div>
      </section>
    </Shell>
  );
}
