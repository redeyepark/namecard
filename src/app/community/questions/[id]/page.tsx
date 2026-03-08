import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerUser } from '@/lib/auth-utils';
import { getQuestionById } from '@/lib/question-storage';
import { QuestionDetail } from '@/components/community/QuestionDetail';
import { QuestionDetailActions } from './QuestionDetailActions';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  if (!UUID_REGEX.test(id)) {
    return { title: '질문을 찾을 수 없습니다 | Namecard' };
  }

  const question = await getQuestionById(id);

  if (!question) {
    return { title: '질문을 찾을 수 없습니다 | Namecard' };
  }

  const preview = question.content.length > 100
    ? question.content.substring(0, 100) + '...'
    : question.content;

  return {
    title: `${preview} | 커뮤니티 질문`,
    description: preview,
    openGraph: {
      title: `${preview} | 커뮤니티 질문`,
      description: preview,
    },
  };
}

export default async function QuestionDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (!UUID_REGEX.test(id)) {
    notFound();
  }

  const user = await getServerUser();
  const question = await getQuestionById(id, user?.id);

  if (!question) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-primary text-secondary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <Link
            href="/community/questions"
            className="inline-flex items-center gap-1 text-xs text-secondary/50 hover:text-secondary/80 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            질문 목록
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <QuestionDetailActions
          question={question}
          isAuthenticated={!!user}
        />
      </main>
    </div>
  );
}
