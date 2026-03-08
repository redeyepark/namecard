import type { Metadata } from 'next';
import { getServerUser } from '@/lib/auth-utils';
import { CommunityNav } from '@/components/community/CommunityNav';
import { CoffeeChatDiscoverClient } from './CoffeeChatDiscoverClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '커피챗 | Namecard',
  description: '다른 회원들과 1:1 커피챗을 신청해 보세요',
  openGraph: {
    title: '커피챗 | Namecard',
    description: '다른 회원들과 1:1 커피챗을 신청해 보세요',
  },
};

export default async function CoffeeChatDiscoverPage() {
  const user = await getServerUser();

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-primary text-secondary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <h1 className="font-[family-name:var(--font-figtree),sans-serif] text-2xl sm:text-3xl font-bold tracking-tight">
            커뮤니티
          </h1>
          <p className="mt-1 text-sm text-secondary/50">
            관심 있는 회원에게 커피챗을 신청해 보세요
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6">
        <CommunityNav />
        <CoffeeChatDiscoverClient isAuthenticated={!!user} />
      </main>
    </div>
  );
}
