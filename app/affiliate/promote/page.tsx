import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Megaphone, QrCode, Sparkles } from 'lucide-react';
import { CopyLinkButton } from '@/components/CopyLinkButton';
import { Shell } from '@/components/Shell';
import { getAuthenticatedUser, getPortalAffiliateContext } from '@/lib/portal-auth';

export default async function Page() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) redirect('/partners/login');
  const context = await getPortalAffiliateContext(authUser);
  if (!context) redirect('/affiliate/dashboard');

  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host') || '';
  const proto = requestHeaders.get('x-forwarded-proto') || 'https';
  const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || (host ? `${proto}://${host}` : '')).replace(/\/$/, '');
  const code = context.affiliate.tracking_code;
  const primaryLink = `${siteOrigin}/r/${encodeURIComponent(code)}`;

  // Pre-written, ready-to-send copy with the partner's link already inserted.
  const snippets: Array<{ channel: string; text: string }> = [
    { channel: 'WhatsApp / DM', text: `Hi! If your business needs a proper website, dashboards, automation or AI tools, I work with Rapid Rise AI — they're excellent. Have a look and reach out here: ${primaryLink}` },
    { channel: 'Email intro', text: `Hi there,\n\nI wanted to introduce you to Rapid Rise AI. They build websites, client portals, smart dashboards, automations and AI solutions for businesses like yours. If you're considering an upgrade, start here: ${primaryLink}\n\nHappy to make a personal introduction if useful.` },
    { channel: 'LinkedIn / social', text: `Businesses I trust for websites, automation and AI systems: Rapid Rise AI. If you're planning a digital upgrade this year, take a look 👉 ${primaryLink}` },
    { channel: 'Short & simple', text: `Need a better website or smarter systems? Talk to Rapid Rise AI: ${primaryLink}` },
  ];

  return (
    <Shell>
      <section className="glass rounded-[2rem] p-7 md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="eyebrow">Promote</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Share &amp; earn</h1>
            <p className="mt-3 max-w-2xl text-slate-300">Your personal referral link, ready-to-send messages, and a QR code for in-person sharing. For tracked campaigns by channel, create named links on the Links page.</p>
          </div>
          <span className="badge"><Megaphone aria-hidden size={15} />Partner toolkit</span>
        </div>

        <div className="mt-7 grid gap-6 xl:grid-cols-[1.4fr_.6fr]">
          <div className="card">
            <h2 className="text-xl font-black">Your referral link</h2>
            <p className="mt-2 text-sm text-slate-400">Anyone who arrives through this link is attributed to you for 90 days.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <code className="min-w-0 flex-1 break-all rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-mono text-sm text-cyan-300">{primaryLink}</code>
              <CopyLinkButton value={primaryLink} />
            </div>
          </div>
          <div className="card flex flex-col items-center justify-center text-center">
            <QrCode aria-hidden className="text-cyan-300" />
            <h2 className="mt-3 text-lg font-black">QR code</h2>
            <p className="mt-1 text-xs text-slate-400">For flyers, cards &amp; in-person.</p>
            <a href="/affiliate/promote/qr" target="_blank" className="btn btn-muted mt-4 px-4 py-2 text-sm">Open / download QR</a>
          </div>
        </div>

        <section className="mt-6">
          <div className="flex items-center gap-2"><Sparkles aria-hidden size={16} className="text-cyan-300" /><h2 className="text-2xl font-black">Ready-to-send messages</h2></div>
          <p className="mt-2 text-sm text-slate-400">Copy, personalise, and send. Your link is already included.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {snippets.map((snippet) => (
              <div key={snippet.channel} className="card">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">{snippet.channel}</p>
                  <CopyLinkButton value={snippet.text} />
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{snippet.text}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-6 text-xs text-slate-500">Looking for branded banners or graphics? Email team@rapidriseai.com and we&apos;ll send brand-approved assets.</p>
      </section>
    </Shell>
  );
}
