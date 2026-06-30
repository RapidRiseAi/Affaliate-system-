import { redirect } from 'next/navigation';
import { BellRing, Landmark, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { AsyncSubmitButton } from '@/components/AsyncSubmitButton';
import { NotificationPreferencesForm } from '@/components/NotificationPreferencesForm';
import { Shell } from '@/components/Shell';
import { getAuthenticatedUser, getPortalAffiliateContext } from '@/lib/portal-auth';
import { adminSupabase, serverSupabase } from '@/lib/supabase';

const defaults = {
  application_updates: true,
  agreement_updates: true,
  referral_updates: true,
  commission_created: true,
  commission_status_updates: true,
  commission_paid: true,
  payout_summaries: true,
};

const payoutMessages: Record<string, { tone: 'ok' | 'err'; text: string }> = {
  saved: { tone: 'ok', text: 'Your payout details have been saved securely.' },
  invalid: { tone: 'err', text: 'Check the payout fields and try again.' },
  error: { tone: 'err', text: 'Your payout details could not be saved. Please try again.' },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ payout?: string }> }) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) redirect('/partners/login');
  const { payout } = await searchParams;

  const supabase = await serverSupabase();
  const { data: preferences } = await supabase
    .from('affiliate_portal_notification_preferences')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .maybeSingle();

  // Payout details are only relevant once the account is a mapped affiliate.
  const context = await getPortalAffiliateContext(authUser);
  const { data: payoutMethod } = context
    ? await adminSupabase()
        .from('affiliate_portal_payout_methods')
        .select('account_holder,bank_name,account_number,branch_code,tax_number,paypal_email')
        .eq('affiliate_id', context.affiliate.id)
        .maybeSingle()
    : { data: null };
  const payoutStatus = payout ? payoutMessages[payout] : undefined;

  return (
    <Shell>
      <section className="glass rounded-[2rem] p-7 md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="eyebrow">Portal settings</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Account &amp; notifications</h1>
            <p className="mt-3 max-w-3xl text-slate-300">Manage how Rapid Rise AI pays you and which updates we email. Security and account-verification messages are always delivered.</p>
          </div>
          <span className="badge"><SlidersHorizontal aria-hidden size={15} />You are in control</span>
        </div>

        {context ? (
          <div className="mt-7 card">
            <div className="flex items-center gap-3"><Landmark className="text-cyan-300" aria-hidden /><div><h2 className="text-xl font-black">Payout details</h2><p className="mt-1 text-sm text-slate-400">Where Rapid Rise AI sends your commission. Visible only to you and the payouts team.</p></div></div>
            {payoutStatus ? (
              <div role={payoutStatus.tone === 'ok' ? 'status' : 'alert'} className={`mt-5 rounded-2xl border p-4 text-sm leading-6 ${payoutStatus.tone === 'ok' ? 'border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-100' : 'border-red-300/25 bg-red-300/[0.08] text-red-100'}`}>{payoutStatus.text}</div>
            ) : null}
            <form action="/api/affiliate/payout-method" method="post" className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="form-label">Account holder<input className="input" name="account_holder" defaultValue={payoutMethod?.account_holder ?? ''} placeholder="Full name as per bank" required minLength={2} maxLength={200} /></label>
              <label className="form-label">Bank name<input className="input" name="bank_name" defaultValue={payoutMethod?.bank_name ?? ''} placeholder="e.g. FNB, Capitec" required minLength={2} maxLength={120} /></label>
              <label className="form-label">Account number<input className="input" name="account_number" defaultValue={payoutMethod?.account_number ?? ''} placeholder="Digits only" required inputMode="numeric" /></label>
              <label className="form-label">Branch code<input className="input" name="branch_code" defaultValue={payoutMethod?.branch_code ?? ''} placeholder="e.g. 250655" required /></label>
              <label className="form-label">Tax / VAT number <span className="font-normal text-slate-500">Optional</span><input className="input" name="tax_number" defaultValue={payoutMethod?.tax_number ?? ''} placeholder="For tax invoices" maxLength={50} /></label>
              <label className="form-label">PayPal email <span className="font-normal text-slate-500">Optional · international</span><input className="input" name="paypal_email" type="email" defaultValue={payoutMethod?.paypal_email ?? ''} placeholder="you@example.com" maxLength={200} /></label>
              <div className="sm:col-span-2"><AsyncSubmitButton pendingLabel="Saving securely…" className="btn-primary min-h-12">Save payout details</AsyncSubmitButton></div>
            </form>
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><ShieldCheck aria-hidden size={14} className="text-emerald-300" />Stored privately; never shown in public URLs or to other partners.</p>
          </div>
        ) : null}

        <div className="mt-7 grid gap-6 xl:grid-cols-[.55fr_1.45fr]">
          <aside className="card h-fit"><BellRing className="text-cyan-300" aria-hidden /><h2 className="mt-4 text-xl font-black">Email sender</h2><p className="mt-2 text-sm leading-6 text-slate-400">Program notifications come from Rapid Rise AI at team@rapidriseai.com. You can change these choices at any time.</p></aside>
          <NotificationPreferencesForm initial={{ ...defaults, ...(preferences ?? {}) }} />
        </div>
      </section>
    </Shell>
  );
}
