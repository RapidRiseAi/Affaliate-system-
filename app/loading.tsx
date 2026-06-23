import { LoaderCircle } from 'lucide-react';

export default function Loading() {
  return <div className="flex min-h-[65vh] items-center justify-center px-5"><div role="status" className="glass flex max-w-sm flex-col items-center rounded-[2rem] p-8 text-center"><LoaderCircle className="animate-spin text-cyan-300" aria-hidden size={34} /><p className="mt-4 text-lg font-black">Loading your partner workspace</p><p className="mt-2 text-sm text-slate-400">Fetching the latest referrals and commission status…</p></div></div>;
}
