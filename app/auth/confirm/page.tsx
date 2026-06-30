import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { AsyncSubmitButton } from '@/components/AsyncSubmitButton';

const ALLOWED_TYPES = new Set(['recovery', 'email', 'signup', 'magiclink', 'email_change', 'invite']);

function safeNext(raw?: string) {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
    return '/affiliate/dashboard?verified=1';
  }
  return raw;
}

// Interstitial opened by the auth email link. Rendering this page does NOT verify
// anything — verification only happens when the user presses the button, which
// POSTs to /auth/verify-otp. This makes the single-use token immune to link
// prefetching by mobile browsers and mail-security scanners.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
}) {
  const { token_hash, type, next } = await searchParams;
  if (!token_hash || !type || !ALLOWED_TYPES.has(type)) {
    redirect('/partners/login?error=verification');
  }
  const safeNextPath = safeNext(next);
  const isRecovery = type === 'recovery';
  const heading = isRecovery ? 'Confirm password reset' : 'Confirm your email';
  const blurb = isRecovery
    ? 'For your security, confirm it’s really you. You’ll then choose a new password.'
    : 'Confirm your email address to activate your partner portal account.';
  const cta = isRecovery ? 'Continue to set password' : 'Confirm my email';

  return (
    <Shell nav="public">
      <section className="glass mx-auto max-w-md rounded-[2rem] p-7 text-center sm:p-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300">
          <ShieldCheck aria-hidden size={22} />
        </div>
        <p className="eyebrow mt-6">Secure confirmation</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-.04em]">{heading}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">{blurb}</p>

        <form className="mt-7" action="/auth/verify-otp" method="post">
          <input type="hidden" name="token_hash" value={token_hash} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="next" value={safeNextPath} />
          <AsyncSubmitButton pendingLabel="Confirming…" className="btn-primary min-h-12 w-full">
            {cta}
          </AsyncSubmitButton>
        </form>

        <p className="mt-5 text-xs leading-5 text-slate-500">
          This link can only be used once. If it has expired, request a new one from the sign-in page.
        </p>
      </section>
    </Shell>
  );
}
