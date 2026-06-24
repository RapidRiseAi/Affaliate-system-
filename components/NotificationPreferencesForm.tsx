'use client';

import { useState } from 'react';
import { CheckCircle2, LoaderCircle, Save } from 'lucide-react';

const choices = [
  ['application_updates', 'Application updates', 'Approval, decline, and account-review decisions.'],
  ['agreement_updates', 'Agreement updates', 'New signature requests and signed-agreement confirmations.'],
  ['referral_updates', 'Referral updates', 'Important changes to attributed referral progress.'],
  ['commission_created', 'New commissions', 'A notice when a commission is first recorded.'],
  ['commission_status_updates', 'Commission status', 'Approval, payable, cancelled, or disputed changes.'],
  ['commission_paid', 'Commission paid', 'Confirmation when a commission is marked paid.'],
  ['payout_summaries', 'Payout summaries', 'Periodic summaries of payable and paid commission.'],
] as const;
type Key = typeof choices[number][0];
type Preferences = Record<Key, boolean>;

export function NotificationPreferencesForm({ initial }: { initial: Preferences }) {
  const [values, setValues] = useState(initial);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage('');
    try {
      const response = await fetch('/api/affiliate/notification-preferences', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      if (!response.ok) throw new Error('Your choices could not be saved.');
      setMessage('Notification choices saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Your choices could not be saved.');
    } finally {
      setPending(false);
    }
  };

  return <form onSubmit={submit} className="card grid gap-3">
    {choices.map(([key, title, description]) => <label key={key} className="flex cursor-pointer items-center justify-between gap-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-cyan-300/25"><span><span className="block font-black text-slate-100">{title}</span><span className="mt-1 block text-sm text-slate-400">{description}</span></span><input type="checkbox" className="h-5 w-5 shrink-0 accent-cyan-400" checked={values[key]} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.checked }))} disabled={pending} /></label>)}
    {message ? <p role="status" className="mt-2 flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 aria-hidden size={17} className="text-emerald-300" />{message}</p> : null}
    <button type="submit" className="btn btn-primary mt-2 min-h-12 disabled:cursor-wait disabled:opacity-65" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" aria-hidden size={18} /> : <Save aria-hidden size={18} />}{pending ? 'Saving choices…' : 'Save notification choices'}</button>
  </form>;
}
