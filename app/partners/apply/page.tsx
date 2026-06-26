import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, FileSignature, MailCheck, ShieldCheck, UserCheck } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { PartnerApplicationForm } from '@/components/PartnerApplicationForm';

export const metadata: Metadata = {
  title: 'Partner application',
  description: 'Apply to join the Rapid Rise AI Partner Network.',
};

const errors: Record<string, string> = {
  already_submitted: 'An application has already been submitted with this email address. Check your inbox for the verification email or sign in to view its status.',
  email_in_use: 'This email address is already in use. Sign in with the existing account or use a different email address.',
  invalid_application: 'Please check the highlighted information and submit again.',
  rate_limited: 'Too many attempts were made in a short time. Please wait a minute before trying again.',
  application_failed: 'We could not save the application. Please try again once.',
};

const journey = [
  ['Application', 'Tell us about you and your network.', UserCheck],
  ['Email verification', 'Prove ownership of your email address.', MailCheck],
  ['Review and agreement', 'We agree your model, rates, and terms.', FileSignature],
  ['Portal activation', 'Create links and follow referrals securely.', CheckCircle2],
] as const;

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <Shell nav="public">
      <section className="mb-9 px-2 pt-5 text-center sm:pt-8">
        <span className="badge"><UserCheck aria-hidden size={14} />Partner application</span>
        <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-bold leading-[1.04] tracking-[-.055em] sm:text-6xl">Let’s build a partnership that fits.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">There is no generic commission package. Tell us where you add value, and we will shape the right commercial model together.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[350px_1fr] lg:items-start">
        <aside className="glass rounded-[2rem] p-6 lg:sticky lg:top-28 lg:p-7">
          <p className="eyebrow">What happens next</p>
          <ol className="mt-6 grid gap-1">
            {journey.map(([title, description, Icon], index) => (
              <li key={title} className="relative flex gap-4 pb-6 last:pb-0">
                {index < journey.length - 1 ? <span className="absolute left-[19px] top-10 h-[calc(100%-2.1rem)] w-px bg-gradient-to-b from-cyan-300/35 to-white/[0.06]" aria-hidden /> : null}
                <span className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${index === 0 ? 'border-cyan-300/35 bg-cyan-300/10 text-cyan-200' : 'border-white/10 bg-white/[0.025] text-slate-500'}`}><Icon aria-hidden size={18} /></span>
                <div className="pt-0.5"><p className="text-sm font-extrabold text-slate-200">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>
              </li>
            ))}
          </ol>
          <div className="mt-7 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.045] p-4">
            <p className="flex items-center gap-2 text-xs font-extrabold text-emerald-200"><ShieldCheck aria-hidden size={16} />Your information is protected</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">Your application is reviewed privately and never becomes a public profile.</p>
          </div>
          <p className="mt-5 text-xs text-slate-500">Already submitted? <Link href="/partners/login" className="font-bold text-cyan-300 hover:text-cyan-200">Sign in to your portal</Link></p>
        </aside>

        <PartnerApplicationForm initialError={error ? errors[error] ?? errors.application_failed : undefined} />
      </div>
    </Shell>
  );
}
