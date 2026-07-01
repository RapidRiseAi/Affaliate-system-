import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PrintButton } from '@/components/PrintButton';
import { getAuthenticatedUser, getPortalAffiliateContext } from '@/lib/portal-auth';
import { adminSupabase } from '@/lib/supabase';

// Standalone, light-themed document for "Save as PDF". Not wrapped in the portal
// Shell so it prints cleanly.
export default async function Page() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) redirect('/partners/login');
  const context = await getPortalAffiliateContext(authUser);
  if (!context) redirect('/affiliate/dashboard');

  const supabase = adminSupabase();
  const { data: agreements } = await supabase
    .from('affiliate_portal_agreements')
    .select('id,commission_model,default_rate_percent,status,effective_from,effective_to,signed_at,terms_summary')
    .eq('affiliate_id', context.affiliate.id)
    .order('created_at', { ascending: false });
  const agreement =
    (agreements ?? []).find((a) => a.status === 'ACTIVE') ??
    (agreements ?? []).find((a) => a.signed_at) ??
    (agreements ?? [])[0];

  const [{ data: rates }, { data: signature }] = agreement
    ? await Promise.all([
        supabase.from('affiliate_portal_agreement_rates').select('rate_percent,notes,services(name)').eq('agreement_id', agreement.id),
        supabase.from('affiliate_portal_agreement_signatures').select('signer_name,signer_email,agreement_sha256,signed_at,consent_version,consent_text').eq('agreement_id', agreement.id).maybeSingle(),
      ])
    : [{ data: [] }, { data: null }];

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
          <Link href="/affiliate/agreement" className="text-sm font-semibold text-cyan-700 underline">← Back to portal</Link>
          <PrintButton className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white" />
        </div>

        {!agreement ? (
          <p className="text-slate-600">No agreement is available yet.</p>
        ) : (
          <article className="rounded-xl border border-slate-200 p-8 shadow-sm print:border-0 print:p-0 print:shadow-none">
            <header className="border-b border-slate-200 pb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Rapid Rise AI · Partner Network</p>
              <h1 className="mt-2 text-2xl font-black">Affiliate Commission Agreement</h1>
              <p className="mt-1 text-sm text-slate-600">{context.affiliate.name} · Code {context.affiliate.tracking_code}</p>
            </header>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-slate-500">Commission model</dt><dd className="font-semibold">{agreement.commission_model === 'BUILD_COST' ? 'Build-cost commission' : agreement.commission_model === 'RECURRING' ? 'Recurring commission' : 'Lifetime commission'}</dd></div>
              <div><dt className="text-slate-500">Default rate</dt><dd className="font-semibold">{agreement.default_rate_percent ? `${agreement.default_rate_percent}%` : 'By product'}</dd></div>
              <div><dt className="text-slate-500">Effective from</dt><dd className="font-semibold">{agreement.effective_from ?? 'On signature'}</dd></div>
              <div><dt className="text-slate-500">Effective to</dt><dd className="font-semibold">{agreement.effective_to ?? 'Ongoing'}</dd></div>
              <div><dt className="text-slate-500">Status</dt><dd className="font-semibold">{agreement.status}</dd></div>
            </dl>

            {rates?.length ? (
              <section className="mt-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Product-specific rates</h2>
                <ul className="mt-2 grid gap-1 text-sm">
                  {rates.map((rate, index) => <li key={index}>{rate.services?.[0]?.name ?? 'Product'} — {rate.rate_percent}%{rate.notes ? ` (${rate.notes})` : ''}</li>)}
                </ul>
              </section>
            ) : null}

            <section className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Negotiated terms</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{agreement.terms_summary ?? '—'}</p>
            </section>

            <section className="mt-8 border-t border-slate-200 pt-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Electronic signature</h2>
              {signature ? (
                <div className="mt-2 grid gap-1 text-sm text-slate-700">
                  <p>Signed by <span className="font-semibold">{signature.signer_name}</span> ({signature.signer_email})</p>
                  <p>Signed at {new Date(signature.signed_at).toLocaleString('en-ZA')}</p>
                  <p className="text-slate-600">{signature.consent_text}</p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-500">Evidence SHA-256: {signature.agreement_sha256}</p>
                  <p className="font-mono text-xs text-slate-500">Consent version: {signature.consent_version}</p>
                </div>
              ) : agreement.signed_at ? (
                <p className="mt-2 text-sm text-slate-600">Signed {new Date(agreement.signed_at).toLocaleString('en-ZA')} (predates electronic-signature evidence).</p>
              ) : (
                <p className="mt-2 text-sm text-slate-600">Not yet signed.</p>
              )}
            </section>

            <footer className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-400">Generated {new Date().toLocaleString('en-ZA')} · Rapid Rise AI</footer>
          </article>
        )}
      </div>
    </main>
  );
}
