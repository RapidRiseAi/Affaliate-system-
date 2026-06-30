'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BarChart3, CircleDollarSign, FileSignature, FileText, LayoutDashboard, Link2, LogIn, LogOut, Megaphone, Send, Settings } from 'lucide-react';
import { AsyncSubmitButton } from './AsyncSubmitButton';

const affiliateLinks = [
  ['/affiliate/dashboard', 'Overview', LayoutDashboard],
  ['/affiliate/links', 'Links', Link2],
  ['/affiliate/promote', 'Promote', Megaphone],
  ['/affiliate/leads', 'Referrals', BarChart3],
  ['/affiliate/commissions', 'Earnings', CircleDollarSign],
  ['/affiliate/activity', 'Activity', Activity],
  ['/affiliate/agreement', 'Agreement', FileSignature],
  ['/affiliate/settings', 'Settings', Settings],
] as const;

const publicLinks = [
  ['/partners', 'Program', FileText],
  ['/partners/login', 'Login', LogIn],
  ['/partners/apply', 'Apply', Send],
] as const;

export function PortalNav({ mode }: { mode: 'affiliate' | 'public' }) {
  const pathname = usePathname();
  const links = mode === 'affiliate' ? affiliateLinks : publicLinks;

  return (
    <nav aria-label={mode === 'affiliate' ? 'Affiliate navigation' : 'Partner navigation'} className="fixed inset-x-3 bottom-3 z-50 flex justify-center rounded-2xl border border-white/10 bg-[#07101d]/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl md:static md:inset-auto md:rounded-xl md:border-0 md:bg-transparent md:p-0 md:shadow-none">
      <div className="flex w-full items-center justify-start gap-1 overflow-x-auto md:w-auto md:justify-end md:overflow-visible">
        {links.map(([href, label, Icon]) => {
          const active = pathname === href;
          const primary = mode === 'public' && href === '/partners/apply';
          return (
            <Link key={href} href={href} data-active={active} aria-current={active ? 'page' : undefined} className={`btn min-w-0 flex-1 px-3 py-2 text-xs md:flex-none md:px-4 md:text-sm ${primary ? 'btn-primary' : 'btn-muted'}`}>
              <Icon aria-hidden size={16} />
              <span>{label}</span>
            </Link>
          );
        })}
        {mode === 'affiliate' ? (
          <form action="/auth/logout" method="post">
            <AsyncSubmitButton pendingLabel="Signing out…" className="btn-quiet h-full px-3 py-2 text-xs md:text-sm" aria-label="Sign out">
              <LogOut aria-hidden size={17} />
              <span className="hidden lg:inline">Sign out</span>
            </AsyncSubmitButton>
          </form>
        ) : null}
      </div>
    </nav>
  );
}
