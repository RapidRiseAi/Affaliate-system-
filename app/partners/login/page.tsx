import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { AsyncSubmitButton } from '@/components/AsyncSubmitButton';

const messages: Record<string, string> = {
  'verify-email': 'Application received. Check your inbox and verify your email address before an administrator can approve you.',
};
const errors: Record<string, string> = {
  invalid: 'The email or password is incorrect.',
  unverified: 'Verify your email address before signing in.',
  verification: 'That verification link is invalid or expired. Request a new verification email below.',
};

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const query = await searchParams;
  return <Shell nav="public"><div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_420px] lg:items-center">
    <section className="p-3 md:p-8"><p className="eyebrow">Approved partners</p><h1 className="mt-3 text-4xl font-black tracking-[-.04em] md:text-6xl">Your referrals.<br /><span className="text-cyan-300">Clearly tracked.</span></h1><p className="mt-5 max-w-xl text-lg text-slate-300">Sign in to build campaign links, follow privacy-safe lead progress and review your commission statement.</p></section>
    <form className="glass rounded-[2rem] p-7" action="/auth/login" method="post"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300"><LockKeyhole aria-hidden size={22} /></div><h2 className="mt-5 text-2xl font-black">Partner login</h2>{query.status && messages[query.status] ? <div role="status" className="mt-5 rounded-xl border border-emerald-300/25 bg-emerald-300/[0.08] p-4 text-sm text-emerald-100">{messages[query.status]}</div> : null}{query.error && errors[query.error] ? <div role="alert" className="mt-5 rounded-xl border border-red-300/25 bg-red-300/[0.08] p-4 text-sm text-red-100">{errors[query.error]}</div> : null}<label className="mt-6 grid gap-2 text-sm font-semibold text-slate-300">Email address<input className="input" name="email" type="email" autoComplete="email" required /></label><label className="mt-4 grid gap-2 text-sm font-semibold text-slate-300">Password<input className="input" name="password" type="password" autoComplete="current-password" required /></label><AsyncSubmitButton pendingLabel="Signing in…" className="btn-primary mt-6 w-full">Sign in securely</AsyncSubmitButton><p className="mt-5 text-sm text-slate-400">Not approved yet? <Link className="font-bold text-cyan-300" href="/partners/apply">Submit a partner application</Link></p></form>
  </div></Shell>;
}
