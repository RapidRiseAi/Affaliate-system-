'use client';

import { Printer } from 'lucide-react';

// Triggers the browser's print dialog, which includes "Save as PDF" on every
// major platform — giving affiliates a downloadable copy with no PDF dependency.
export function PrintButton({ label = 'Download / Print PDF', className }: { label?: string; className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      <Printer aria-hidden size={16} />
      {label}
    </button>
  );
}
