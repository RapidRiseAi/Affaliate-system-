'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useFormStatus } from 'react-dom';

export function AsyncSubmitButton({ children, pendingLabel, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return <button {...props} type="submit" disabled={pending || props.disabled} aria-busy={pending} className={`btn disabled:cursor-wait disabled:opacity-65 ${className}`}>
    {pending ? <LoaderCircle className="animate-spin" aria-hidden size={18} /> : null}
    {pending ? pendingLabel : children}
  </button>;
}
