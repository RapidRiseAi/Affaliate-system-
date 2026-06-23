import { Shell } from '@/components/Shell';

const fields = [
  ['first_name', 'First name'], ['surname', 'Surname'], ['business_name', 'Business name / Individual'],
  ['email', 'Email address'], ['phone', 'WhatsApp / phone number'], ['website_url', 'Website link (optional)'],
  ['social_links', 'Social media links (optional)'], ['google_business_url', 'Google Business Profile (optional)'],
  ['client_types', 'What type of clients do you work with?'], ['motivation', 'Why do you want to become a partner?'],
];

export default function Page() {
  return <Shell nav="public"><div className="mx-auto max-w-3xl glass rounded-[2rem] p-8">
    <span className="badge">Application</span><h1 className="mt-4 text-4xl font-black">Apply to become a Rapid Rise AI partner</h1>
    <form className="mt-7 grid gap-4" action="/api/partners/apply" method="post">
      {fields.map(([name, placeholder]) => <input key={name} className="input" name={name} placeholder={placeholder} required={!placeholder.includes('optional')} type={name === 'email' ? 'email' : 'text'} />)}
      <label className="grid gap-2 text-sm text-slate-300">Preferred commission model<select className="input" name="preferred_commission_model" required><option value="">Choose a preference</option><option value="BUILD_COST">Commission on project build cost</option><option value="LIFETIME">Lifetime commission</option></select><span className="text-xs text-slate-400">This is a preference only. Final model, terms and product-specific rates are negotiated before activation.</span></label>
      <input className="input" name="password" type="password" minLength={8} placeholder="Password (minimum 8 characters)" required />
      <input className="input" name="confirm_password" type="password" minLength={8} placeholder="Confirm password" required />
      <label className="flex gap-3 text-sm text-slate-300"><input type="checkbox" name="terms" required /> I acknowledge the terms, privacy notice and tracking rules.</label>
      <button className="btn btn-primary">Submit Partner Application</button>
    </form>
  </div></Shell>;
}
