import Link from 'next/link';
import type { Metadata } from 'next';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BadgePercent,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  Fingerprint,
  Handshake,
  Link2,
  LockKeyhole,
  MousePointerClick,
  Network,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import { Shell } from '@/components/Shell';

export const metadata: Metadata = {
  title: 'Partner Network',
  description: 'Refer, track, and earn through a transparent Rapid Rise AI partnership.',
};

const steps: Array<{ number: string; title: string; description: string; icon: LucideIcon }> = [
  { number: '01', title: 'Apply once', description: 'Tell us about your network, experience, and preferred commission model.', icon: UserCheck },
  { number: '02', title: 'Agree the fit', description: 'We review every application and negotiate the model, terms, and product rates.', icon: Handshake },
  { number: '03', title: 'Share trackable links', description: 'Create privacy-safe campaign links for the channels and audiences you know.', icon: Link2 },
  { number: '04', title: 'Follow and earn', description: 'See attributed progress, commissions, agreements, and payout status in one portal.', icon: TrendingUp },
];

const audiences = [
  ['Social media managers', Network],
  ['Marketers', TrendingUp],
  ['Consultants', BriefcaseBusiness],
  ['Creative professionals', Sparkles],
  ['IT service providers', ShieldCheck],
  ['Accountants and bookkeepers', WalletCards],
  ['POS and hospitality specialists', UsersRound],
  ['Connected business operators', Handshake],
] as const;

const faqs = [
  ['Does every partner receive 50% commission?', 'No. Up to 50% is the maximum we may advertise. Every model, percentage, product rate, and commercial term is negotiated and confirmed in the partner agreement.'],
  ['Do I need to quote or deliver the work?', 'No. Your role is to make a credible introduction using your tracking link. Rapid Rise AI handles discovery, proposals, delivery, and client operations.'],
  ['What client information can I see?', 'The portal shows privacy-safe attribution, service interest, and commercial progress. Private client contact details remain inside the CRM.'],
  ['Can my rates differ by service?', 'Yes. Agreements can use either a build-cost or lifetime model, with product-specific rates where appropriate.'],
];

function PreviewMetric({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
      <p className="text-[9px] font-extrabold uppercase tracking-[.13em] text-slate-500">{label}</p>
      <p className={`mt-2 text-sm font-extrabold ${accent}`}>{value}</p>
    </div>
  );
}

export default function Page() {
  return (
    <Shell nav="public">
      <section className="landing-hero px-5 py-8 sm:px-8 sm:py-11 lg:px-12 lg:py-14">
        <div className="relative z-10 grid gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <span className="badge"><Sparkles aria-hidden size={14} />Rapid Rise AI Partner Network</span>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.03] tracking-[-.058em] sm:text-5xl lg:text-[4.6rem]">
              Turn trusted introductions into <span className="gradient-text">tracked revenue.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Refer businesses that need websites, systems, automation, portals, dashboards, and AI solutions—then follow every privacy-safe milestone from one clear partner workspace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/partners/apply" className="btn btn-primary min-h-12 px-5">Apply to become a partner <ArrowRight aria-hidden size={18} /></Link>
              <Link href="/partners/login" className="btn btn-muted min-h-12 px-5">Open partner portal</Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-400">
              <span className="inline-flex items-center gap-2"><CheckCircle2 aria-hidden size={15} className="text-emerald-300" />No joining fee</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 aria-hidden size={15} className="text-emerald-300" />Manual review</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 aria-hidden size={15} className="text-emerald-300" />Custom terms</span>
            </div>
          </div>

          <div className="portal-preview float-soft p-3 sm:p-4" role="img" aria-label="Illustration of the partner dashboard">
            <div className="relative z-10 overflow-hidden rounded-[1.2rem] border border-white/[0.07] bg-[#07101d]">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-300/70" />
                  <span className="h-2 w-2 rounded-full bg-amber-300/70" />
                  <span className="h-2 w-2 rounded-full bg-emerald-300/70" />
                </div>
                <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-slate-500">Portal preview</span>
                <span className="flex items-center gap-2 text-[10px] font-bold text-emerald-200"><span className="signal-dot" />Tracking ready</span>
              </div>
              <div className="preview-grid p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-[10px] font-bold text-cyan-300">PARTNER OVERVIEW</p><p className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold">Everything in one view.</p></div>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300"><TrendingUp aria-hidden size={18} /></span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <PreviewMetric label="Clicks" value="Tracked" accent="text-cyan-200" />
                  <PreviewMetric label="Referrals" value="Attributed" accent="text-violet-200" />
                  <PreviewMetric label="Earnings" value="Verified" accent="text-emerald-200" />
                </div>
                <div className="mt-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.045] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-xs font-extrabold text-slate-200"><Link2 aria-hidden size={14} className="text-cyan-300" />Campaign link</span>
                    <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-[9px] font-bold text-emerald-200">ACTIVE</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2 font-mono text-[9px] text-slate-400"><LockKeyhole aria-hidden size={12} />rapidrise.ai/r/your-code/campaign</div>
                </div>
                <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between text-[10px]"><span className="font-bold text-slate-300">Referral progress</span><span className="text-slate-500">Privacy-safe</span></div>
                  <div className="mt-4 grid gap-3">
                    <div><div className="mb-1.5 flex justify-between text-[9px] text-slate-500"><span>Enquiry attributed</span><span>Complete</span></div><div className="pipeline-track"><div className="pipeline-fill w-full" /></div></div>
                    <div><div className="mb-1.5 flex justify-between text-[9px] text-slate-500"><span>Discovery</span><span>In progress</span></div><div className="pipeline-track"><div className="pipeline-fill w-2/3" /></div></div>
                    <div><div className="mb-1.5 flex justify-between text-[9px] text-slate-500"><span>Commission</span><span>Pending outcome</span></div><div className="pipeline-track"><div className="pipeline-fill w-1/3" /></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-glow-line absolute inset-x-12 bottom-0" aria-hidden />
      </section>

      <section className="trust-strip mt-5 grid grid-cols-2 divide-x divide-y divide-white/[0.07] overflow-hidden md:grid-cols-4 md:divide-y-0" aria-label="Program highlights">
        {[
          ['Up to 50%', 'Maximum advertised commission', BadgePercent],
          ['Your model', 'Build-cost or lifetime', FileCheck2],
          ['Your rates', 'Custom and product-specific', CircleDollarSign],
          ['Your data', 'Privacy-safe by design', Fingerprint],
        ].map(([value, label, Icon]) => (
          <div key={String(label)} className="p-4 sm:p-5">
            <Icon aria-hidden size={17} className="text-cyan-300" />
            <p className="mt-3 font-[family-name:var(--font-display)] text-lg font-bold text-white">{String(value)}</p>
            <p className="mt-1 text-[11px] leading-4 text-slate-500 sm:text-xs">{String(label)}</p>
          </div>
        ))}
      </section>

      <section id="how-it-works" className="scroll-mt-28 py-20 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:gap-14">
          <div className="lg:sticky lg:top-28 lg:h-fit">
            <p className="eyebrow">A clean path to partnership</p>
            <h2 className="mt-3 max-w-lg text-3xl font-bold leading-tight tracking-[-.045em] sm:text-5xl">Simple to start. Clear all the way through.</h2>
            <p className="mt-5 max-w-lg text-slate-400">You bring the relationship. Rapid Rise AI handles the technical sales process, delivery, and client operations.</p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {steps.map(({ number, title, description, icon: Icon }) => (
              <li key={number} className="landing-card card-interactive min-h-56 p-6">
                <div className="relative z-10 flex items-center justify-between"><span className="step-number">{number}</span><span className="icon-tile"><Icon aria-hidden size={20} /></span></div>
                <h3 className="relative z-10 mt-8 text-xl font-bold">{title}</h3>
                <p className="relative z-10 mt-3 text-sm leading-6 text-slate-400">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <article className="landing-card p-7 lg:col-span-2 lg:p-9">
          <div className="relative z-10 max-w-2xl">
            <span className="icon-tile"><ShieldCheck aria-hidden size={21} /></span>
            <p className="eyebrow mt-7">Built on trust</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-.04em] sm:text-4xl">See enough to stay informed—not private client data.</h2>
            <p className="mt-4 leading-7 text-slate-400">Follow service interest, attribution, pipeline stage, commission status, and payout progress while sensitive contact details stay protected inside the CRM.</p>
            <ul className="mt-6 grid gap-3 text-sm font-bold text-slate-300 sm:grid-cols-2">
              {['Privacy-safe referral status', 'CRM-backed commission records', 'Secure electronic agreements', 'Clear payout history'].map((item) => <li key={item} className="flex items-center gap-2"><Check aria-hidden size={16} className="text-emerald-300" />{item}</li>)}
            </ul>
          </div>
        </article>
        <article className="landing-card p-7 lg:p-9">
          <div className="relative z-10">
            <span className="icon-tile"><BadgePercent aria-hidden size={21} /></span>
            <p className="eyebrow mt-7">Terms that fit</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-.04em]">No one-size-fits-all rate.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">Choose a preference when applying. Final models, percentages, and service-specific rates are reviewed and agreed before activation.</p>
          </div>
        </article>
      </section>

      <section id="who-its-for" className="scroll-mt-28 py-20 sm:py-24">
        <div className="glass overflow-hidden rounded-[2rem] p-7 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div><p className="eyebrow">Who it is for</p><h2 className="mt-3 text-3xl font-bold tracking-[-.045em] sm:text-5xl">People businesses already trust.</h2></div>
            <p className="max-w-2xl text-slate-400 lg:justify-self-end">You do not need to be a technical salesperson. The strongest partners simply recognise when a business needs a better digital system and make the introduction.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {audiences.map(([label, Icon]) => <span className="audience-pill" key={label}><Icon aria-hidden size={15} />{label}</span>)}
          </div>
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[.75fr_1.25fr]">
        <div><p className="eyebrow">Good questions, clear answers</p><h2 className="mt-3 text-3xl font-bold tracking-[-.045em] sm:text-4xl">Know the model before you apply.</h2></div>
        <div className="grid gap-3">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group rounded-2xl border border-white/[0.09] bg-white/[0.025] p-5 open:border-cyan-300/20 open:bg-cyan-300/[0.035]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-bold text-slate-100"><span>{question}</span><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 text-cyan-300 transition-transform group-open:rotate-45" aria-hidden>+</span></summary>
              <p className="mt-4 max-w-3xl border-t border-white/[0.07] pt-4 text-sm leading-7 text-slate-400">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-hero mt-20 p-7 text-center sm:p-12 md:mt-24 md:p-16">
        <div className="relative z-10 mx-auto max-w-3xl">
          <span className="badge"><MousePointerClick aria-hidden size={14} />Ready when you are</span>
          <h2 className="mt-6 text-3xl font-bold tracking-[-.05em] sm:text-5xl">Your next introduction could become a lasting partnership.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-slate-400">Apply once, verify your email, and let us build the right commercial model together.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/partners/apply" className="btn btn-primary min-h-12 px-6">Start your application <ArrowRight aria-hidden size={18} /></Link>
            <Link href="/partners/login" className="btn btn-muted min-h-12 px-6">Already a partner?</Link>
          </div>
          <p className="mt-5 text-[11px] leading-5 text-slate-600">* Up to 50% is a maximum advertised commission, not a guaranteed standard rate. All terms are individually negotiated.</p>
        </div>
      </section>
    </Shell>
  );
}
