import Link from 'next/link';
import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { PortalNav } from './PortalNav';

export function Shell({ children, nav = 'affiliate' }: { children: React.ReactNode; nav?: 'affiliate' | 'public' }) {
  return <div className="min-h-screen px-4 py-4 sm:px-6 md:py-6">
    <header className="glass sticky top-3 z-40 mx-auto mb-7 flex max-w-7xl items-center justify-between rounded-2xl px-4 py-3 md:static md:bg-transparent md:px-5">
      <Link href={nav === 'affiliate' ? '/affiliate/dashboard' : '/partners'} className="flex items-center gap-3" aria-label="Rapid Rise AI Partners home">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-600 shadow-lg shadow-blue-950/40"><TrendingUp aria-hidden size={21} /></span>
        <span><span className="block text-sm font-black tracking-tight sm:text-base">Rapid Rise AI</span><span className="block text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Partner network</span></span>
      </Link>
      <PortalNav mode={nav} />
    </header>
    <main className="mx-auto max-w-7xl">{children}</main>
    <footer className="mx-auto mt-10 flex max-w-7xl flex-col gap-2 border-t border-white/10 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>Rapid Rise AI Partner Network</span><span>Private, transparent referral tracking</span></footer>
  </div>;
}

export function Hero({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return <div className="glass relative overflow-hidden rounded-[2rem] p-7 sm:p-9 md:p-14">
    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
    <div className="relative"><span className="badge"><Sparkles aria-hidden size={14} />{eyebrow}</span><h1 className="mt-6 max-w-5xl text-4xl font-black leading-[1.04] tracking-[-.045em] sm:text-5xl md:text-7xl">{title}</h1><p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">{body}</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/partners/apply" className="btn btn-primary">Apply to partner <ArrowRight aria-hidden size={18} /></Link><Link href="/partners/login" className="btn btn-muted">Partner login</Link></div></div>
  </div>;
}

export function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="card metric-card"><p className="relative z-10 text-xs font-bold uppercase tracking-[.1em] text-slate-400">{label}</p><p className="relative z-10 mt-3 text-3xl font-black tracking-tight">{value}</p></div>;
}
