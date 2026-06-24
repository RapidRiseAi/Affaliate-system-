import { redirect } from 'next/navigation';
import { BadgeCheck, Clock3, FileSignature, ShieldCheck } from 'lucide-react';
import { SignaturePad } from '@/components/SignaturePad';
import { Shell } from '@/components/Shell';
import { getAuthenticatedUser, getPortalAffiliateContext } from '@/lib/portal-auth';
import { adminSupabase } from '@/lib/supabase';

type Agreement = {
  id: string;
  commission_model: 'BUILD_COST' | 'LIFETIME';
  default_rate_percent: number | null;
  status: string;
  effective_from: string | null;
  effective_to: string | null;
  signed_at: string | null;
  terms_summary: string | null;
  signature_request_expires_at: string | null;
};

export default async function Page() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) redirect('/partners/login');
  const context = await getPortalAffiliateContext(authUser);
  if (!context) redirect('/affiliate/dashboard');
  const supabase = adminSupabase();
  const { data } = await supabase
    .from('affiliate_portal_agreements')
    .select('id,commission_model,default_rate_percent,status,effective_from,effective_to,signed_at,terms_summary,signature_request_expires_at')
    .eq('affiliate_id', context.affiliate.id)
    .order('created_at', { ascending: false });
  const agreements = (data ?? []) as Agreement[];
  const pendingAgreement = agreements.find((agreement) => agreement.status === 'PENDING_SIGNATURE');
  const currentAgreement = pendingAgreement ?? agreements.find((agreement) => agreement.status === 'ACTIVE') ?? agreements[0];
  const [{ data: rates }, { data: signature }] = currentAgreement
    ? await Promise.all([
        supabase.from('affiliate_portal_agreement_rates').select('rate_percent,notes,services(name)').eq('agreement_id', currentAgreement.id),
        supabase.from('affiliate_portal_agreement_signatures').select('signer_name,signer_email,agreement_sha256,signed_at,consent_version').eq('agreement_id', currentAgreement.id).maybeSingle(),
      ])
    : [{ data: [] }, { data: null }];
  const requestExpired = Boolean(currentAgreement?.signature_request_expires_at && new Date(currentAgreement.signature_request_expires_at) <= new Date());

  return <Shell>
    <section className="glass rounded-[2rem] p-7 md:p-10">
      <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="eyebrow">Electronic agreement</p><h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Your partner terms</h1><p className="mt-3 max-w-3xl text-slate-300">Review the exact commercial terms before signing. The signed snapshot is hashed and retained as immutable evidence.</p></div><span className="badge"><ShieldCheck aria-hidden size={15} />Verified portal identity</span></div>
      {!currentAgreement ? <div className="card mt-7"><p className="text-slate-300">No agreement has been prepared yet. Rapid Rise AI will notify you when your negotiated terms are ready.</p></div> : <div className="mt-7 grid gap-6 xl:grid-cols-[.72fr_1.28fr]">
        <aside className="card h-fit"><div className="flex items-center gap-3"><FileSignature aria-hidden className="text-cyan-300" /><div><p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">Status</p><p className="font-black">{currentAgreement.status.replaceAll('_', ' ')}</p></div></div><dl className="mt-6 grid gap-4 text-sm"><div><dt className="text-slate-500">Commission model</dt><dd className="mt-1 font-bold">{currentAgreement.commission_model === 'BUILD_COST' ? 'Build-cost commission' : 'Lifetime commission'}</dd></div><div><dt className="text-slate-500">Default rate</dt><dd className="mt-1 text-2xl font-black text-cyan-300">{currentAgreement.default_rate_percent ? `${currentAgreement.default_rate_percent}%` : 'By product'}</dd></div><div><dt className="text-slate-500">Effective period</dt><dd className="mt-1 font-bold">{currentAgreement.effective_from ?? 'On signature'} — {currentAgreement.effective_to ?? 'Ongoing'}</dd></div></dl>{rates?.length ? <div className="mt-6 border-t border-white/10 pt-5"><p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">Product rates</p><ul className="mt-3 grid gap-2">{rates.map((rate, index) => <li key={index} className="rounded-xl bg-cyan-300/[0.07] px-3 py-2 text-sm text-cyan-100">{rate.services?.[0]?.name ?? 'Product'} · {rate.rate_percent}%</li>)}</ul></div> : null}</aside>
        <article className="card"><h2 className="text-2xl font-black">Negotiated terms</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">{currentAgreement.terms_summary}</p>{currentAgreement.status === 'PENDING_SIGNATURE' && !requestExpired ? <SignaturePad agreementId={currentAgreement.id} /> : null}{requestExpired ? <div className="mt-6 flex gap-3 rounded-2xl border border-amber-300/25 bg-amber-300/[0.08] p-4 text-sm text-amber-100"><Clock3 aria-hidden className="shrink-0" /><p>This signature request has expired. Rapid Rise AI must review and resend it before you can sign.</p></div> : null}{currentAgreement.signed_at ? <div className="mt-6 rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.07] p-5"><div className="flex items-center gap-2 font-black text-emerald-200"><BadgeCheck aria-hidden size={20} />Signed {new Date(currentAgreement.signed_at).toLocaleString('en-ZA')}</div>{signature ? <div className="mt-3 grid gap-1 text-xs text-slate-400"><p>Signer: {signature.signer_name} ({signature.signer_email})</p><p className="break-all font-mono">Evidence hash: {signature.agreement_sha256}</p><p>Consent: {signature.consent_version}</p></div> : <p className="mt-2 text-xs text-slate-400">This agreement predates the electronic-signature system. Its original signed timestamp remains preserved.</p>}</div> : null}</article>
      </div>}
    </section>
  </Shell>;
}
