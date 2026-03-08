'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { QuestionWithAuthor } from '@/types/question';

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 30) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

function QuestionCardCompact({ question }: { question: QuestionWithAuthor }) {
  return (
    <Link
      href={`/community/questions/${question.id}`}
      className="block border border-border-medium p-4 hover:border-primary/40 transition-all duration-200 bg-surface"
    >
      {/* Content preview (max 2 lines) */}
      <p className="text-sm text-primary/80 leading-relaxed line-clamp-2 mb-3">
        {question.content}
      </p>

      {/* Hashtags */}
      {question.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {question.hashtags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-primary/5 text-primary/70"
            >
              #{tag}
            </span>
          ))}
          {question.hashtags.length > 3 && (
            <span className="text-xs text-primary/40">
              +{question.hashtags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: author + thought count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {question.author.avatarUrl ? (
            <img
              src={question.author.avatarUrl}
              alt={question.author.displayName}
              className="w-5 h-5 object-cover"
            />
          ) : (
            <div className="w-5 h-5 bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary/50">
              {question.author.displayName.charAt(0)}
            </div>
          )}
          <span className="text-xs text-primary/50">
            {question.author.displayName}
          </span>
          <span className="text-xs text-primary/25">
            {getRelativeTime(question.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-primary/40">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
          <span>{question.thoughtCount}</span>
        </div>
      </div>
    </Link>
  );
}

export function RecentQuestions() {
  const [questions, setQuestions] = useState<QuestionWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchRecentQuestions() {
      try {
        const res = await fetch('/api/questions?limit=3&sort=latest');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setQuestions(data.questions);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentQuestions();
  }, []);

  // Do not render the section if loading failed or no questions
  if (error) return null;

  if (loading) {
    return (
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-[family-name:var(--font-figtree),sans-serif] text-lg font-bold text-primary">
            새로운 질문
          </h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-primary/8 p-4 animate-pulse"
            >
              <div className="h-4 bg-primary/5 w-3/4 mb-3" />
              <div className="h-3 bg-primary/5 w-1/2 mb-3" />
              <div className="flex items-center justify-between">
                <div className="h-3 bg-primary/5 w-20" />
                <div className="h-3 bg-primary/5 w-8" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (questions.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-[family-name:var(--font-figtree),sans-serif] text-lg font-bold text-primary">
          새로운 질문
        </h2>
        <Link
          href="/community/questions"
          className="text-xs text-primary/50 hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          전체 보기
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
      <div className="space-y-3">
        {questions.map((question) => (
          <QuestionCardCompact key={question.id} question={question} />
        ))}
      </div>
    </section>
  );
}
