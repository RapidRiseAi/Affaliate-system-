import { redirect } from 'next/navigation';
import { BellRing, SlidersHorizontal } from 'lucide-react';
import { NotificationPreferencesForm } from '@/components/NotificationPreferencesForm';
import { Shell } from '@/components/Shell';
import { getAuthenticatedUser } from '@/lib/portal-auth';
import { serverSupabase } from '@/lib/supabase';

const defaults = {
  application_updates: true,
  agreement_updates: true,
  referral_updates: true,
  commission_created: true,
  commission_status_updates: true,
  commission_paid: true,
  payout_summaries: true,
};

export default async function Page() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) redirect('/partners/login');
  const supabase = await serverSupabase();
  const { data } = await supabase.from('affiliate_portal_notification_preferences').select('*').eq('auth_user_id', authUser.id).maybeSingle();
  return <Shell>
    <section className="glass rounded-[2rem] p-7 md:p-10">
      <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="eyebrow">Portal settings</p><h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Notification controls</h1><p className="mt-3 max-w-3xl text-slate-300">Choose exactly which affiliate updates Rapid Rise AI may email to you. Security and account-verification messages are always delivered by Supabase Auth.</p></div><span className="badge"><SlidersHorizontal aria-hidden size={15} />You are in control</span></div>
      <div className="mt-7 grid gap-6 xl:grid-cols-[.55fr_1.45fr]"><aside className="card h-fit"><BellRing className="text-cyan-300" aria-hidden /><h2 className="mt-4 text-xl font-black">Email sender</h2><p className="mt-2 text-sm leading-6 text-slate-400">Program notifications come from Rapid Rise AI at team@rapidriseai.com. You can change these choices at any time.</p></aside><NotificationPreferencesForm initial={{ ...defaults, ...(data ?? {}) }} /></div>
    </section>
  </Shell>;
}
