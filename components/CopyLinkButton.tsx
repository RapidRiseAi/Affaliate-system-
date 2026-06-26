'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export function CopyLinkButton({ value, className = '' }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      className={`btn btn-muted px-3 py-2 text-xs ${className}`}
      aria-label={copied ? 'Referral link copied' : 'Copy referral link'}
      title={copied ? 'Copied' : 'Copy link'}
    >
      {copied ? <Check aria-hidden size={14} /> : <Copy aria-hidden size={14} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
