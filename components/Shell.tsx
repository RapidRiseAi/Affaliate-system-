import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { PortalNav } from './PortalNav';

export function Shell({ children, nav = 'affiliate' }: { children: React.ReactNode; nav?: 'affiliate' | 'public' }) {
  const home = nav === 'affiliate' ? '/affiliate/dashboard' : '/partners';

  return (
    <div className="page-shell">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-slate-950 focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-white">
        Skip to content
      </a>
      <div className="ambient-orb ambient-orb-left" aria-hidden />
      <div className="ambient-orb ambient-orb-right" aria-hidden />

      <header className="site-header glass flex items-center justify-between rounded-2xl px-3 py-3 sm:px-4">
        <Link href={home} className="group flex min-h-11 items-center gap-3 rounded-xl pr-2" aria-label="Rapid Rise AI Partners home">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-600 shadow-lg shadow-blue-950/40">
            <span className="absolute inset-px rounded-[11px] bg-gradient-to-br from-white/20 to-transparent" aria-hidden />
            <TrendingUp className="relative transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden size={21} />
          </span>
          <span>
            <span className="block font-[family-name:var(--font-display)] text-sm font-bold tracking-tight text-white sm:text-base">Rapid Rise AI</span>
            <span className="block text-[9px] font-extrabold uppercase tracking-[.22em] text-slate-400 sm:text-[10px]">Partner network</span>
          </span>
        </Link>
        <PortalNav mode={nav} />
      </header>

      <main id="main-content" className="mx-auto max-w-7xl">{children}</main>

      <footer className="site-footer border-t border-white/10 px-2 py-8">
        <div className="grid gap-7 md:grid-cols-[1.2fr_.8fr] md:items-end">
          <div>
            <Link href={home} className="inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-sm font-bold text-slate-200">
              <TrendingUp aria-hidden size={17} className="text-cyan-300" /> Rapid Rise AI Partner Network
            </Link>
            <p className="mt-2 max-w-xl text-xs leading-5 text-slate-500">Transparent referral tracking, individually negotiated agreements, and privacy-safe client progress.</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-400 md:justify-end">
            <Link className="transition-colors hover:text-white" href="/partners">Program</Link>
            <Link className="transition-colors hover:text-white" href="/partners/login">Partner login</Link>
            <Link className="transition-colors hover:text-white" href="/partners/apply">Apply</Link>
          </div>
        </div>
        <div className="mt-7 flex flex-col gap-2 border-t border-white/[0.07] pt-5 text-[11px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Rapid Rise AI</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck aria-hidden size={13} /> Privacy-safe partner operations</span>
        </div>
      </footer>
    </div>
  );
}

export function Hero({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <section className="landing-hero p-7 sm:p-10 md:p-14">
      <div className="relative z-10 max-w-4xl">
        <span className="badge"><Sparkles aria-hidden size={14} />{eyebrow}</span>
        <h1 className="mt-6 text-4xl font-bold leading-[1.03] tracking-[-.055em] sm:text-5xl md:text-7xl">{title}</h1>
        <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">{body}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/partners/apply" className="btn btn-primary min-h-12">Apply to partner <ArrowRight aria-hidden size={18} /></Link>
          <Link href="/partners/login" className="btn btn-muted min-h-12">Partner login</Link>
        </div>
        <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-400">
          <span className="inline-flex items-center gap-2"><CheckCircle2 aria-hidden size={15} className="text-emerald-300" />Manual partner review</span>
          <span className="inline-flex items-center gap-2"><CheckCircle2 aria-hidden size={15} className="text-emerald-300" />Custom commission terms</span>
        </div>
      </div>
    </section>
  );
}

export function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card metric-card">
      <p className="relative z-10 max-w-[85%] text-[11px] font-extrabold uppercase tracking-[.12em] text-slate-400">{label}</p>
      <p className="relative z-10 mt-4 break-words text-3xl font-extrabold tracking-[-.04em] text-white">{value}</p>
      <div className="relative z-10 mt-4 h-px w-12 bg-gradient-to-r from-cyan-300/80 to-transparent" aria-hidden />
    </div>
  );
}
