import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Namecard Editor',
  description: 'Create and customize your business card',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-100">{children}</body>
    </html>
  );
}
