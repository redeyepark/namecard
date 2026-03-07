import type { Metadata } from 'next';
import Link from 'next/link';
import { getServerUser } from '@/lib/auth-utils';
import { CommunityNav } from '@/components/community/CommunityNav';
import { SurveyDetail } from '@/components/survey/SurveyDetail';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '설문 상세 | Namecard',
  description: '설문에 참여하고 결과를 확인하세요',
  openGraph: {
    title: '설문 상세 | Namecard',
    description: '설문에 참여하고 결과를 확인하세요',
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SurveyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getServerUser();

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <header className="bg-[#020912] text-[#fcfcfc]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <Link
            href="/community/surveys"
            className="inline-flex items-center gap-1 text-xs text-[#fcfcfc]/50 hover:text-[#fcfcfc]/80 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            설문 목록
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <SurveyDetail surveyId={id} isAuthenticated={!!user} />
      </main>
    </div>
  );
}
