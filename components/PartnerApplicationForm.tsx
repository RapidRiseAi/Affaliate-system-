'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CheckCircle2, Globe2, KeyRound, LoaderCircle, Network, ShieldCheck, TriangleAlert, UserRound } from 'lucide-react';

function TextField({ label, name, type = 'text', optional = false, wide = false, disabled = false, autoComplete, placeholder }: {
  label: string;
  name: string;
  type?: string;
  optional?: boolean;
  wide?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <label className={`form-label ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="flex items-center justify-between gap-3"><span>{label}</span>{optional ? <span className="form-hint">Optional</span> : null}</span>
      <input className="input" name={name} required={!optional} type={type} disabled={disabled} autoComplete={autoComplete} placeholder={placeholder} />
    </label>
  );
}

function SectionTitle({ icon: Icon, title, description, first = false }: { icon: typeof UserRound; title: string; description: string; first?: boolean }) {
  return (
    <div className={`form-section flex items-start gap-3 ${first ? '!border-t-0 !pt-0' : ''}`}>
      <span className="icon-tile h-10 w-10 shrink-0 rounded-xl"><Icon aria-hidden size={18} /></span>
      <div><h2 className="text-lg font-bold text-white">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>
    </div>
  );
}

export function PartnerApplicationForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const submissionLock = useRef(false);
  const [state, setState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [error, setError] = useState(initialError ?? '');
  const disabled = state !== 'idle';

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLock.current) return;
    submissionLock.current = true;
    setState('submitting');
    setError('');

    try {
      const response = await fetch('/api/partners/apply', {
        method: 'POST',
        body: new FormData(event.currentTarget),
        headers: { Accept: 'application/json', 'X-Portal-Request': 'fetch' },
      });
      const result = await response.json() as { error?: string; redirect?: string };
      if (!response.ok) {
        setError(result.error ?? 'We could not submit your application. Please try again.');
        setState('idle');
        submissionLock.current = false;
        return;
      }
      setState('success');
      window.setTimeout(() => router.push(result.redirect ?? '/partners/login?status=verify-email'), 700);
    } catch {
      setError('The connection was interrupted. Your details were not submitted again—please check your connection and retry once.');
      setState('idle');
      submissionLock.current = false;
    }
  }

  return (
    <form className="glass grid gap-x-5 gap-y-5 rounded-[2rem] p-5 sm:grid-cols-2 sm:p-7 md:p-9" onSubmit={submit}>
      <div className="sm:col-span-2 flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="eyebrow">Application details</p><h2 className="mt-2 text-2xl font-bold tracking-[-.03em]">Tell us about your reach.</h2></div>
        <span className="badge shrink-0"><ShieldCheck aria-hidden size={14} />Secure form</span>
      </div>

      {error ? (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-300/25 bg-red-300/[0.08] p-4 text-sm text-red-100 sm:col-span-2">
          <TriangleAlert className="mt-0.5 shrink-0 text-red-300" aria-hidden size={18} />
          <div><p className="font-bold">Application not submitted</p><p className="mt-1 text-red-100/80">{error}</p></div>
        </div>
      ) : null}
      {state === 'success' ? (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] p-4 text-sm text-emerald-100 sm:col-span-2">
          <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" aria-hidden size={18} />
          <div><p className="font-bold">Application received</p><p className="mt-1 text-emerald-100/80">Opening the email-verification instructions…</p></div>
        </div>
      ) : null}

      <SectionTitle icon={UserRound} title="Your details" description="The person we will contact about this partnership." first />
      <TextField label="First name" name="first_name" autoComplete="given-name" disabled={disabled} />
      <TextField label="Surname" name="surname" autoComplete="family-name" disabled={disabled} />
      <TextField label="Business or individual name" name="business_name" autoComplete="organization" disabled={disabled} wide />
      <TextField label="Email address" name="email" type="email" autoComplete="email" disabled={disabled} />
      <TextField label="WhatsApp or phone number" name="phone" type="tel" autoComplete="tel" disabled={disabled} />

      <SectionTitle icon={Globe2} title="Your presence" description="Optional links help us understand your audience and work." />
      <TextField label="Website" name="website_url" type="url" optional disabled={disabled} placeholder="https://" />
      <TextField label="Social media profiles" name="social_links" optional disabled={disabled} placeholder="LinkedIn, Instagram, or other profiles" />
      <TextField label="Google Business Profile" name="google_business_url" type="url" optional disabled={disabled} wide placeholder="https://" />

      <SectionTitle icon={Network} title="Your network" description="Help us understand the kinds of introductions you can make." />
      <label className="form-label sm:col-span-2">What types of clients do you work with?<textarea className="input min-h-28" name="client_types" required disabled={disabled} placeholder="Industries, business sizes, and the relationships you already have" /></label>
      <label className="form-label sm:col-span-2">Why do you want to become a partner?<textarea className="input min-h-32" name="motivation" required disabled={disabled} placeholder="Tell us how you see the partnership working" /></label>
      <label className="form-label sm:col-span-2">Preferred commission model
        <select className="input" name="preferred_commission_model" required disabled={disabled} defaultValue="">
          <option value="" disabled>Choose your preference</option>
          <option value="BUILD_COST">Commission on project build cost</option>
          <option value="RECURRING">Recurring commission (ongoing revenue)</option>
          <option value="LIFETIME">Lifetime commission (everything)</option>
        </select>
        <span className="form-hint">This records a preference only. Final terms and product-specific rates are negotiated before activation.</span>
      </label>

      <SectionTitle icon={KeyRound} title="Secure your account" description="You will use these details after verifying your email." />
      <label className="form-label">Create password<input className="input" name="password" type="password" autoComplete="new-password" minLength={8} required disabled={disabled} /><span className="form-hint">Use at least 8 characters and avoid a password used elsewhere.</span></label>
      <label className="form-label">Confirm password<input className="input" name="confirm_password" type="password" autoComplete="new-password" minLength={8} required disabled={disabled} /></label>

      <label className="flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-slate-300 transition-colors hover:border-cyan-300/25 sm:col-span-2">
        <input className="mt-1 h-4 w-4 shrink-0 accent-cyan-400" type="checkbox" name="terms" required disabled={disabled} />
        <span>I acknowledge the partner terms, privacy notice, and tracking rules.</span>
      </label>

      <div className="flex flex-col-reverse gap-4 border-t border-white/[0.08] pt-6 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck aria-hidden size={15} />One verified application per email address.</p>
        <button className="btn btn-primary min-h-12 w-full px-6 disabled:cursor-wait disabled:opacity-70 sm:w-auto" disabled={disabled} aria-busy={state === 'submitting'}>
          {state === 'submitting' ? <><LoaderCircle className="animate-spin" aria-hidden size={18} />Submitting application…</> : state === 'success' ? <><CheckCircle2 aria-hidden size={18} />Application received</> : <><Building2 aria-hidden size={18} />Submit partner application</>}
        </button>
      </div>
    </form>
  );
}
