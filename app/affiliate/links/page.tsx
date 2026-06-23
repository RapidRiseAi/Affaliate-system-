import { redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { channels, destinations } from '@/lib/constants';
import { getAuthenticatedUser, getPortalAffiliateContext } from '@/lib/portal-auth';
import { adminSupabase } from '@/lib/supabase';

export default async function Page() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) redirect('/partners/login');
  const context = await getPortalAffiliateContext(authUser);
  if (!context) redirect('/affiliate/dashboard');

  const supabase = adminSupabase();
  const [{ data: links }, { data: clicks }] = await Promise.all([
    supabase
      .from('affiliate_portal_tracking_links')
      .select('id,tracking_token,destination_url,private_reference,channel,is_active,expires_at,created_at')
      .eq('affiliate_id', context.affiliate.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('affiliate_portal_click_events')
      .select('tracking_link_id')
      .eq('affiliate_id', context.affiliate.id),
  ]);
  const clickCounts = new Map<string, number>();
  (clicks ?? []).forEach(({ tracking_link_id }) => {
    if (tracking_link_id) {
      clickCounts.set(tracking_link_id, (clickCounts.get(tracking_link_id) ?? 0) + 1);
    }
  });

  return (
    <Shell>
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <form action="/api/affiliate/links" method="post" className="glass rounded-[2rem] p-6">
          <span className="badge">URL generator</span>
          <h1 className="mt-4 text-3xl font-black">Create tracking link</h1>
          <select name="destination_url" className="input mt-5">
            {destinations.map((destination) => (
              <option key={destination.value} value={destination.value}>{destination.label}</option>
            ))}
          </select>
          <input name="private_reference" className="input mt-3" placeholder="Private client/campaign reference" required/>
          <select name="channel" className="input mt-3">
            {channels.map((channel) => <option key={channel}>{channel}</option>)}
          </select>
          <input name="custom_alias" className="input mt-3" placeholder="Custom alias (optional, no private data)"/>
          <textarea name="notes" className="input mt-3" placeholder="Private notes"/>
          <button className="btn btn-primary mt-4 w-full">Generate safe link</button>
          <p className="mt-3 text-xs text-slate-400">
            Public URLs use the CRM tracking code and never expose private references.
          </p>
        </form>
        <section className="glass rounded-[2rem] p-6">
          <h2 className="text-2xl font-bold">Tracking links</h2>
          <table className="table mt-4">
            <thead>
              <tr><th>Private reference</th><th>Destination</th><th>Channel</th><th>Clicks</th><th>Status</th></tr>
            </thead>
            <tbody>
              {links?.length ? links.map((link) => (
                <tr key={link.id}>
                  <td>{link.private_reference}</td>
                  <td>{link.destination_url}</td>
                  <td>{link.channel}</td>
                  <td>{clickCounts.get(link.id) ?? 0}</td>
                  <td>{link.is_active ? 'Active' : 'Paused'}</td>
                </tr>
              )) : <tr><td colSpan={5}>No tracking links yet.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </Shell>
  );
}
