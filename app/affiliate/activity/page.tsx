import { redirect } from 'next/navigation';
import { Activity, BadgeCheck, CircleDollarSign, FileSignature, UserPlus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { formatZar, getAuthenticatedUser, getPortalAffiliateContext } from '@/lib/portal-auth';
import { adminSupabase } from '@/lib/supabase';

type FeedItem = { at: string; icon: LucideIcon; title: string; detail: string };

export default async function Page() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) redirect('/partners/login');
  const context = await getPortalAffiliateContext(authUser);
  if (!context) redirect('/affiliate/dashboard');

  const supabase = adminSupabase();
  const affiliateId = context.affiliate.id;
  const [{ data: commissions }, { data: referrals }, { data: agreements }] = await Promise.all([
    supabase.from('commissions').select('id,amount_cents,status,created_at').eq('affiliate_id', affiliateId).order('created_at', { ascending: false }).limit(40),
    supabase.from('referrals').select('id').eq('affiliate_id', affiliateId),
    supabase.from('affiliate_portal_agreements').select('id,status,signed_at').eq('affiliate_id', affiliateId).not('signed_at', 'is', null),
  ]);

  const referralIds = (referrals ?? []).map((r) => r.id);
  const { data: attributions } = referralIds.length
    ? await supabase
        .from('affiliate_portal_lead_attributions')
        .select('id,created_at,attribution_source')
        .in('crm_referral_id', referralIds)
        .order('created_at', { ascending: false })
        .limit(40)
    : { data: [] };

  const feed: FeedItem[] = [];
  for (const c of commissions ?? []) {
    feed.push({
      at: c.created_at,
      icon: CircleDollarSign,
      title: `Commission ${formatZar(c.amount_cents)}`,
      detail: `Status: ${c.status}`,
    });
  }
  for (const a of attributions ?? []) {
    feed.push({
      at: a.created_at,
      icon: UserPlus,
      title: 'New attributed referral',
      detail: a.attribution_source === 'manual' ? 'Added by Rapid Rise AI' : 'From your tracking link',
    });
  }
  for (const ag of agreements ?? []) {
    if (ag.signed_at) {
      feed.push({ at: ag.signed_at, icon: FileSignature, title: 'Agreement signed', detail: `Status: ${ag.status}` });
    }
  }
  feed.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const items = feed.slice(0, 40);

  return (
    <Shell>
      <section className="glass rounded-[2rem] p-7 md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="eyebrow">Your timeline</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Recent activity</h1>
            <p className="mt-3 max-w-2xl text-slate-300">A privacy-safe history of your referrals, commissions and agreement — newest first.</p>
          </div>
          <span className="badge"><Activity aria-hidden size={15} />Live from the CRM</span>
        </div>

        {items.length ? (
          <ol className="mt-7 grid gap-3">
            {items.map((item, index) => (
              <li key={index} className="card flex items-start gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300"><item.icon aria-hidden size={18} /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{item.title}</p>
                  <p className="text-sm text-slate-400">{item.detail}</p>
                </div>
                <time className="shrink-0 text-xs text-slate-500">{new Date(item.at).toLocaleDateString('en-ZA')}</time>
              </li>
            ))}
          </ol>
        ) : (
          <div className="card mt-7 flex items-center gap-3 text-slate-300"><BadgeCheck aria-hidden className="text-emerald-300" />Nothing yet — your activity will appear here as referrals and commissions come in.</div>
        )}
      </section>
    </Shell>
  );
}
