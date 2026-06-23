import { ShieldCheck } from 'lucide-react';
import { Shell } from '@/components/Shell';

const fields: Array<{ name: string; label: string; type?: string; optional?: boolean; wide?: boolean }> = [
  { name: 'first_name', label: 'First name' }, { name: 'surname', label: 'Surname' },
  { name: 'business_name', label: 'Business or individual name', wide: true },
  { name: 'email', label: 'Email address', type: 'email' }, { name: 'phone', label: 'WhatsApp or phone number', type: 'tel' },
  { name: 'website_url', label: 'Website link', optional: true }, { name: 'social_links', label: 'Social media links', optional: true },
  { name: 'google_business_url', label: 'Google Business Profile', optional: true, wide: true },
];

export default function Page() {
  return <Shell nav="public"><div className="mx-auto max-w-4xl">
    <section className="mb-6 px-2 text-center"><p className="eyebrow">Partner application</p><h1 className="mt-3 text-4xl font-black tracking-[-.04em] md:text-6xl">Build a valuable referral partnership.</h1><p className="mx-auto mt-4 max-w-2xl text-slate-300">Tell us about your network and preferred commission model. Every agreement and rate is reviewed and negotiated individually.</p></section>
    <form className="glass grid gap-5 rounded-[2rem] p-6 sm:grid-cols-2 md:p-9" action="/api/partners/apply" method="post">
      {fields.map((field) => <label key={field.name} className={`grid gap-2 text-sm font-semibold text-slate-300 ${field.wide ? 'sm:col-span-2' : ''}`}>{field.label}{field.optional ? <span className="font-normal text-slate-500">Optional</span> : null}<input className="input" name={field.name} required={!field.optional} type={field.type ?? 'text'} /></label>)}
      <label className="grid gap-2 text-sm font-semibold text-slate-300 sm:col-span-2">What types of clients do you work with?<textarea className="input min-h-24" name="client_types" required /></label>
      <label className="grid gap-2 text-sm font-semibold text-slate-300 sm:col-span-2">Why do you want to become a partner?<textarea className="input min-h-28" name="motivation" required /></label>
      <label className="grid gap-2 text-sm font-semibold text-slate-300 sm:col-span-2">Preferred commission model<select className="input" name="preferred_commission_model" required><option value="">Choose a preference</option><option value="BUILD_COST">Commission on project build cost</option><option value="LIFETIME">Lifetime commission</option></select><span className="font-normal text-slate-500">This is a preference only. Final terms and product-specific rates are negotiated before activation.</span></label>
      <label className="grid gap-2 text-sm font-semibold text-slate-300">Create password<input className="input" name="password" type="password" autoComplete="new-password" minLength={8} required /><span className="font-normal text-slate-500">Minimum 8 characters</span></label>
      <label className="grid gap-2 text-sm font-semibold text-slate-300">Confirm password<input className="input" name="confirm_password" type="password" autoComplete="new-password" minLength={8} required /></label>
      <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm text-slate-300 sm:col-span-2"><input className="mt-1" type="checkbox" name="terms" required /><span>I acknowledge the terms, privacy notice and tracking rules.</span></label>
      <div className="flex flex-wrap items-center justify-between gap-4 sm:col-span-2"><p className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck aria-hidden size={15} />Email ownership must be verified before approval.</p><button className="btn btn-primary w-full sm:w-auto">Submit partner application</button></div>
    </form>
  </div></Shell>;
}
