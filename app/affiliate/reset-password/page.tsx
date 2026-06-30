import { redirect } from 'next/navigation';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { AsyncSubmitButton } from '@/components/AsyncSubmitButton';
import { getAuthenticatedUser } from '@/lib/portal-auth';

const errors: Record<string, string> = {
  invalid: 'Enter a password of at least 8 characters in both fields, and make sure they match.',
  weak: 'Choose a stronger password that is different from your current one, then try again.',
  origin: 'For your protection, that request was rejected. Refresh this page and try again.',
};

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  // Reaching this page requires the recovery session minted by /auth/callback.
  const authUser = await getAuthenticatedUser();
  if (!authUser) redirect('/partners/forgot?error=expired');
  const { error } = await searchParams;

  return (
    <Shell>
      <section className="glass mx-auto max-w-md rounded-[2rem] p-7 sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300">
          <LockKeyhole aria-hidden size={22} />
        </div>
        <p className="eyebrow mt-6">Secure your account</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-.04em]">Set a new password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Choose a new password for <span className="font-semibold text-slate-300">{authUser.email}</span>. You will use it the next time you sign in.
        </p>

        {error && errors[error] ? (
          <div role="alert" className="mt-5 rounded-2xl border border-red-300/25 bg-red-300/[0.08] p-4 text-sm leading-6 text-red-100">
            {errors[error]}
          </div>
        ) : null}

        <form className="mt-6" action="/auth/reset-password" method="post">
          <label className="form-label">New password
            <input className="input" name="password" type="password" autoComplete="new-password" minLength={8} placeholder="At least 8 characters" required />
          </label>
          <label className="form-label mt-4">Confirm new password
            <input className="input" name="confirm_password" type="password" autoComplete="new-password" minLength={8} placeholder="Re-enter your new password" required />
          </label>
          <AsyncSubmitButton pendingLabel="Updating password…" className="btn-primary mt-6 min-h-12 w-full">
            Update password
          </AsyncSubmitButton>
        </form>

        <p className="mt-6 flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck aria-hidden size={14} className="text-emerald-300" />
          For your security you may be asked to sign in again afterwards.
        </p>
      </section>
    </Shell>
  );
}
