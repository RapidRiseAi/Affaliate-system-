import type { Metadata, Viewport } from 'next';
import { Manrope, Space_Grotesk } from 'next/font/google';
import './globals.css';

const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Rapid Rise AI Partner Network',
    template: '%s · Rapid Rise AI Partners',
  },
  description: 'Earn through transparent, privacy-safe referrals to Rapid Rise AI.',
  openGraph: {
    title: 'Rapid Rise AI Partner Network',
    description: 'A clearer way to refer, track and earn with Rapid Rise AI.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#060a12',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>{children}</body>
    </html>
  );
}
