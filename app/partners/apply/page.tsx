import { Shell } from '@/components/Shell';
import { PartnerApplicationForm } from '@/components/PartnerApplicationForm';

const errors: Record<string, string> = {
  already_submitted: 'An application has already been submitted with this email address. Check your inbox for the verification email or sign in to view its status.',
  email_in_use: 'This email address is already in use. Sign in with the existing account or use a different email address.',
  invalid_application: 'Please check the highlighted information and submit again.',
  rate_limited: 'Too many attempts were made in a short time. Please wait a minute before trying again.',
  application_failed: 'We could not save the application. Please try again once.',
};

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <Shell nav="public"><div className="mx-auto max-w-4xl">
    <section className="mb-6 px-2 text-center"><p className="eyebrow">Partner application</p><h1 className="mt-3 text-4xl font-black tracking-[-.04em] md:text-6xl">Build a valuable referral partnership.</h1><p className="mx-auto mt-4 max-w-2xl text-slate-300">Tell us about your network and preferred commission model. Every agreement and rate is reviewed and negotiated individually.</p></section>
    <PartnerApplicationForm initialError={error ? errors[error] ?? errors.application_failed : undefined} />
  </div></Shell>;
}
