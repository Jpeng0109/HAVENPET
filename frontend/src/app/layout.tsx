import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HAVENPET SCM',
  description: 'Global supply chain management for HAVENPET',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
