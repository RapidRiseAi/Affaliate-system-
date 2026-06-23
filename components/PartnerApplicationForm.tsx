'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, LoaderCircle, ShieldCheck, TriangleAlert } from 'lucide-react';

const fields: Array<{ name: string; label: string; type?: string; optional?: boolean; wide?: boolean }> = [
  { name: 'first_name', label: 'First name' }, { name: 'surname', label: 'Surname' },
  { name: 'business_name', label: 'Business or individual name', wide: true },
  { name: 'email', label: 'Email address', type: 'email' }, { name: 'phone', label: 'WhatsApp or phone number', type: 'tel' },
  { name: 'website_url', label: 'Website link', optional: true }, { name: 'social_links', label: 'Social media links', optional: true },
  { name: 'google_business_url', label: 'Google Business Profile', optional: true, wide: true },
];

export function PartnerApplicationForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const submissionLock = useRef(false);
  const [state, setState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [error, setError] = useState(initialError ?? '');

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

  return <form className="glass grid gap-5 rounded-[2rem] p-6 sm:grid-cols-2 md:p-9" onSubmit={submit} noValidate={false}>
    {error ? <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-300/25 bg-red-300/[0.08] p-4 text-sm text-red-100 sm:col-span-2"><TriangleAlert className="mt-0.5 shrink-0 text-red-300" aria-hidden size={18} /><div><p className="font-bold">Application not submitted</p><p className="mt-1 text-red-100/80">{error}</p></div></div> : null}
    {state === 'success' ? <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-300/25 bg-emerald-300/[0.08] p-4 text-sm text-emerald-100 sm:col-span-2"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" aria-hidden size={18} /><div><p className="font-bold">Application received</p><p className="mt-1 text-emerald-100/80">Opening the email-verification instructions…</p></div></div> : null}
    {fields.map((field) => <label key={field.name} className={`grid gap-2 text-sm font-semibold text-slate-300 ${field.wide ? 'sm:col-span-2' : ''}`}>{field.label}{field.optional ? <span className="font-normal text-slate-500">Optional</span> : null}<input className="input" name={field.name} required={!field.optional} type={field.type ?? 'text'} disabled={state !== 'idle'} /></label>)}
    <label className="grid gap-2 text-sm font-semibold text-slate-300 sm:col-span-2">What types of clients do you work with?<textarea className="input min-h-24" name="client_types" required disabled={state !== 'idle'} /></label>
    <label className="grid gap-2 text-sm font-semibold text-slate-300 sm:col-span-2">Why do you want to become a partner?<textarea className="input min-h-28" name="motivation" required disabled={state !== 'idle'} /></label>
    <label className="grid gap-2 text-sm font-semibold text-slate-300 sm:col-span-2">Preferred commission model<select className="input" name="preferred_commission_model" required disabled={state !== 'idle'}><option value="">Choose a preference</option><option value="BUILD_COST">Commission on project build cost</option><option value="LIFETIME">Lifetime commission</option></select><span className="font-normal text-slate-500">This is a preference only. Final terms and product-specific rates are negotiated before activation.</span></label>
    <label className="grid gap-2 text-sm font-semibold text-slate-300">Create password<input className="input" name="password" type="password" autoComplete="new-password" minLength={8} required disabled={state !== 'idle'} /><span className="font-normal text-slate-500">Minimum 8 characters</span></label>
    <label className="grid gap-2 text-sm font-semibold text-slate-300">Confirm password<input className="input" name="confirm_password" type="password" autoComplete="new-password" minLength={8} required disabled={state !== 'idle'} /></label>
    <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm text-slate-300 sm:col-span-2"><input className="mt-1" type="checkbox" name="terms" required disabled={state !== 'idle'} /><span>I acknowledge the terms, privacy notice and tracking rules.</span></label>
    <div className="flex flex-wrap items-center justify-between gap-4 sm:col-span-2"><p className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck aria-hidden size={15} />Only one application can be submitted per email address.</p><button className="btn btn-primary w-full disabled:cursor-wait disabled:opacity-70 sm:w-auto" disabled={state !== 'idle'} aria-busy={state === 'submitting'}>{state === 'submitting' ? <><LoaderCircle className="animate-spin" aria-hidden size={18} />Submitting application…</> : state === 'success' ? <><CheckCircle2 aria-hidden size={18} />Application received</> : 'Submit partner application'}</button></div>
  </form>;
}
