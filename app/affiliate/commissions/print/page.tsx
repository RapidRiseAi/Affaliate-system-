import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PrintButton } from '@/components/PrintButton';
import { formatZar, getAuthenticatedUser, getPortalAffiliateContext } from '@/lib/portal-auth';
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
  const rows = commissions ?? [];
  const pending = rows.filter((c) => c.status !== 'PAID' && c.status !== 'CANCELLED').reduce((t, c) => t + c.amount_cents, 0);
  const paid = rows.filter((c) => c.status === 'PAID').reduce((t, c) => t + c.amount_cents, 0);

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
          <Link href="/affiliate/commissions" className="text-sm font-semibold text-cyan-700 underline">← Back to portal</Link>
          <PrintButton className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white" />
        </div>

        <article className="rounded-xl border border-slate-200 p-8 shadow-sm print:border-0 print:p-0 print:shadow-none">
          <header className="border-b border-slate-200 pb-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Rapid Rise AI · Partner Network</p>
            <h1 className="mt-2 text-2xl font-black">Commission Statement</h1>
            <p className="mt-1 text-sm text-slate-600">{context.affiliate.name} · Code {context.affiliate.tracking_code} · Generated {new Date().toLocaleDateString('en-ZA')}</p>
          </header>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-slate-50 p-4"><p className="text-xs uppercase tracking-widest text-slate-500">Pending</p><p className="mt-1 text-xl font-black">{formatZar(pending)}</p></div>
            <div className="rounded-lg bg-slate-50 p-4"><p className="text-xs uppercase tracking-widest text-slate-500">Paid</p><p className="mt-1 text-xl font-black">{formatZar(paid)}</p></div>
          </div>

          <table className="mt-6 w-full text-left text-sm">
            <thead className="border-b border-slate-300 text-xs uppercase tracking-wider text-slate-500"><tr><th className="py-2 pr-3">Record</th><th className="py-2 pr-3">Type</th><th className="py-2 pr-3">Amount</th><th className="py-2 pr-3">Status</th><th className="py-2">Date</th></tr></thead>
            <tbody>
              {rows.length ? rows.map((c) => (
                <tr key={c.id} className="border-b border-slate-100">
                  <td className="py-2 pr-3">{c.quotes?.[0]?.quote_number ?? c.projects?.[0]?.name ?? c.payments?.[0]?.reference ?? '—'}</td>
                  <td className="py-2 pr-3">{c.commission_type}</td>
                  <td className="py-2 pr-3 font-semibold">{formatZar(c.amount_cents)}</td>
                  <td className="py-2 pr-3">{c.status}</td>
                  <td className="py-2">{new Date(c.created_at).toLocaleDateString('en-ZA')}</td>
                </tr>
              )) : <tr><td colSpan={5} className="py-6 text-center text-slate-500">No commissions yet.</td></tr>}
            </tbody>
          </table>

          <footer className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-400">CRM-backed statement · amounts in ZAR · Rapid Rise AI</footer>
        </article>
      </div>
    </main>
  );
}
