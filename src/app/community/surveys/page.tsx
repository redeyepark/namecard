import type { Metadata } from 'next';
import { getServerUser } from '@/lib/auth-utils';
import { CommunityNav } from '@/components/community/CommunityNav';
import { SurveyFeed } from '@/components/survey/SurveyFeed';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '커뮤니티 설문 | Namecard',
  description: '다양한 설문에 참여하고 의견을 나눠보세요',
  openGraph: {
    title: '커뮤니티 설문 | Namecard',
    description: '다양한 설문에 참여하고 의견을 나눠보세요',
  },
};

export default async function SurveysPage() {
  const user = await getServerUser();

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-primary text-secondary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <h1 className="font-[family-name:var(--font-figtree),sans-serif] text-2xl sm:text-3xl font-bold tracking-tight">
            커뮤니티
          </h1>
          <p className="mt-1 text-sm text-secondary/50">
            질문하고, 다양한 생각을 나눠보세요
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6">
        <CommunityNav />
        <SurveyFeed isAuthenticated={!!user} />
      </main>
    </div>
  );
}
