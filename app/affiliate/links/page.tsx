import { CheckCircle2, Link2, MousePointerClick, Pause, Play, ShieldCheck } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { AsyncSubmitButton } from '@/components/AsyncSubmitButton';
import { channels, destinations } from '@/lib/constants';
import { getAuthenticatedUser, getPortalAffiliateContext } from '@/lib/portal-auth';
import { adminSupabase } from '@/lib/supabase';

const errorMessages: Record<string, string> = {
  invalid: 'Check the link details and try again.',
  duplicate: 'That custom alias is already in use. Choose a different alias.',
  update: 'The tracking link could not be updated. Refresh and try again.',
};

export default async function Page({ searchParams }: { searchParams: Promise<{ created?: string; error?: string }> }) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) redirect('/partners/login');
  const context = await getPortalAffiliateContext(authUser);
  if (!context) redirect('/affiliate/dashboard');
  const { created, error } = await searchParams;
  const supabase = adminSupabase();
  const [{ data: links }, { data: clicks }] = await Promise.all([
    supabase.from('affiliate_portal_tracking_links').select('id,tracking_token,destination_url,private_reference,channel,is_active,expires_at,created_at').eq('affiliate_id', context.affiliate.id).order('created_at', { ascending: false }),
    supabase.from('affiliate_portal_click_events').select('tracking_link_id').eq('affiliate_id', context.affiliate.id),
  ]);
  const clickCounts = new Map<string, number>();
  for (const click of clicks ?? []) if (click.tracking_link_id) clickCounts.set(click.tracking_link_id, (clickCounts.get(click.tracking_link_id) ?? 0) + 1);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const publicPath = (token: string) => `/r/${encodeURIComponent(context.affiliate.tracking_code)}/${encodeURIComponent(token)}`;
  const createdLink = links?.find((link) => link.tracking_token === created);

  return <Shell>
    <section className="glass rounded-[2rem] p-7 md:p-9">
      <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">Campaign workspace</p><h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Referral links</h1><p className="mt-3 max-w-2xl text-slate-300">Build privacy-safe campaign links, monitor interest and pause distribution without losing history.</p></div><div className="badge"><ShieldCheck aria-hidden size={15} />No client details in public URLs</div></div>
    </section>
    {createdLink ? <section className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.07] p-5"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 text-emerald-300" aria-hidden size={20} /><div><p className="font-bold">Tracking link created</p><a className="mt-1 block break-all text-sm text-cyan-300 underline" href={`${siteUrl}${publicPath(createdLink.tracking_token)}`}>{siteUrl}{publicPath(createdLink.tracking_token)}</a></div></div></section> : null}
    {error ? <section role="alert" className="mt-5 rounded-2xl border border-red-300/25 bg-red-300/[0.07] p-5 text-sm text-red-100">{errorMessages[error] ?? errorMessages.update}</section> : null}
    <div className="mt-6 grid gap-6 xl:grid-cols-[380px_1fr]">
      <form action="/api/affiliate/links" method="post" className="glass h-fit rounded-[2rem] p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300"><Link2 aria-hidden size={21} /></div><h2 className="mt-4 text-2xl font-black">Create a link</h2><p className="mt-2 text-sm text-slate-400">Use an internal reference you will recognise. It never appears in the public URL.</p>
        <label className="mt-5 grid gap-2 text-sm font-semibold text-slate-300">Destination<select name="destination_url" className="input">{destinations.map((destination) => <option key={destination.value} value={destination.value}>{destination.label}</option>)}</select></label>
        <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-300">Private campaign reference<input name="private_reference" className="input" placeholder="e.g. June LinkedIn outreach" required /></label>
        <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-300">Channel<select name="channel" className="input">{channels.map((channel) => <option key={channel}>{channel}</option>)}</select></label>
        <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-300">Custom alias <span className="font-normal text-slate-500">Optional</span><input name="custom_alias" className="input" placeholder="june-websites" /></label>
        <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-300">Private notes <span className="font-normal text-slate-500">Optional</span><textarea name="notes" className="input min-h-24" placeholder="Campaign context for your records" /></label>
        <AsyncSubmitButton pendingLabel="Generating safe link…" className="btn-primary mt-5 w-full">Generate tracking link</AsyncSubmitButton>
      </form>
      <section className="glass rounded-[2rem] p-6">
        <div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Live campaigns</p><h2 className="mt-2 text-2xl font-black">Your tracking links</h2></div><span className="badge"><MousePointerClick aria-hidden size={14} />{clicks?.length ?? 0} clicks</span></div>
        <div className="table-wrap mt-5"><table className="table"><thead><tr><th>Campaign</th><th>Public link</th><th>Channel</th><th>Clicks</th><th>Control</th></tr></thead><tbody>
          {links?.length ? links.map((link) => <tr key={link.id}><td><p className="font-bold">{link.private_reference}</p><p className="text-xs text-slate-500">{link.destination_url}</p></td><td><a className="block max-w-64 truncate text-cyan-300 underline" href={`${siteUrl}${publicPath(link.tracking_token)}`}>{siteUrl}{publicPath(link.tracking_token)}</a></td><td>{link.channel}</td><td className="font-bold">{clickCounts.get(link.id) ?? 0}</td><td><form action={`/api/affiliate/links/${link.id}/toggle`} method="post"><AsyncSubmitButton pendingLabel="Updating…" className="btn-muted px-3 py-2 text-xs">{link.is_active ? <><Pause aria-hidden size={14} />Pause</> : <><Play aria-hidden size={14} />Reactivate</>}</AsyncSubmitButton></form></td></tr>) : <tr><td colSpan={5} className="py-10 text-center text-slate-400">No tracking links yet. Create your first campaign link.</td></tr>}
        </tbody></table></div>
      </section>
    </div>
  </Shell>;
}
