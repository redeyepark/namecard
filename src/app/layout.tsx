import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { KakaoProvider } from '@/components/providers/KakaoProvider';
import { ToastProvider } from '@/components/ui/ToastProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Namecard Editor',
  description: 'Create and customize your business card',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anonymous+Pro:wght@400;700&family=Figtree:wght@400;500;600;700&family=Nanum+Myeongjo:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#fcfcfc]">
        <AuthProvider>
          <KakaoProvider>
            <ToastProvider>{children}</ToastProvider>
          </KakaoProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
