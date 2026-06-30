import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BarChart3, CircleDollarSign, FileSignature, Link2, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { AsyncSubmitButton } from '@/components/AsyncSubmitButton';

export const metadata: Metadata = {
  title: 'Partner login',
  description: 'Sign in to the Rapid Rise AI partner portal.',
};

const messages: Record<string, string> = {
  'verify-email': 'Application received. Check your inbox and verify your email address before an administrator can approve you.',
  'password-updated': 'Your password has been updated. Sign in with your new password.',
};
const errors: Record<string, string> = {
  invalid: 'The email or password is incorrect.',
  unverified: 'Verify your email address before signing in. You can resend the verification email from the reset page.',
  verification: 'That verification link is invalid or expired. Request a new one from the reset page.',
  origin: 'For your protection, that sign-in request was rejected. Refresh this page and try again.',
  rate: 'Too many sign-in attempts. Please wait a few minutes and try again.',
};

const benefits = [
  ['Campaign links', 'Create and control trackable referral links.', Link2],
  ['Pipeline clarity', 'Follow privacy-safe referral progress.', BarChart3],
  ['Commission records', 'Review amounts and payout status.', CircleDollarSign],
  ['Signed terms', 'Access your negotiated agreement.', FileSignature],
] as const;

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const query = await searchParams;

  return (
    <Shell nav="public">
      <div className="grid min-h-[680px] overflow-hidden rounded-[2rem] border border-white/[0.1] bg-[#07101d]/70 shadow-2xl shadow-black/30 lg:grid-cols-[1.08fr_.92fr]">
        <section className="relative order-2 overflow-hidden border-t border-white/[0.08] p-7 sm:p-10 lg:order-none lg:border-t-0 lg:border-r lg:p-12">
          <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" aria-hidden />
          <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" aria-hidden />
          <div className="relative z-10 flex h-full flex-col">
            <span className="badge"><Sparkles aria-hidden size={14} />Your partner command centre</span>
            <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.04] tracking-[-.055em] sm:text-6xl">Every referral. <span className="gradient-text">Clearly tracked.</span></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">Sign in to build campaign links, follow client progress, review your commercial terms, and understand exactly where your commission stands.</p>

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              {benefits.map(([title, description, Icon]) => (
                <div key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                  <Icon aria-hidden size={18} className="text-cyan-300" />
                  <p className="mt-3 text-sm font-extrabold text-slate-200">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-8 text-xs text-slate-500"><span className="inline-flex items-center gap-2"><ShieldCheck aria-hidden size={15} className="text-emerald-300" />Protected by verified email ownership and secure sessions.</span></div>
          </div>
        </section>

        <section className="order-1 grid place-items-center p-5 sm:p-9 lg:order-none lg:p-12">
          <form className="w-full max-w-md" action="/auth/login" method="post">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300 shadow-lg shadow-cyan-950/20"><LockKeyhole aria-hidden size={22} /></div>
            <p className="eyebrow mt-6">Approved partners</p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">Welcome back.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Use the account you created during your application.</p>

            {query.status && messages[query.status] ? <div role="status" className="mt-5 rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] p-4 text-sm leading-6 text-emerald-100">{messages[query.status]}</div> : null}
            {query.error && errors[query.error] ? <div role="alert" className="mt-5 rounded-2xl border border-red-300/25 bg-red-300/[0.08] p-4 text-sm leading-6 text-red-100">{errors[query.error]}</div> : null}

            <label className="form-label mt-7">Email address<input className="input" name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
            <label className="form-label mt-4">Password<input className="input" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required /></label>
            <div className="mt-3 text-right text-sm"><Link className="font-semibold text-cyan-300 transition-colors hover:text-cyan-200" href="/partners/forgot">Forgot your password?</Link></div>
            <AsyncSubmitButton pendingLabel="Signing in…" className="btn-primary mt-6 min-h-12 w-full">Sign in securely <ArrowRight aria-hidden size={17} /></AsyncSubmitButton>

            <div className="mt-7 border-t border-white/[0.08] pt-6 text-sm text-slate-500">Not approved yet? <Link className="inline-flex items-center gap-1 font-bold text-cyan-300 transition-colors hover:text-cyan-200" href="/partners/apply">Submit a partner application <ArrowRight aria-hidden size={14} /></Link></div>
          </form>
        </section>
      </div>
    </Shell>
  );
}
