import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, KeyRound, MailCheck, ShieldCheck } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { AsyncSubmitButton } from '@/components/AsyncSubmitButton';

export const metadata: Metadata = {
  title: 'Reset access',
  description: 'Reset your Rapid Rise AI partner portal password or resend your verification email.',
};

const messages: Record<string, string> = {
  sent: 'If that email belongs to a partner account, a password reset link is on its way. Check your inbox (and spam folder).',
  resent: 'If that email has an unverified account, a new verification link has been sent. Check your inbox (and spam folder).',
};
const errors: Record<string, string> = {
  origin: 'For your protection, that request was rejected. Refresh this page and try again.',
  expired: 'That reset link has expired or was already used. Request a new one below.',
};

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const query = await searchParams;

  return (
    <Shell nav="public">
      <div className="mx-auto grid w-full max-w-md gap-6">
        <section className="glass rounded-[2rem] p-7 sm:p-9">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300">
            <KeyRound aria-hidden size={22} />
          </div>
          <p className="eyebrow mt-6">Account recovery</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-.04em]">Reset your password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Enter the email address from your partner application. We will send a secure link to set a new password.
          </p>

          {query.status && messages[query.status] ? (
            <div role="status" className="mt-5 rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] p-4 text-sm leading-6 text-emerald-100">
              {messages[query.status]}
            </div>
          ) : null}
          {query.error && errors[query.error] ? (
            <div role="alert" className="mt-5 rounded-2xl border border-red-300/25 bg-red-300/[0.08] p-4 text-sm leading-6 text-red-100">
              {errors[query.error]}
            </div>
          ) : null}

          <form className="mt-6" action="/auth/reset-request" method="post">
            <label className="form-label">Email address
              <input className="input" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
            </label>
            <AsyncSubmitButton pendingLabel="Sending reset link…" className="btn-primary mt-5 min-h-12 w-full">
              Send reset link <ArrowRight aria-hidden size={17} />
            </AsyncSubmitButton>
          </form>
        </section>

        <section className="glass rounded-[2rem] p-7 sm:p-9">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">
            <MailCheck aria-hidden size={20} />
          </div>
          <h2 className="mt-4 text-xl font-black">Didn’t get your verification email?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            If you applied but never confirmed your email, request a fresh verification link here.
          </p>
          <form className="mt-5" action="/auth/resend-verification" method="post">
            <label className="form-label">Email address
              <input className="input" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
            </label>
            <AsyncSubmitButton pendingLabel="Resending…" className="btn-muted mt-5 min-h-12 w-full">
              Resend verification email
            </AsyncSubmitButton>
          </form>
        </section>

        <p className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <ShieldCheck aria-hidden size={15} className="text-emerald-300" />
          <Link className="font-bold text-cyan-300 transition-colors hover:text-cyan-200" href="/partners/login">Back to sign in</Link>
        </p>
      </div>
    </Shell>
  );
}
