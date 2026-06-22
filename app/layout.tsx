import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Rapid Rise AI Partners', description: 'Privacy-safe affiliate tracking system for Rapid Rise AI.' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><main>{children}</main></body></html>}
