import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';
import { Shell } from '@/components/Shell';

export default function Page() {
  return <Shell nav="public"><div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_420px] lg:items-center">
    <section className="p-3 md:p-8"><p className="eyebrow">Approved partners</p><h1 className="mt-3 text-4xl font-black tracking-[-.04em] md:text-6xl">Your referrals.<br /><span className="text-cyan-300">Clearly tracked.</span></h1><p className="mt-5 max-w-xl text-lg text-slate-300">Sign in to build campaign links, follow privacy-safe lead progress and review your commission statement.</p></section>
    <form className="glass rounded-[2rem] p-7" action="/auth/login" method="post"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300"><LockKeyhole aria-hidden size={22} /></div><h2 className="mt-5 text-2xl font-black">Partner login</h2><label className="mt-6 grid gap-2 text-sm font-semibold text-slate-300">Email address<input className="input" name="email" type="email" autoComplete="email" required /></label><label className="mt-4 grid gap-2 text-sm font-semibold text-slate-300">Password<input className="input" name="password" type="password" autoComplete="current-password" required /></label><button className="btn btn-primary mt-6 w-full">Sign in securely</button><p className="mt-5 text-sm text-slate-400">Not approved yet? <Link className="font-bold text-cyan-300" href="/partners/apply">Submit a partner application</Link></p></form>
  </div></Shell>;
}
